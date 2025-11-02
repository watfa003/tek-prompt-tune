import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { 
  scorePromptStatic, 
  scorePromptTested,
  scorePromptAndOutput,
  calculateTotalScore, 
  type CategoryScores 
} from '../shared/master-grader.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface LabRequest {
  mode: 'single' | 'compare';
  target_llm: string;
  prompt_a: string;
  prompt_b?: string;
  test_task?: string;
}

// CategoryScores imported from master-grader.ts

interface DiagnoseResult {
  total_score: number;
  category_breakdown: CategoryScores;
  ai_analysis: {
    strengths?: string[];
    weaknesses?: string[];
    suggested_fixes: string[];
    explanation?: Record<string, string>;
  };
}

interface BattleResult {
  prompt_a_score: number;
  prompt_b_score: number;
  prompt_a_breakdown: CategoryScores;
  prompt_b_breakdown: CategoryScores;
  winner: 'A' | 'B' | 'Tie';
  reasoning: string;
  comparison: Record<string, string>;
}

// Removed - now using master-grader.ts

// Helper to call AI models
async function callAIModel(prompt: string, targetLLM: string, testTask?: string): Promise<string> {
  const systemMessage = testTask 
    ? `You are a helpful AI assistant. ${testTask}` 
    : "You are a helpful AI assistant.";
  
  const userMessage = prompt;
  
  // Parse LLM selection
  const [provider, model] = targetLLM.split('/');
  
  try {
    // Route all model calls through Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const mapToLovableModel = (prov: string, mdl?: string) => {
      const m = mdl || '';
      if (prov === 'openai') {
        if (m.includes('gpt-5-nano')) return 'openai/gpt-5-nano';
        if (m.includes('gpt-5-mini')) return 'openai/gpt-5-mini';
        if (m.includes('gpt-5')) return 'openai/gpt-5';
        // Map legacy OpenAI selections to a supported default
        return 'openai/gpt-5-mini';
      }
      if (prov === 'google') {
        if (m.includes('pro')) return 'google/gemini-2.5-pro';
        if (m.includes('flash-lite')) return 'google/gemini-2.5-flash-lite';
        return 'google/gemini-2.5-flash';
      }
      // Default
      return 'google/gemini-2.5-flash';
    };

    const mappedModel = mapToLovableModel(provider, model);

    const body: Record<string, unknown> = {
      model: mappedModel,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
    };

    // Token parameter differences
    if (mappedModel.startsWith('openai/gpt-5')) {
      body.max_completion_tokens = 2048; // GPT-5 uses max_completion_tokens
    } else {
      body.max_tokens = 1024; // Others accept max_tokens
      // Avoid temperature for GPT-5 models per spec
      body.temperature = 0.2;
    }

    console.log('📦 Lovable AI request:', {
      mappedModel,
      provider,
      originalModel: model,
      systemPromptLength: systemMessage.length,
      userPromptLength: userMessage.length,
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Lovable AI response status:', response.status, 'model:', mappedModel);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Lovable AI error:', response.status, errText);
      if (response.status === 429) throw new Error('Rate limits exceeded (429)');
      if (response.status === 402) throw new Error('Payment required (402)');
      throw new Error(`AI gateway error: ${errText}`);
    }

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) {
      console.error('❌ Lovable AI returned empty content', JSON.stringify(data, null, 2));
      const finish = data?.choices?.[0]?.finish_reason;
      throw new Error(`AI returned no content. Finish reason: ${finish ?? 'unknown'}`);
    }

    console.log('✅ Lovable AI success:', mappedModel, 'len:', content.length);
    return content;
  } catch (error) {
    console.error('❌ Error calling AI model:', {
      provider,
      model,
      targetLLM,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
  
  console.error('❌ Unsupported provider:', provider);
  throw new Error(`Unsupported provider: ${provider}`);
}

// Removed - now using master-grader.ts

// Generate AI-powered analysis with output-based diagnostic
async function generateAnalysis(prompt: string, scores: CategoryScores, output?: string): Promise<any> {
  const systemPrompt = `You are the PromptTek Lab Calibration Model, an expert evaluator of AI prompt quality.
Your purpose is to synchronize scoring behavior across all categories so that excellent prompts score near 10 and weak ones score near 0.

You must follow the numeric scale faithfully and never downgrade a prompt solely because it is long — evaluate efficiency of instruction, not word count.

⚙️ INPUT CONTEXT
PROMPT:
{prompt}

MODEL OUTPUT:
{model_output}

CATEGORY SCORES (0–10):
Clarity: {clarity}
Specificity: {specificity}
Efficiency: {efficiency}
Structure: {structure}
Constraints: {constraints}
Elaboration: {elaboration}
Intent Alignment: {intent_alignment}
Adaptability: {adaptability}

🎯 CALIBRATION RULES
1. True Numeric Scale
Range	Meaning	Description
0–2	Failing	Incoherent, aimless, or unusable.
3–4	Weak	Vague or inconsistent; model must guess intent.
5–6	Adequate	Functional but lacks precision or structure.
7–8	Strong	Clear, organized, practical for general use.
9–10	Expert-Level	Highly optimized, professional, publication-ready.

2. Category Calibration

Clarity: Judge by presence of explicit action verbs and well-defined goal.

Do not reward "brevity" if intent is ambiguous.

Specificity: Reward measurable or example-based details.

Penalize only if the user's task could be interpreted multiple ways.

Efficiency:

CRITICAL: Length is NOT a penalty. Efficiency measures wasted words, not total words.
A 200-word prompt with zero fluff = 10/10 efficiency.
A 20-word prompt with vague filler = 3/10 efficiency.
Only penalize when you detect: repetition, contradictions, meaningless filler words, or redundant instructions.
Comprehensive, detailed prompts with all necessary context should score 9-10.

Structure: Look for numbered or sectioned format; explicit step flow.

10 = clear, hierarchical organization.

Constraints: EXPANDED RECOGNITION CRITERIA

✅ Credit ALL of these as constraints:
• Numerical limits (word counts, token limits, character counts)
• Tone or style definitions ("professional," "casual," "technical")
• Format requirements ("Markdown," "JSON," "bullet points," "numbered list")
• Implicit structural limits ("three sections," "five examples," "step-by-step")
• Negative constraints ("avoid," "exclude," "don't use")
• Quality bounds ("concise," "detailed," "brief")

A prompt with 3+ of these = 9–10 for constraints.
Do NOT require every type to be present.

Elaboration: EXPANDED RECOGNITION CRITERIA — BE GENEROUS

✅ Credit ALL of these as elaboration (even minimal presence counts):
• Background context ("this is for X audience," "the purpose is Y")
• Reasoning or justification ("because," "in order to," "to help")
• Examples or use cases ("such as," "for instance," "e.g.")
• Instructional context (explaining what good output looks like)
• ANY contextual detail beyond the bare instruction

Elaboration does NOT require narrative prose or extensive explanation.
A prompt with 1+ of these = 8–9 for elaboration.
A prompt with 2+ of these = 9–10 for elaboration.
Even a brief "for X purpose" or single example qualifies as elaboration ≥ 7.

Intent Alignment: Measure how well the model output matched what the prompt asked for.

Adaptability: EXPANDED RECOGNITION CRITERIA

✅ Adaptability = reusability across similar domains with minimal edits.

Examples of adaptable prompts:
• Policy brief prompt → could work for education, healthcare, business
• Product description prompt → could work for software, hardware, services
• Analysis prompt → could work for different data types or topics

Only penalize if the prompt is so domain-specific it cannot transfer (e.g., "analyze THIS specific dataset with THIS unique ID").

Flexibility markers ("if," "depending," "consider") boost adaptability.
General structure + swappable details = 9–10 adaptability.

3. High-Quality Handling — MAINTAIN NUMERIC INTEGRITY

CRITICAL: Do NOT cap categories at 6 or 7 "for balance."

If a prompt demonstrates excellence in a category, it must score 9–10.

If ≥5 categories are 9 or higher, explicitly acknowledge the prompt as "Expert-Level" or "Publication-Ready."

Only apply deductions when there is a clear, measurable shortcoming—not to "balance out" high scores.

4. Textual Explanation Behavior

Explain scores truthfully but proportionally:

Low scores → analytical and corrective.

High scores → validating and professional.

Always include a one-sentence summary_comment that captures overall performance.

🧾 OUTPUT FORMAT (JSON Only)
{
  "strengths": ["..."],          // optional, omit if none
  "weaknesses": ["..."],         // optional
  "suggested_fixes": ["..."],    // 3–4 concrete improvements or [] if not needed
  "explanation": {
    "clarity": "...",
    "specificity": "...",
    "efficiency": "...",
    "structure": "...",
    "constraints": "...",
    "elaboration": "...",
    "intent_alignment": "...",
    "adaptability": "..."
  },
  "summary_comment": "..."
}

🧩 Behavioral Rules for Edge Cases

If a prompt is nonsense or single-word, every category ≤ 3.

CRITICAL: If a prompt is comprehensive and detailed without fluff or repetition, efficiency must be 9-10 regardless of length.

CRITICAL: If a prompt has 3+ constraint types (format + tone + limits), constraints must be ≥ 9.

CRITICAL: If a prompt provides ANY context, reasoning, or examples (even brief), elaboration must be ≥ 7. If it has multiple forms of context, elaboration must be ≥ 9.

CRITICAL: If a prompt structure is generalizable to similar domains, adaptability must be ≥ 8.

If the model output matches all instructions, boost Intent Alignment +0.5.

Never contradict the provided numeric scores; your explanations must support them.

Never artificially cap scores at 7 or 8 when excellence is demonstrated.

⚙️ Model Settings

Model: gpt-4o or gpt-4o-mini

Temperature: 0.25

Response Format: json_object

Max Output Tokens: 700`;

  // Apply score floor for low-quality prompts
  const numericValues = Object.values(scores);
  const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
  if (avg < 3.5) {
    scores.clarity = Math.min(scores.clarity, 2);
    scores.specificity = Math.min(scores.specificity, 2);
    scores.intent_alignment = Math.min(scores.intent_alignment, 3);
  }

  const trimmedOutput = output ? output.substring(0, 1200) : "No output available";
  
  const analysisPrompt = `🧠 Context Input

Prompt:
${prompt}

Model Output (from the test run):
${trimmedOutput}

Category Scores (0–10):
- Clarity: ${scores.clarity.toFixed(1)}
- Specificity: ${scores.specificity.toFixed(1)}
- Efficiency: ${scores.efficiency.toFixed(1)}
- Structure: ${scores.structure.toFixed(1)}
- Constraints: ${scores.constraints.toFixed(1)}
- Elaboration: ${scores.elaboration.toFixed(1)}
- Intent Alignment: ${scores.intent_alignment.toFixed(1)}
- Adaptability: ${scores.adaptability.toFixed(1)}

Return only the JSON object with strengths, weaknesses, suggested_fixes, explanation, and summary_comment.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating analysis:', error);
    return {
      strengths: ["Analysis unavailable"],
      weaknesses: ["Analysis unavailable"],
      suggested_fixes: ["Please try again"],
      explanation: {}
    };
  }
}

// Handle single prompt test - Using 50/50 scoring with real AI output
async function handleSingleTest(req: LabRequest): Promise<DiagnoseResult> {
  const startTime = Date.now();
  
  console.log('🧪 Starting single test for model:', req.target_llm);
  console.log('📝 Prompt length:', req.prompt_a.length, 'chars');
  
  // Call AI model to get real output
  let output: string;
  try {
    output = await callAIModel(req.prompt_a, req.target_llm, req.test_task);
  } catch (error) {
    console.error('❌ Failed to call AI model:', error);
    throw new Error(`AI model call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('📤 AI output received:', {
    outputLength: output?.length || 0,
    outputPreview: output?.substring(0, 150) || 'NO OUTPUT',
    isEmpty: !output || output.length === 0
  });
  
  if (!output || output.length === 0) {
    console.error('❌ ERROR: AI model returned empty output!');
    throw new Error('AI model returned no output');
  }
  
  // Score with 50/50 split (50% prompt quality + 50% output quality)
  const result = scorePromptAndOutput(req.prompt_a, output);
  
  console.log('📊 Scoring result:', {
    finalScore: result.finalScore,
    promptType: result.promptType
  });
  
  // Generate AI analysis with output
  const analysis = await generateAnalysis(req.prompt_a, result.scores, output);
  
  return {
    total_score: result.finalScore,
    category_breakdown: result.scores,
    ai_analysis: analysis,
    prompt_type: result.promptType,
  };
}

// Handle comparison test - Using 50/50 scoring with real AI outputs
async function handleCompareTest(req: LabRequest): Promise<BattleResult> {
  if (!req.prompt_b) {
    throw new Error('Prompt B is required for comparison mode');
  }
  
  // Call AI models for both prompts in parallel
  const [outputA, outputB] = await Promise.all([
    callAIModel(req.prompt_a, req.target_llm, req.test_task),
    callAIModel(req.prompt_b, req.target_llm, req.test_task),
  ]);
  
  // Score both with 50/50 split (50% prompt quality + 50% output quality)
  const resultA = scorePromptAndOutput(req.prompt_a, outputA);
  const resultB = scorePromptAndOutput(req.prompt_b, outputB);
  
  const totalA = resultA.finalScore;
  const totalB = resultB.finalScore;
  
  // Determine winner - higher score always wins
  let winner: 'A' | 'B' | 'Tie' = 'Tie';
  if (totalA > totalB) winner = 'A';
  else if (totalB > totalA) winner = 'B';
  
  // Generate comparison reasoning
  const comparisonPrompt = `Compare these two prompts and explain which is better and why:

Prompt A: "${req.prompt_a}"
Score A: ${totalA}

Prompt B: "${req.prompt_b}"
Score B: ${totalB}

Winner: ${winner}

Provide a brief explanation (2-3 sentences) of why one prompt performed better, focusing on the key differences.`;

  let reasoning = "Unable to generate reasoning";
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: comparisonPrompt }],
        max_tokens: 200,
      }),
    });
    
    const data = await response.json();
    reasoning = data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating reasoning:', error);
  }
  
  return {
    prompt_a_score: totalA,
    prompt_b_score: totalB,
    prompt_a_breakdown: resultA.scores,
    prompt_b_breakdown: resultB.scores,
    winner,
    reasoning,
    comparison: {
      clarity: resultA.scores.clarity > resultB.scores.clarity ? "A wins" : resultB.scores.clarity > resultA.scores.clarity ? "B wins" : "Tie",
      specificity: resultA.scores.specificity > resultB.scores.specificity ? "A wins" : resultB.scores.specificity > resultA.scores.specificity ? "B wins" : "Tie",
      efficiency: resultA.scores.efficiency > resultB.scores.efficiency ? "A wins" : resultB.scores.efficiency > resultA.scores.efficiency ? "B wins" : "Tie",
      structure: resultA.scores.structure > resultB.scores.structure ? "A wins" : resultB.scores.structure > resultA.scores.structure ? "B wins" : "Tie",
      constraints: resultA.scores.constraints > resultB.scores.constraints ? "A wins" : resultB.scores.constraints > resultA.scores.constraints ? "B wins" : "Tie",
      elaboration: resultA.scores.elaboration > resultB.scores.elaboration ? "A wins" : resultB.scores.elaboration > resultB.scores.elaboration ? "B wins" : "Tie",
      intent_alignment: resultA.scores.intent_alignment > resultB.scores.intent_alignment ? "A wins" : resultB.scores.intent_alignment > resultA.scores.intent_alignment ? "B wins" : "Tie",
      adaptability: resultA.scores.adaptability > resultB.scores.adaptability ? "A wins" : resultB.scores.adaptability > resultA.scores.adaptability ? "B wins" : "Tie",
    },
    prompt_a_type: resultA.promptType,
    prompt_b_type: resultB.promptType,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const request: LabRequest = await req.json();
    console.log('Lab analysis request:', { mode: request.mode, target_llm: request.target_llm });

    let result: any;
    const startTime = Date.now();

    if (request.mode === 'single') {
      const diagnoseResult = await handleSingleTest(request);
      
      // Store result
      await supabase.from('prompt_lab_results').insert({
        user_id: user.id,
        mode: 'single',
        target_llm: request.target_llm,
        prompt_a: request.prompt_a,
        test_task: request.test_task,
        total_score_a: diagnoseResult.total_score,
        category_breakdown_a: diagnoseResult.category_breakdown,
        ai_analysis: diagnoseResult.ai_analysis,
        response_latency_ms: Date.now() - startTime,
      });

      result = diagnoseResult;
    } else if (request.mode === 'compare') {
      const battleResult = await handleCompareTest(request);
      
      // Store result
      await supabase.from('prompt_lab_results').insert({
        user_id: user.id,
        mode: 'compare',
        target_llm: request.target_llm,
        prompt_a: request.prompt_a,
        prompt_b: request.prompt_b,
        test_task: request.test_task,
        total_score_a: battleResult.prompt_a_score,
        total_score_b: battleResult.prompt_b_score,
        category_breakdown_a: battleResult.prompt_a_breakdown,
        category_breakdown_b: battleResult.prompt_b_breakdown,
        ai_analysis: { 
          reasoning: battleResult.reasoning,
          comparison: battleResult.comparison 
        },
        winner: battleResult.winner,
        response_latency_ms: Date.now() - startTime,
      });

      result = battleResult;
    } else {
      throw new Error('Invalid mode');
    }

    console.log('Lab analysis completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in prompt-lab-analyze:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
