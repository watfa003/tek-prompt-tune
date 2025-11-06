import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { 
  scorePromptStatic, 
  scorePromptTested,
  scorePromptAndOutput,
  calculateTotalScore, 
  getContextualWeights,
  detectPromptType,
  type CategoryScores,
  type PromptType
} from '../shared/master-grader.ts';
import { scorePromptWithAI, calculateOverallScore } from '../shared/ai-grader.ts';

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
}

// CategoryScores imported from master-grader.ts

interface DiagnoseResult {
  total_score: number;
  category_breakdown: CategoryScores;
  prompt_type: PromptType;
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
  prompt_a_type: PromptType;
  prompt_b_type: PromptType;
  winner: 'A' | 'B' | 'Tie';
  reasoning: string;
  comparison: Record<string, string>;
}

// Removed - now using master-grader.ts

// Helper to call AI models
async function callAIModel(prompt: string, targetLLM: string): Promise<string> {
  const systemMessage = "You are a helpful AI assistant.";
  
  const userMessage = prompt;
  
  // Parse LLM selection
  const [provider, model] = targetLLM.split('/');
  
  try {
    if (provider === 'openai') {
      const modelName = model || 'gpt-4o-mini';
      const isNewModel = modelName.includes('gpt-5') || modelName.includes('o3') || modelName.includes('o4');
      
      const requestBody: any = {
        model: modelName,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
      };
      
      // New models use max_completion_tokens, old models use max_tokens
      if (isNewModel) {
        requestBody.max_completion_tokens = 4000;
      } else {
        requestBody.max_tokens = 4000;
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      // Add error logging
      if (!response.ok) {
        console.error('OpenAI API error:', response.status, data);
        throw new Error(`OpenAI API error: ${JSON.stringify(data)}`);
      }
      
      if (!data.choices || !data.choices[0]) {
        console.error('Unexpected OpenAI response:', data);
        throw new Error('Invalid response from OpenAI API');
      }
      
      return data.choices[0].message.content;
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-haiku-20241022',
          max_tokens: 4000,
          messages: [
            { role: 'user', content: `${systemMessage}\n\n${userMessage}` }
          ],
        }),
      });
      const data = await response.json();
      return data.content[0].text;
    } else if (provider === 'google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemMessage}\n\n${userMessage}` }]
            }],
            generationConfig: { maxOutputTokens: 4000 }
          }),
        }
      );
      const data = await response.json();
      
      // Add error logging
      if (!response.ok) {
        console.error('Google API error:', response.status, data);
        throw new Error(`Google API error: ${JSON.stringify(data)}`);
      }
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected Google response:', data);
        throw new Error('Invalid response from Google API');
      }
      
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error('Error calling AI model:', error);
    throw error;
  }
  
  return "Unable to generate response.";
}

// Removed - now using master-grader.ts

