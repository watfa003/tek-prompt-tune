import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

interface CategoryScores {
  clarity: number;
  specificity: number;
  efficiency: number;
  structure: number;
  constraints: number;
  elaboration: number;
  intent_alignment: number;
  adaptability: number;
}

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

// Common English words for nonsense detection
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having', 'does', 'did', 'doing', 'am', 'can', 'could', 'should', 'would', 'may', 'might', 'must',
  'write', 'create', 'generate', 'make', 'provide', 'give', 'tell', 'explain', 'describe', 'list', 'show', 'help', 'answer', 'respond', 'format', 'json', 'markdown',
  'please', 'need', 'want', 'story', 'text', 'content', 'code', 'example', 'information', 'data', 'task', 'prompt', 'question', 'message', 'email', 'article',
  'short', 'long', 'simple', 'detailed', 'clear', 'concise', 'brief', 'comprehensive', 'specific', 'general', 'professional', 'casual', 'formal', 'informal',
  'must', 'should', 'avoid', 'include', 'exclude', 'only', 'exactly', 'approximately', 'around', 'between', 'using', 'without', 'based', 'following'
]);

// Detect nonsense and gibberish prompts
function detectNonsense(prompt: string, output?: string): number {
  if (!prompt || prompt.trim().length === 0) return 3;
  
  // 1️⃣ Non-alphabetic ratio
  const clean = prompt.replace(/\s+/g, '');
  if (clean.length === 0) return 3;
  
  const alphaCount = (clean.match(/[a-zA-Z]/g)?.length ?? 0);
  const alphaRatio = alphaCount / clean.length;

  // 2️⃣ English-word density
  const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 3;
  
  const knownWords = words.filter(w => COMMON_WORDS.has(w) || w.length > 8).length;
  const wordRatio = knownWords / words.length;

  // 3️⃣ Output sanity check
  const outputValid = output && output.trim().length > 10;

  let nonsenseScore = 0;
  if (alphaRatio < 0.5) nonsenseScore += 1;
  if (wordRatio < 0.25) nonsenseScore += 1;
  if (!outputValid) nonsenseScore += 1;

  return nonsenseScore; // 0-3
}

// Helper to call AI models
async function callAIModel(prompt: string, targetLLM: string, testTask?: string): Promise<string> {
  const systemMessage = testTask 
    ? `You are a helpful AI assistant. ${testTask}` 
    : "You are a helpful AI assistant.";
  
  const userMessage = prompt;
  
  // Parse LLM selection
  const [provider, model] = targetLLM.split('/');
  
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
        }),
      });
      const data = await response.json();
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
          max_tokens: 500,
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
            generationConfig: { maxOutputTokens: 500 }
          }),
        }
      );
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error('Error calling AI model:', error);
    throw error;
  }
  
  return "Unable to generate response.";
}

