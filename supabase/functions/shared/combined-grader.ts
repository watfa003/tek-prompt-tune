/**
 * Combined AI Grading System V2
 * Scores both prompt AND output in a single API call using compact JSON schema
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

interface CombinedGradingResponse {
  prompt: {
    clarity: CategoryEvaluation;
    specificity: CategoryEvaluation;
    constraints: CategoryEvaluation;
    elaboration: CategoryEvaluation;
    efficiency: CategoryEvaluation;
    structure: CategoryEvaluation;
    intentAlignment: CategoryEvaluation;
    adaptability: CategoryEvaluation;
  };
  output: {
    quality: number;
    intentAlignment: number;
  };
}

// Compile once at module load for efficiency
const COMBINED_GRADING_PROMPT = compileGradingPrompt('combined');

/**
 * Score both prompt and output in a single API call
 */
export async function scoreCombined(
  prompt: string,
  output: string,
  openAIKey?: string
): Promise<{
  promptScores: CategoryScores;
  promptReasoning: Record<keyof CategoryScores, string>;
  outputQuality: number;
  outputIntentAlignment: number;
}> {
  
  const apiKey = openAIKey || Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key required for AI grading');
  }

  const userPrompt = `Evaluate this prompt and its output:

**PROMPT:**
${prompt}

**OUTPUT:**
${output}

Assess both the prompt quality (8 categories) and output quality (2 scores).`;

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
          { role: 'system', content: COMBINED_GRADING_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const evaluation: CombinedGradingResponse = JSON.parse(data.choices[0].message.content);

    // Return raw AI scores without curve
    const promptScores: CategoryScores = {
      clarity: Math.round(evaluation.prompt.clarity.score * 10) / 10,
      specificity: Math.round(evaluation.prompt.specificity.score * 10) / 10,
      constraints: Math.round(evaluation.prompt.constraints.score * 10) / 10,
      elaboration: Math.round(evaluation.prompt.elaboration.score * 10) / 10,
      efficiency: Math.round(evaluation.prompt.efficiency.score * 10) / 10,
      structure: Math.round(evaluation.prompt.structure.score * 10) / 10,
      intent_alignment: Math.round(evaluation.prompt.intentAlignment.score * 10) / 10,
      adaptability: Math.round(evaluation.prompt.adaptability.score * 10) / 10,
    };

    const promptReasoning: Record<keyof CategoryScores, string> = {
      clarity: evaluation.prompt.clarity.reasoning,
      specificity: evaluation.prompt.specificity.reasoning,
      constraints: evaluation.prompt.constraints.reasoning,
      elaboration: evaluation.prompt.elaboration.reasoning,
      efficiency: evaluation.prompt.efficiency.reasoning,
      structure: evaluation.prompt.structure.reasoning,
      intent_alignment: evaluation.prompt.intentAlignment.reasoning,
      adaptability: evaluation.prompt.adaptability.reasoning,
    };

    // Return raw AI scores for output without curve
    const outputQuality = Math.round(evaluation.output.quality * 10) / 10;
    const outputIntentAlignment = Math.round(evaluation.output.intentAlignment * 10) / 10;

    console.log('Combined AI Grading Results:', {
      promptScores,
      outputQuality,
      outputIntentAlignment
    });

    return {
      promptScores,
      promptReasoning,
      outputQuality,
      outputIntentAlignment
    };

  } catch (error) {
    console.error('Combined AI grading failed:', error);
    throw error;
  }
}

/**
 * Calculate overall prompt score from category scores using unified weights
 */
export function calculatePromptScore(scores: CategoryScores): number {
  const weights = getWeights();

  const weightedSum = Object.entries(scores).reduce((sum, [key, value]) => {
    const weight = weights[key] || 1.0;
    return sum + (value * weight);
  }, 0);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
