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
    strengths: string[];
    weaknesses: string[];
    suggested_fixes: string[];
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

  // Clarity - check for vague language
  const vagueWords = ['good', 'nice', 'better', 'make it', 'kind of', 'sort of', 'maybe'];
  const hasVague = vagueWords.some(word => prompt.toLowerCase().includes(word));
  scores.clarity = hasVague ? 6 : 9;

  // Specificity - check for concrete details
  const hasNumbers = /\d+/.test(prompt);
  const hasFormat = /format|style|tone|json|markdown|list/.test(prompt.toLowerCase());
  scores.specificity = (hasNumbers ? 4 : 0) + (hasFormat ? 4 : 2);

  // Efficiency - penalize excessive length
  const wordCount = prompt.split(/\s+/).length;
  scores.efficiency = wordCount < 50 ? 10 : wordCount < 100 ? 8 : wordCount < 200 ? 6 : 4;

  // Structure - check for organized content
  const hasSteps = /step|first|then|finally|1\.|2\.|3\./.test(prompt.toLowerCase());
  const hasSections = /\n\n/.test(prompt);
  scores.structure = (hasSteps ? 5 : 3) + (hasSections ? 3 : 1);

  // Constraints - check for explicit boundaries
  const hasConstraints = /must|should|don't|avoid|only|exactly/.test(prompt.toLowerCase());
  scores.constraints = hasConstraints ? 8 : 5;

  // Elaboration - check for context and examples
  const hasContext = /because|for example|such as|like/.test(prompt.toLowerCase());
  scores.elaboration = hasContext ? 8 : 5;

  // Intent alignment - check if output matches expected format
  scores.intent_alignment = output ? 9 : 8;

  // Adaptability - check for flexibility cues
  const hasFlexibility = /if|when|depending|consider|might/.test(prompt.toLowerCase());
  scores.adaptability = hasFlexibility ? 8 : 6;

  return scores;
}

function calculateTotalScore(scores: CategoryScores): number {
  const values = Object.values(scores);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(average * 10) / 10;
}

// Generate AI-powered analysis
async function generateAnalysis(prompt: string, scores: CategoryScores): Promise<DiagnoseResult['ai_analysis']> {
  const analysisPrompt = `You are a prompt engineering expert. Analyze this prompt and its scores, then provide:
1. 2-3 specific strengths
2. 2-3 specific weaknesses
3. 3-4 actionable fixes to improve the prompt

Prompt: "${prompt}"

Scores (out of 10):
- Clarity: ${scores.clarity}
- Specificity: ${scores.specificity}
- Efficiency: ${scores.efficiency}
- Structure: ${scores.structure}
- Constraints: ${scores.constraints}
- Elaboration: ${scores.elaboration}
- Intent Alignment: ${scores.intent_alignment}
- Adaptability: ${scores.adaptability}

Return your analysis in JSON format:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggested_fixes": ["...", "...", "..."]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
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
  
  // Generate AI analysis
  const analysis = await generateAnalysis(req.prompt_a, scores);
  
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