// Scoring function
function scorePrompt(prompt: string, output?: string): CategoryScores {
  // 🚨 NONSENSE DETECTION - Apply hard penalty first
  const nonsensePenalty = detectNonsense(prompt, output);
  
  if (nonsensePenalty >= 2) {
    // Hard cap for gibberish/nonsense prompts
    const baseScore = 2 + Math.random() * 0.5; // 2.0-2.5
    return {
      clarity: baseScore,
      specificity: baseScore,
      efficiency: baseScore,
      structure: baseScore,
      constraints: baseScore,
      elaboration: baseScore,
      intent_alignment: baseScore,
      adaptability: baseScore,
    };
  }

  const scores: CategoryScores = {
    clarity: 0,
    specificity: 0,
    efficiency: 0,
    structure: 0,
    constraints: 0,
    elaboration: 0,
    intent_alignment: 0,
    adaptability: 0,
  };

  const wordCount = prompt.split(/\s+/).filter(w => w.length > 0).length;

  // 🔒 GUARD: Very short prompts get penalized
  if (prompt.trim().length < 8) {
    scores.efficiency = 2;
    scores.clarity = 1;
    scores.specificity = 1;
    scores.structure = 1;
    scores.constraints = 1;
    scores.elaboration = 1;
    scores.intent_alignment = 2;
    scores.adaptability = 2;
  } else if (/^[a-zA-Z]{1,5}$/.test(prompt.trim())) {
    // Single word prompts
    scores.clarity = 2;
    scores.specificity = 2;
    scores.efficiency = 3;
    scores.structure = 1;
    scores.constraints = 1;
    scores.elaboration = 1;
    scores.intent_alignment = 3;
    scores.adaptability = 4;
  } else {
    // Clarity - check for vague language and filler words
    const vagueWords = ['good', 'nice', 'better', 'make it', 'kind of', 'sort of', 'maybe', 'idk', 'something', 'stuff', 'thing'];
    const hasVague = vagueWords.some(word => prompt.toLowerCase().includes(word));
    const hasActionVerb = /write|create|generate|analyze|summarize|explain|list|describe|compare|translate/.test(prompt.toLowerCase());
    
    if (!hasActionVerb) {
      scores.clarity = hasVague ? 2 : 4;
    } else {
      scores.clarity = hasVague ? 5 : 9;
    }

    // Specificity - check for concrete details
    const hasNumbers = /\d+/.test(prompt);
    const hasFormat = /format|style|tone|json|markdown|list|bullet|paragraph/.test(prompt.toLowerCase());
    const hasTopic = wordCount > 5; // At least some topic detail
    
    let specificity = 3; // Base score
    if (hasNumbers) specificity += 2;
    if (hasFormat) specificity += 2;
    if (hasTopic) specificity += 2;
    scores.specificity = Math.min(specificity, 10);

    // Efficiency - penalize excessive length but reward conciseness with substance
    if (wordCount < 5) {
      scores.efficiency = 3; // Too short to be useful
    } else if (wordCount < 30) {
      scores.efficiency = 10; // Sweet spot
    } else if (wordCount < 80) {
      scores.efficiency = 8;
    } else if (wordCount < 150) {
      scores.efficiency = 6;
    } else {
      scores.efficiency = 4;
    }
    
    // Structure - check for organized content
    const hasSteps = /step|first|then|finally|1\.|2\.|3\./.test(prompt.toLowerCase());
    const hasSections = /\n\n/.test(prompt);
    const hasBullets = /\n-|\n\*/.test(prompt);
    
    let structure = 4; // Base
    if (hasSteps) structure += 3;
    if (hasSections) structure += 2;
    if (hasBullets) structure += 2;
    scores.structure = Math.min(structure, 10);

    // Constraints - check for explicit boundaries
    const hasConstraints = /must|should|don't|avoid|only|exactly|no more than|at least|maximum|minimum/.test(prompt.toLowerCase());
    const hasNegativeConstraints = /don't|avoid|not|never|without/.test(prompt.toLowerCase());
    
    let constraints = 4; // Base
    if (hasConstraints) constraints += 3;
    if (hasNegativeConstraints) constraints += 2;
    scores.constraints = Math.min(constraints, 10);

    // Elaboration - check for context and examples
    const hasContext = /because|for example|such as|like|to help|in order to/.test(prompt.toLowerCase());
    const hasExample = /e\.g\.|for instance|example/.test(prompt.toLowerCase());
    
    let elaboration = 4; // Base
    if (hasContext) elaboration += 3;
    if (hasExample) elaboration += 2;
    scores.elaboration = Math.min(elaboration, 10);

    // Intent alignment - FOCUS ON PROMPT CLARITY, not output quality
    // Only penalize if output suggests prompt was misunderstood
    const outputSeemsBroken = output && output.length < 10;
    const promptHasClearGoal = hasActionVerb && !hasVague;
    
    if (outputSeemsBroken) {
      scores.intent_alignment = 2; // Output failure suggests prompt was bad
    } else if (promptHasClearGoal) {
      scores.intent_alignment = 9; // Clear goal in prompt
    } else if (hasActionVerb) {
      scores.intent_alignment = 6; // Has verb but vague
    } else {
      scores.intent_alignment = 3; // No clear goal
    }

    // Adaptability - check for flexibility cues
    const hasFlexibility = /if|when|depending|consider|might|could|optional|prefer/.test(prompt.toLowerCase());
    const hasOptions = /or|alternatively|either/.test(prompt.toLowerCase());
    
    let adaptability = 5; // Base
    if (hasFlexibility) adaptability += 2;
    if (hasOptions) adaptability += 2;
    scores.adaptability = Math.min(adaptability, 10);
  }

  return scores;
}

function calculateTotalScore(scores: CategoryScores): number {
  const values = Object.values(scores);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  let total = Math.round(average * 10) / 10;
  
  // 🔒 MINIMUM QUALITY THRESHOLD
  // If core trio (clarity + specificity + intent) is weak, cap the total
  const coreTrio = (scores.clarity + scores.specificity + scores.intent_alignment) / 3;
  if (total > 3 && coreTrio < 4) {
    total = Math.min(total, 3.5);
  }
  
  return total;
}

