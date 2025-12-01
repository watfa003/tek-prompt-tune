/**
 * Combined AI Grading System
 * 
 * Scores prompt, output, AND generates analysis in a SINGLE API call for maximum speed.
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

export interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  suggested_fixes: string[];
  explanation: Record<string, string>;
  summary_comment: string;
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
  analysis: {
    strengths: string[];
    weaknesses: string[];
    suggestedFixes: string[];
    summaryComment: string;
  };
}

const COMBINED_GRADING_PROMPT = `You are an expert prompt engineering evaluator. Your task is to evaluate BOTH the prompt AND its output, PLUS provide actionable analysis - ALL IN ONE RESPONSE.

**PART 1: PROMPT EVALUATION (8 categories, 0-10 each)**

Use the FULL 0-10 scale naturally. Most average prompts should score 5-6. Excellence (9-10) is rare.

1. **Clarity (0-10)** - Is the goal/action immediately obvious?
2. **Specificity (0-10)** - Concrete parameters, examples, measurable details?
3. **Constraints (0-10)** - Format, tone, limits, requirements defined?
   ✅ Credit: format reqs, structural limits, tone/style, negative constraints, quality bounds, numerical limits
4. **Elaboration (0-10)** - Context, rationale, background provided?
   ✅ Credit: "for X purpose", examples, use cases, reasoning (even brief)
5. **Efficiency (0-10)** - Concise without sacrificing clarity? Length is NOT a penalty - only penalize wasted words/redundancy.
6. **Structure (0-10)** - Logically organized?
7. **Intent Alignment (0-10)** - Does prompt match what AI should do?
8. **Adaptability (0-10)** - Can structure handle different contexts? Look for placeholders, variables, reusable structure.

**PART 2: OUTPUT EVALUATION (2 scores, 0-10 each)**

CRITICAL: First evaluate the PROMPT quality before scoring output!

1. **Quality (0-10)**: Score based on BOTH output coherence AND prompt validity
   - Gibberish/nonsense prompt → Output quality MUST be 0-2
   - Vague prompt with no clear purpose → Output quality capped at 3-5
   - Clear prompt with specific request → Score output normally (0-10)

2. **Intent Alignment (0-10)**: How well does output match the prompt's request?
   - Gibberish/nonsense prompt: score 0
   - Vague prompt: score 1-3
   - Clear prompt, output addresses it: score 4-10

**PART 3: ANALYSIS (actionable recommendations)**

CRITICAL: Users can only change the PROMPT, not the output. All recommendations must focus on IMPROVING THE PROMPT TEXT.

- **strengths**: 2-3 things the PROMPT does well
- **weaknesses**: 2-3 areas the PROMPT lacks (not the output)
- **suggestedFixes**: 3-4 SPECIFIC, ACTIONABLE ways to rewrite/improve the prompt (e.g., "Add constraints like...", "Restructure to include...")
- **summaryComment**: One sentence overall assessment

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
  },
  "analysis": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "suggestedFixes": ["...", "...", "..."],
    "summaryComment": "..."
  }
}`;

/**
 * Score prompt, output, AND generate analysis in a SINGLE API call
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
  analysis: AnalysisResult;
}> {
  
  const apiKey = openAIKey || Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key required for AI grading');
  }

  const trimmedOutput = output.length > 1500 ? output.substring(0, 1500) + '...' : output;

  const userPrompt = `Evaluate this prompt and its output:

**PROMPT:**
${prompt}

**OUTPUT:**
${trimmedOutput}

Assess the prompt quality (8 categories), output quality (2 scores), AND provide actionable analysis for improving the prompt.`;

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
        max_tokens: 3000,
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

    // Extract prompt scores
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

    // Extract output scores
    const outputQuality = Math.round(evaluation.output.quality * 10) / 10;
    const outputIntentAlignment = Math.round(evaluation.output.intentAlignment * 10) / 10;

    // Extract analysis with proper field mapping
    const analysis: AnalysisResult = {
      strengths: evaluation.analysis.strengths || [],
      weaknesses: evaluation.analysis.weaknesses || [],
      suggested_fixes: evaluation.analysis.suggestedFixes || [],
      explanation: {
        clarity: evaluation.prompt.clarity.reasoning,
        specificity: evaluation.prompt.specificity.reasoning,
        constraints: evaluation.prompt.constraints.reasoning,
        elaboration: evaluation.prompt.elaboration.reasoning,
        efficiency: evaluation.prompt.efficiency.reasoning,
        structure: evaluation.prompt.structure.reasoning,
        intent_alignment: evaluation.prompt.intentAlignment.reasoning,
        adaptability: evaluation.prompt.adaptability.reasoning,
      },
      summary_comment: evaluation.analysis.summaryComment || '',
    };

    console.log('✅ Combined AI Grading + Analysis (1 API call):', {
      promptScore: Object.values(promptScores).reduce((a, b) => a + b, 0) / 8,
      outputQuality,
      outputIntentAlignment,
      analysisIncluded: true
    });

    return {
      promptScores,
      promptReasoning,
      outputQuality,
      outputIntentAlignment,
      analysis
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
