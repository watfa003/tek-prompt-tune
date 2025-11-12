/**
 * AI-Powered Prompt Grading System
 * 
 * Replaces rule-based keyword matching with semantic AI evaluation
 * across 8 categories for consistent, accurate scoring.
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

const GRADING_SYSTEM_PROMPT = `You are an expert prompt engineering evaluator. Your task is to evaluate prompts across 8 categories, scoring each from 0-10.

**CRITICAL CALIBRATION RULES:**
Use the FULL 0-10 scale naturally. Most average prompts should score 5-6. Excellence (9-10) is rare and requires exceptional quality.

**SCORING SCALE DISTRIBUTION:**
- 0-4: Poor/incomplete prompts with significant issues
- 5-6: Basic/functional prompts that work but lack refinement
- 7-8: Good/solid prompts with clear quality and few weaknesses
- 9-10: Exceptional/near-perfect prompts (should be rare)

**DO NOT cluster scores in 7-10 range. Use 0-6 freely for average or below-average prompts.**

1. **Clarity (0-10)** - Is the goal/action immediately obvious?
   - 0-4: Vague, ambiguous, or confusing
   - 5-6: Generally clear but has some ambiguity (AVERAGE)
   - 7-8: Clear goal, minor details could be clearer (GOOD)
   - 9-10: Crystal clear, zero ambiguity, immediately actionable (EXCEPTIONAL)

2. **Specificity (0-10)** - Are there concrete parameters, examples, or measurable details?
   - 0-4: Very generic, no specific parameters
   - 5-6: Some specifics but lacks detail (AVERAGE)
   - 7-8: Well-defined parameters and examples (GOOD)
   - 9-10: Highly specific with exact requirements, examples, formats (EXCEPTIONAL)

3. **Constraints (0-10)** - How many requirements/limitations are defined?
   ⚠️ **RECOGNIZE ALL CONSTRAINT TYPES:**
   - Format requirements (JSON, Markdown, camelCase, valid syntax)
   - Structural limits (sections, numbering, organization)
   - Tone/style specs (formal, technical, brief, comprehensive)
   - Negative constraints (avoid X, don't include Y, exclude Z)
   - Quality boundaries (parsable, complete, verified)
   - Numerical limits (word count, character limits, quantity)
   - Technical requirements (data types, naming conventions)
   
   - 0-4: Minimal or no constraints
   - 5-6: Few basic constraints (1-3 types) (AVERAGE)
   - 7-8: Multiple clear constraints (4-6 types) (GOOD)
   - 9-10: Comprehensive constraint system (7+ types, detailed) (EXCEPTIONAL)

4. **Elaboration (0-10)** - Is there context, rationale, or background?
   ⚠️ **EVEN BRIEF CONTEXT COUNTS:**
   - "for X purpose" = elaboration
   - "because Y" = elaboration
   - Use case examples = elaboration
   - Background information = elaboration
   
   - 0-4: No context or rationale
   - 5-6: Minimal context (1-2 brief mentions) (AVERAGE)
   - 7-8: Good context with examples or rationale (GOOD)
   - 9-10: Rich context with use cases, examples, and reasoning (EXCEPTIONAL)

5. **Efficiency (0-10)** - Is the prompt concise without sacrificing clarity?
   - 0-4: Overly verbose or confusingly terse
   - 5-6: Acceptable length, some redundancy (AVERAGE)
   - 7-8: Well-balanced, minimal waste (GOOD)
   - 9-10: Perfect brevity, every word adds value (EXCEPTIONAL)

6. **Structure (0-10)** - Is the prompt organized logically?
   - 0-4: Disorganized, scattered thoughts
   - 5-6: Basic organization, could be better (AVERAGE)
   - 7-8: Well-structured with clear sections (GOOD)
   - 9-10: Expertly organized, flows perfectly (EXCEPTIONAL)

7. **Intent Alignment (0-10)** - Does the prompt match what AI should actually do?
   - 0-4: Unclear what AI should produce
   - 5-6: General direction but ambiguous (AVERAGE)
   - 7-8: Clear expected output (GOOD)
   - 9-10: Perfect alignment between ask and expected result (EXCEPTIONAL)

8. **Adaptability (0-10)** - How well can the prompt's structure and logic absorb a new context while maintaining strength and clarity?
   ⚠️ **NOT about being generic/vague - about structural robustness:**
   - Look for: placeholders, variables, roles, clear sections, conditional logic
   - "Write a poem about [TOPIC]" = HIGH adaptability (structure handles any topic)
   - "Write a detailed analysis" = LOW adaptability (context-dependent, no structure for swapping)
   
   - 0-4: Hardcoded context, cannot swap without breaking logic
   - 5-6: Some structural separation, but tightly coupled to one context (AVERAGE)
   - 7-8: Clear structural markers (placeholders/variables) that allow context swapping (GOOD)
   - 9-10: Template-grade structure with explicit placeholders and logic that works universally (EXCEPTIONAL)

**OUTPUT FORMAT:**
Return a valid JSON object with this exact structure:
{
  "clarity": { "score": X, "reasoning": "Brief explanation" },
  "specificity": { "score": X, "reasoning": "Brief explanation" },
  "constraints": { "score": X, "reasoning": "Brief explanation" },
  "elaboration": { "score": X, "reasoning": "Brief explanation" },
  "efficiency": { "score": X, "reasoning": "Brief explanation" },
  "structure": { "score": X, "reasoning": "Brief explanation" },
  "intentAlignment": { "score": X, "reasoning": "Brief explanation" },
  "adaptability": { "score": X, "reasoning": "Brief explanation" }
}

**IMPORTANT:** Use the full 0-10 scale. Do NOT artificially inflate scores. Average prompts = 5-6. Good prompts = 7-8. Exceptional prompts = 9-10.`;

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
        temperature: 0.3, // Balanced temp for consistency with slight variation
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

    // Apply score curve: curvedScore = baseScore + (10 - baseScore) * 0.25
    const applyCurve = (baseScore: number): number => {
      const curved = baseScore + (10 - baseScore) * 0.25;
      return Math.round(curved * 10) / 10;
    };

    // Extract scores and reasoning - APPLY CURVE AND ROUND TO 1 DECIMAL
    const scores: CategoryScores = {
      clarity: applyCurve(evaluation.clarity.score),
      specificity: applyCurve(evaluation.specificity.score),
      constraints: applyCurve(evaluation.constraints.score),
      elaboration: applyCurve(evaluation.elaboration.score),
      efficiency: applyCurve(evaluation.efficiency.score),
      structure: applyCurve(evaluation.structure.score),
      intent_alignment: applyCurve(evaluation.intentAlignment.score),
      adaptability: applyCurve(evaluation.adaptability.score),
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
 * Calculate overall score from category scores
 */
export function calculateOverallScore(scores: CategoryScores): number {
  // UNIFIED WEIGHTS - Matches master-grader.ts complex type
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
  const baseScore = weightedSum / totalWeight;
  
  // Apply score curve: curvedScore = baseScore + (10 - baseScore) * 0.25
  const curvedScore = baseScore + (10 - baseScore) * 0.25;
  
  return Math.round(curvedScore * 10) / 10;
}
