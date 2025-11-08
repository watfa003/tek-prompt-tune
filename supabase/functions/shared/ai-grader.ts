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

1. **Clarity (0-10)** - Is the goal/action immediately obvious?
   - 0-3: Vague, ambiguous, multiple interpretations possible
   - 4-6: Generally clear but has some ambiguity
   - 7-8: Clear goal, minor details could be clearer
   - 9-10: Crystal clear, zero ambiguity, immediately actionable

2. **Specificity (0-10)** - Are there concrete parameters, examples, or measurable details?
   - 0-3: Very generic, no specific parameters
   - 4-6: Some specifics but lacks detail
   - 7-8: Well-defined parameters and examples
   - 9-10: Highly specific with exact requirements, examples, formats

3. **Constraints (0-10)** - How many requirements/limitations are defined?
   ⚠️ **RECOGNIZE ALL CONSTRAINT TYPES:**
   - Format requirements (JSON, Markdown, camelCase, valid syntax)
   - Structural limits (sections, numbering, organization)
   - Tone/style specs (formal, technical, brief, comprehensive)
   - Negative constraints (avoid X, don't include Y, exclude Z)
   - Quality boundaries (parsable, complete, verified)
   - Numerical limits (word count, character limits, quantity)
   - Technical requirements (data types, naming conventions)
   
   - 0-3: Minimal or no constraints
   - 4-6: Few basic constraints (1-3 types)
   - 7-8: Multiple clear constraints (4-6 types)
   - 9-10: Comprehensive constraint system (7+ types, detailed)

4. **Elaboration (0-10)** - Is there context, rationale, or background?
   ⚠️ **EVEN BRIEF CONTEXT COUNTS:**
   - "for X purpose" = elaboration
   - "because Y" = elaboration
   - Use case examples = elaboration
   - Background information = elaboration
   
   - 0-3: No context or rationale
   - 4-6: Minimal context (1-2 brief mentions)
   - 7-8: Good context with examples or rationale
   - 9-10: Rich context with use cases, examples, and reasoning

5. **Efficiency (0-10)** - Is the prompt concise without sacrificing clarity?
   - 0-3: Overly verbose or confusingly terse
   - 4-6: Acceptable length, some redundancy
   - 7-8: Well-balanced, minimal waste
   - 9-10: Perfect brevity, every word adds value

6. **Structure (0-10)** - Is the prompt organized logically?
   - 0-3: Disorganized, scattered thoughts
   - 4-6: Basic organization, could be better
   - 7-8: Well-structured with clear sections
   - 9-10: Expertly organized, flows perfectly

7. **Intent Alignment (0-10)** - Does the prompt match what AI should actually do?
   - 0-3: Unclear what AI should produce
   - 4-6: General direction but ambiguous
   - 7-8: Clear expected output
   - 9-10: Perfect alignment between ask and expected result

8. **Adaptability (0-10)** - How well can the prompt's structure and logic absorb a new context while maintaining strength and clarity?
   ⚠️ **NOT about being generic/vague - about structural robustness:**
   - Look for: placeholders, variables, roles, clear sections, conditional logic
   - "Write a poem about [TOPIC]" = HIGH adaptability (structure handles any topic)
   - "Write a detailed analysis" = LOW adaptability (context-dependent, no structure for swapping)
   
   - 0-3: Hardcoded context, cannot swap without breaking logic
   - 4-6: Some structural separation, but tightly coupled to one context
   - 7-8: Clear structural markers (placeholders/variables) that allow context swapping
   - 9-10: Template-grade structure with explicit placeholders and logic that works universally

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

**IMPORTANT:** Be generous but accurate. A well-crafted prompt should score 8-10 in most categories. Don't artificially cap scores.`;

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
        temperature: 0.3, // Lower temperature for consistent scoring
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

    // Extract scores and reasoning
    const scores: CategoryScores = {
      clarity: Math.round(evaluation.clarity.score),
      specificity: Math.round(evaluation.specificity.score),
      constraints: Math.round(evaluation.constraints.score),
      elaboration: Math.round(evaluation.elaboration.score),
      efficiency: Math.round(evaluation.efficiency.score),
      structure: Math.round(evaluation.structure.score),
      intent_alignment: Math.round(evaluation.intentAlignment.score),
      adaptability: Math.round(evaluation.adaptability.score),
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
  const weights = {
    clarity: 1.2,
    specificity: 1.2,
    constraints: 1.0,
    elaboration: 0.8,
    efficiency: 1.0,
    structure: 0.9,
    intent_alignment: 1.3,
    adaptability: 0.6,
  };

  const weightedSum = Object.entries(scores).reduce((sum, [key, value]) => {
    const weight = weights[key as keyof CategoryScores];
    return sum + (value * weight);
  }, 0);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
