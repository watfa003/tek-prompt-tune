/**
 * Combined AI Grading System
 * 
 * Scores both prompt AND output in a single API call for faster lab results.
 */

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

const COMBINED_GRADING_PROMPT = `You are an expert prompt engineering evaluator. Your task is to evaluate BOTH the prompt AND its output in a single assessment.

**PART 1: PROMPT EVALUATION (8 categories, 0-10 each)**

Use the FULL 0-10 scale naturally. Most average prompts should score 5-6. Excellence (9-10) is rare.

1. **Clarity (0-10)** - Is the goal/action immediately obvious?
2. **Specificity (0-10)** - Concrete parameters, examples, measurable details?
3. **Constraints (0-10)** - Format, tone, limits, requirements defined?
4. **Elaboration (0-10)** - Context, rationale, background provided?
5. **Efficiency (0-10)** - Concise without sacrificing clarity?
6. **Structure (0-10)** - Logically organized?
7. **Intent Alignment (0-10)** - Does prompt match what AI should do?
8. **Adaptability (0-10)** - Can structure handle different contexts?

**PART 2: OUTPUT EVALUATION (2 scores, 0-10 each)**

1. **Quality (0-10)**: Assess the output itself
   - Coherence, completeness, correctness
   - Professional formatting and presentation
   - Proper structure
   - 0-4: Poor quality, incoherent, incomplete
   - 5-6: Basic quality, functional (AVERAGE)
   - 7-8: Good quality, well-formatted (GOOD)
   - 9-10: Excellent quality, publication-ready (EXCEPTIONAL)

2. **Intent Alignment (0-10)**: CRITICAL - First understand the prompt, then score alignment
   
   Step 1 - Understand the prompt:
   - Is it gibberish/nonsense/random characters? → No clear intent exists
   - Is it vague/unclear with no specific purpose? → Weak intent, AI will likely hallucinate
   - Does it have a clear, specific request? → Strong intent to evaluate against
   
   Step 2 - Score based on prompt clarity:
   - Gibberish/nonsense prompt: score 0 (no intent to align with)
   - Vague prompt with no clear purpose: score 1-4 (weak intent, high hallucination risk)
   - Clear prompt, output partially addresses it: score 5-7
   - Clear prompt, output fully addresses it: score 8-10
   
   BE STRICT: If there's no clear user intent in the prompt, there's nothing to align with → score near 0

**OUTPUT FORMAT:**
Return a valid JSON object:
{
  "prompt": {
    "clarity": { "score": X, "reasoning": "..." },
    "specificity": { "score": X, "reasoning": "..." },
    "constraints": { "score": X, "reasoning": "..." },
    "elaboration": { "score": X, "reasoning": "..." },
    "efficiency": { "score": X, "reasoning": "..." },
    "structure": { "score": X, "reasoning": "..." },
    "intentAlignment": { "score": X, "reasoning": "..." },
    "adaptability": { "score": X, "reasoning": "..." }
  },
  "output": {
    "quality": X,
    "intentAlignment": X
  }
}`;

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

    // Apply score curve to prompt scores
    const applyCurve = (baseScore: number): number => {
      const curved = baseScore + (10 - baseScore) * 0.25;
      return Math.round(curved * 10) / 10;
    };

    const promptScores: CategoryScores = {
      clarity: applyCurve(evaluation.prompt.clarity.score),
      specificity: applyCurve(evaluation.prompt.specificity.score),
      constraints: applyCurve(evaluation.prompt.constraints.score),
      elaboration: applyCurve(evaluation.prompt.elaboration.score),
      efficiency: applyCurve(evaluation.prompt.efficiency.score),
      structure: applyCurve(evaluation.prompt.structure.score),
      intent_alignment: applyCurve(evaluation.prompt.intentAlignment.score),
      adaptability: applyCurve(evaluation.prompt.adaptability.score),
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

    // Apply curve to output scores and calculate combined score
    const outputQuality = applyCurve(evaluation.output.quality);
    const outputIntentAlignment = applyCurve(evaluation.output.intentAlignment);

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
 * Calculate overall prompt score from category scores
 */
export function calculatePromptScore(scores: CategoryScores): number {
  const weights = {
    clarity: 1.5,
    specificity: 1.3,
    constraints: 1.2,
    elaboration: 1.3,
    efficiency: 1.0,
    structure: 1.2,
    intent_alignment: 1.4,
    adaptability: 0.4,
  };

  const weightedSum = Object.entries(scores).reduce((sum, [key, value]) => {
    const weight = weights[key as keyof CategoryScores];
    return sum + (value * weight);
  }, 0);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