// Generate AI-powered analysis with output-based diagnostic
async function generateAnalysis(prompt: string, scores: CategoryScores, output?: string): Promise<any> {
  const systemPrompt = `You are PromptTek Lab's scoring interpreter.
Your purpose is to generate accurate written reasoning for the numeric scores that were already assigned by the scoring engine without downgrading or re-interpreting them.
When a prompt performs exceptionally well, you must acknowledge it as highly optimized, not "average."
The goal is to produce explanations that mirror the numeric scale faithfully and help the user understand why they earned that score.

📄 Input Context
PROMPT:
{prompt}

MODEL OUTPUT:
{model_output}

CATEGORY SCORES:
Clarity: {clarity}
Specificity: {specificity}
Efficiency: {efficiency}
Structure: {structure}
Constraints: {constraints}
Elaboration: {elaboration}
Intent Alignment: {intent_alignment}
Adaptability: {adaptability}

⚖️ Evaluation Rules

Do not reinterpret numbers.

0–3 → unusable / incoherent.

4–5 → weak / limited.

6–7 → functional / average.

8–9 → strong / optimized.

9.5–10 → exceptional / publication-ready.

High-score acknowledgement:
If ≥ 5 categories are 8 or higher → explicitly describe the prompt as well-structured, professional, and clearly optimized.
Avoid nit-picking unless a category < 8.

Balance tone:

Low scores → diagnostic and corrective.

High scores → validating and precise (e.g., "The prompt demonstrates expert-level constraint design.")

Output strictly in JSON.
Schema:

{
  "strengths": ["..."],          // optional, omit if none
  "weaknesses": ["..."],         // 2–4 clear issues if any exist
  "suggested_fixes": ["..."],    // 3–4 actionable improvements or "[]" if none needed
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
  "summary_comment": "One-sentence overall appraisal reflecting the numeric average."
}


For near-perfect prompts (average ≥ 9):

Begin summary_comment with ⭐ "This prompt is exemplary."

Return "suggested_fixes": [] if no concrete flaw exists.

Never penalize clarity, structure, or constraints when all scores are already high.
Focus feedback on subtle refinements (tone consistency, extensibility, etc.) instead of generic "could be more specific" notes.`;

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

// Handle single prompt test
async function handleSingleTest(req: LabRequest): Promise<DiagnoseResult> {
  const startTime = Date.now();
  
  // Call AI model
  const output = await callAIModel(req.prompt_a, req.target_llm, req.test_task);
  
  // Score the prompt
  const scores = scorePrompt(req.prompt_a, output);
  const totalScore = calculateTotalScore(scores);
  
  // Generate AI analysis with output
  const analysis = await generateAnalysis(req.prompt_a, scores, output);
  
  return {
    total_score: totalScore,
    category_breakdown: scores,
    ai_analysis: analysis,
  };
}

// Handle comparison test
async function handleCompareTest(req: LabRequest): Promise<BattleResult> {
  if (!req.prompt_b) {
    throw new Error('Prompt B is required for comparison mode');
  }
  
  // Call AI models for both prompts in parallel
  const [outputA, outputB] = await Promise.all([
    callAIModel(req.prompt_a, req.target_llm, req.test_task),
    callAIModel(req.prompt_b, req.target_llm, req.test_task),
  ]);
  
  // Score both prompts
  const scoresA = scorePrompt(req.prompt_a, outputA);
  const scoresB = scorePrompt(req.prompt_b, outputB);
  
  const totalA = calculateTotalScore(scoresA);
  const totalB = calculateTotalScore(scoresB);
  
  // Determine winner
  let winner: 'A' | 'B' | 'Tie' = 'Tie';
  if (totalA > totalB + 0.5) winner = 'A';
  else if (totalB > totalA + 0.5) winner = 'B';
  
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
    prompt_a_breakdown: scoresA,
    prompt_b_breakdown: scoresB,
    winner,
    reasoning,
    comparison: {
      clarity: scoresA.clarity > scoresB.clarity ? "A wins" : scoresB.clarity > scoresA.clarity ? "B wins" : "Tie",
      specificity: scoresA.specificity > scoresB.specificity ? "A wins" : scoresB.specificity > scoresA.specificity ? "B wins" : "Tie",
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