// Generate AI-powered analysis with output-based diagnostic
async function generateAnalysis(
  prompt: string, 
  scores: CategoryScores, 
  output?: string,
  aiReasoning?: Record<keyof CategoryScores, string>
): Promise<any> {
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
        max_tokens: 3000,
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

// Handle single prompt test - Using AI-powered scoring with prompt type detection
async function handleSingleTest(req: LabRequest): Promise<DiagnoseResult> {
  const startTime = Date.now();
  
  // Detect prompt type first
  const promptType = detectPromptType(req.prompt_a);
  console.log(`✅ Detected prompt type: ${promptType}`);
  
  // Call AI model to get real output
  const output = await callAIModel(req.prompt_a, req.target_llm);
  
  // Use AI-powered scoring with fallback to rule-based
  let scores: CategoryScores;
  let aiReasoning: Record<keyof CategoryScores, string> | undefined;
  let finalScore: number;
  
  try {
    const aiResult = await scorePromptWithAI(req.prompt_a, output, openAIApiKey);
    scores = aiResult.scores;
    aiReasoning = aiResult.reasoning;
    
    // Apply contextual weights based on prompt type
    const weights = getContextualWeights(promptType);
    const weightedScores = { ...scores };
    let weightSum = 0;
    let weightedSum = 0;
    
    for (const [key, value] of Object.entries(scores)) {
      const weight = weights[key as keyof CategoryScores];
      weightedSum += value * weight;
      weightSum += weight;
    }
    
    finalScore = weightSum > 0 ? weightedSum / weightSum : calculateOverallScore(scores);
    console.log(`✅ Using AI-powered scoring with contextual weights (${promptType}): ${finalScore.toFixed(2)}`);
  } catch (error) {
    console.error('AI grading failed, using fallback:', error);
    const result = scorePromptAndOutput(req.prompt_a, output);
    scores = result.scores;
    finalScore = result.finalScore;
    console.log('⚠️ Using fallback rule-based scoring');
  }
  
  // Generate AI analysis with output and reasoning
  const analysis = await generateAnalysis(req.prompt_a, scores, output, aiReasoning);
  
  return {
    total_score: finalScore,
    category_breakdown: scores,
    prompt_type: promptType,
    ai_analysis: analysis,
  };
}

// Handle comparison test - Using AI-powered scoring with prompt type detection
async function handleCompareTest(req: LabRequest): Promise<BattleResult> {
  if (!req.prompt_b) {
    throw new Error('Prompt B is required for comparison mode');
  }
  
  // Detect prompt types for both prompts
  const promptTypeA = detectPromptType(req.prompt_a);
  const promptTypeB = detectPromptType(req.prompt_b);
  console.log(`✅ Detected prompt types: A=${promptTypeA}, B=${promptTypeB}`);
  
  // Call AI models for both prompts in parallel
  const [outputA, outputB] = await Promise.all([
    callAIModel(req.prompt_a, req.target_llm),
    callAIModel(req.prompt_b, req.target_llm),
  ]);
  
  // Score both with AI-powered grading (with fallback)
  let totalA: number, totalB: number;
  let scoresA: CategoryScores, scoresB: CategoryScores;
  
  try {
    const [aiResultA, aiResultB] = await Promise.all([
      scorePromptWithAI(req.prompt_a, outputA, openAIApiKey),
      scorePromptWithAI(req.prompt_b, outputB, openAIApiKey),
    ]);
    scoresA = aiResultA.scores;
    scoresB = aiResultB.scores;
    
    // Apply contextual weights based on prompt types
    const weightsA = getContextualWeights(promptTypeA);
    const weightsB = getContextualWeights(promptTypeB);
    
    let weightSumA = 0, weightedSumA = 0;
    let weightSumB = 0, weightedSumB = 0;
    
    for (const [key, value] of Object.entries(scoresA)) {
      const weight = weightsA[key as keyof CategoryScores];
      weightedSumA += value * weight;
      weightSumA += weight;
    }
    
    for (const [key, value] of Object.entries(scoresB)) {
      const weight = weightsB[key as keyof CategoryScores];
      weightedSumB += value * weight;
      weightSumB += weight;
    }
    
    totalA = weightSumA > 0 ? weightedSumA / weightSumA : calculateOverallScore(scoresA);
    totalB = weightSumB > 0 ? weightedSumB / weightSumB : calculateOverallScore(scoresB);
    console.log(`✅ Using AI-powered scoring for battle comparison with contextual weights`);
  } catch (error) {
    console.error('AI grading failed in battle, using fallback:', error);
    const resultA = scorePromptAndOutput(req.prompt_a, outputA);
    const resultB = scorePromptAndOutput(req.prompt_b, outputB);
    scoresA = resultA.scores;
    scoresB = resultB.scores;
    totalA = resultA.finalScore;
    totalB = resultB.finalScore;
    console.log('⚠️ Using fallback rule-based scoring for battle');
  }
  
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
        max_tokens: 2000,
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
    prompt_a_breakdown: scoresA,
    prompt_b_breakdown: scoresB,
    prompt_a_type: promptTypeA,
    prompt_b_type: promptTypeB,
    winner,
    reasoning,
    comparison: {
      clarity: scoresA.clarity > scoresB.clarity ? "A wins" : scoresB.clarity > scoresA.clarity ? "B wins" : "Tie",
      specificity: scoresA.specificity > scoresB.specificity ? "A wins" : scoresB.specificity > scoresA.specificity ? "B wins" : "Tie",
      efficiency: scoresA.efficiency > scoresB.efficiency ? "A wins" : scoresB.efficiency > scoresA.efficiency ? "B wins" : "Tie",
      structure: scoresA.structure > scoresB.structure ? "A wins" : scoresB.structure > scoresA.structure ? "B wins" : "Tie",
      constraints: scoresA.constraints > scoresB.constraints ? "A wins" : scoresB.constraints > scoresA.constraints ? "B wins" : "Tie",
      elaboration: scoresA.elaboration > scoresB.elaboration ? "A wins" : scoresB.elaboration > scoresA.elaboration ? "B wins" : "Tie",
      intent_alignment: scoresA.intent_alignment > scoresB.intent_alignment ? "A wins" : scoresB.intent_alignment > scoresA.intent_alignment ? "B wins" : "Tie",
      adaptability: scoresA.adaptability > scoresB.adaptability ? "A wins" : scoresB.adaptability > scoresA.adaptability ? "B wins" : "Tie",
    },
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
        total_score_a: diagnoseResult.total_score,
        category_breakdown_a: diagnoseResult.category_breakdown,
        prompt_type_a: diagnoseResult.prompt_type,
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
        total_score_a: battleResult.prompt_a_score,
        total_score_b: battleResult.prompt_b_score,
        category_breakdown_a: battleResult.prompt_a_breakdown,
        category_breakdown_b: battleResult.prompt_b_breakdown,
        prompt_type_a: battleResult.prompt_a_type,
        prompt_type_b: battleResult.prompt_b_type,
        winner: battleResult.winner,
        ai_analysis: { 
          reasoning: battleResult.reasoning,
          comparison: battleResult.comparison 
        },
        response_latency_ms: Date.now() - startTime,
      });
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
