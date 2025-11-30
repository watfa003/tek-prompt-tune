/**
 * AI-Powered Prompt Grading System V2
 * Uses compact JSON schema for reduced token usage
 */

import { compileGradingPrompt, getWeights } from './grading-schema.ts';

export interface CategoryScores {
  clarity: number;
  specificity: number;
  constraints: number;
  elaboration: number;
  efficiency: number;
  structure: number;
  intent_alignment: number;
  adaptability: number;
}

interface CategoryEvaluation {
  score: number;
  reasoning: string;
}

interface AIGradingResponse {
  clarity: CategoryEvaluation;
  specificity: CategoryEvaluation;
  constraints: CategoryEvaluation;
  elaboration: CategoryEvaluation;
  efficiency: CategoryEvaluation;
  structure: CategoryEvaluation;
  intentAlignment: CategoryEvaluation;
  adaptability: CategoryEvaluation;
}

// Compile once at module load for efficiency
const GRADING_SYSTEM_PROMPT = compileGradingPrompt('prompt_only');

/**
 * Score a prompt using AI semantic evaluation (batched single call)
 */
export async function scorePromptWithAI(
  prompt: string,
  output?: string,
  openAIKey?: string
): Promise<{ scores: CategoryScores; reasoning: Record<keyof CategoryScores, string> }> {
  
  const apiKey = openAIKey || Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key required for AI grading');
  }

  const userPrompt = output
    ? `Evaluate this prompt and its actual output:

**PROMPT:**
${prompt}

**ACTUAL OUTPUT:**
${output}

Consider whether the output demonstrates that the prompt achieved its constraints, clarity, and intent.`
    : `Evaluate this prompt:

**PROMPT:**
${prompt}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: GRADING_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const evaluation: AIGradingResponse = JSON.parse(content);

    // Return raw AI scores without curve - round to 1 decimal
    const scores: CategoryScores = {
      clarity: Math.round(evaluation.clarity.score * 10) / 10,
      specificity: Math.round(evaluation.specificity.score * 10) / 10,
      constraints: Math.round(evaluation.constraints.score * 10) / 10,
      elaboration: Math.round(evaluation.elaboration.score * 10) / 10,
      efficiency: Math.round(evaluation.efficiency.score * 10) / 10,
      structure: Math.round(evaluation.structure.score * 10) / 10,
      intent_alignment: Math.round(evaluation.intentAlignment.score * 10) / 10,
      adaptability: Math.round(evaluation.adaptability.score * 10) / 10,
    };

    const reasoning: Record<keyof CategoryScores, string> = {
      clarity: evaluation.clarity.reasoning,
      specificity: evaluation.specificity.reasoning,
      constraints: evaluation.constraints.reasoning,
      elaboration: evaluation.elaboration.reasoning,
      efficiency: evaluation.efficiency.reasoning,
      structure: evaluation.structure.reasoning,
      intent_alignment: evaluation.intentAlignment.reasoning,
      adaptability: evaluation.adaptability.reasoning,
    };

    console.log('AI Grading Results:', { scores, reasoning });

    return { scores, reasoning };

  } catch (error) {
    console.error('AI grading failed:', error);
    throw error;
  }
}

/**
 * Calculate overall score from category scores using unified weights
 */
export function calculateOverallScore(scores: CategoryScores): number {
  const weights = getWeights();

  const weightedSum = Object.entries(scores).reduce((sum, [key, value]) => {
    const weight = weights[key] || 1.0;
    return sum + (value * weight);
  }, 0);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const finalScore = weightedSum / totalWeight;
  
  return Math.round(finalScore * 10) / 10;
}
