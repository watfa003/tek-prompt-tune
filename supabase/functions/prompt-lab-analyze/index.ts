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
        requestBody.max_completion_tokens = 500;
      } else {
        requestBody.max_tokens = 500;
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

    // Efficiency - only penalize fluff and repetition, NOT length
    // Check for redundancy and filler
    const words = prompt.toLowerCase().split(/\s+/);
    const wordSet = new Set(words);
    const uniqueRatio = wordSet.size / words.length;
    
    // Detect repeated phrases (3+ words repeated)
    const hasRepetition = /(\b\w+\s+\w+\s+\w+\b).*\1/.test(prompt.toLowerCase());
    
    // Count filler words
    const fillerWords = ['basically', 'actually', 'literally', 'very', 'really', 'just', 'quite', 'rather', 'somewhat', 'like', 'you know', 'i mean'];
    const fillerCount = fillerWords.filter(word => prompt.toLowerCase().includes(word)).length;
    const hasFluff = fillerCount >= 3;
    
    // Check for low unique word ratio (lots of repetition)
    const isRepetitive = uniqueRatio < 0.6 && wordCount > 20;
    
    if (wordCount < 5) {
      scores.efficiency = 3; // Too short to be useful
    } else if (hasRepetition || isRepetitive) {
      scores.efficiency = 4; // Significant repetition detected
    } else if (hasFluff) {
      scores.efficiency = 6; // Has filler words but not terrible
    } else if (wordCount < 30) {
      scores.efficiency = 10; // Sweet spot
    } else {
      // Long prompts are fine if they're purposeful (no repetition/fluff)
      scores.efficiency = 9; // Default to high for comprehensive prompts
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

    // Elaboration - check for context and examples (multiple detection methods)
    const hasContext = /because|for example|such as|like|to help|in order to|for the purpose of|aimed at|designed for/.test(prompt.toLowerCase());
    const hasExample = /e\.g\.|for instance|example|here's an example|here are examples|sample/.test(prompt.toLowerCase());
    
    // Count actual examples in the prompt (look for patterns like "Example:", numbered examples, etc)
    const exampleMatches = prompt.match(/example\s*\d*\s*:|\d+\.\s+[A-Z]|•\s+[A-Z]|-\s+[A-Z]/gi) || [];
    const multipleExamples = exampleMatches.length >= 2;
    
    // Check for background/purpose statements
    const hasPurpose = /purpose|goal|aim|objective|intended for|audience|target|use case/.test(prompt.toLowerCase());
    
    // Check for reasoning/explanation
    const hasReasoning = /because|since|therefore|thus|so that|in order to|this will|this helps/.test(prompt.toLowerCase());
    
    // Count elaboration signals
    let elaborationSignals = 0;
    if (hasContext) elaborationSignals++;
    if (hasExample) elaborationSignals++;
    if (multipleExamples) elaborationSignals++;
    if (hasPurpose) elaborationSignals++;
    if (hasReasoning) elaborationSignals++;
    
    // Score based on number of elaboration signals detected
    if (elaborationSignals === 0) {
      scores.elaboration = 4; // No elaboration at all
    } else if (elaborationSignals === 1) {
      scores.elaboration = 7; // Single form of context/example
    } else if (elaborationSignals === 2) {
      scores.elaboration = 8; // Two forms
    } else {
      scores.elaboration = 10; // Multiple forms of elaboration
    }

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
    prompt_a_breakdown: scoresA,
    prompt_b_breakdown: scoresB,
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
