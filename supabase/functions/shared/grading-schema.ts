// PrompTek Grading Schema V2 - Ultra-Compact JSON
// Reduces token usage ~60% while preserving ALL grading logic

export const GRADING_JSON = {
  id: "Grader_V2",
  scale: { poor: [0,4], avg: [5,6], good: [7,8], exc: [9,10] },
  rule: "Use FULL 0-10 scale. Most avg=5-6. Exc=9-10 is RARE.",
  
  pillars: {
    clarity: {
      q: "Is goal/action immediately obvious?",
      s: { "0-4": "vague/ambiguous", "5-6": "generally clear, some ambiguity", "7-8": "clear goal, minor issues", "9-10": "crystal clear, zero ambiguity" },
      w: 1.5
    },
    specificity: {
      q: "Concrete params, examples, measurable details?",
      s: { "0-4": "very generic", "5-6": "some specifics, lacks detail", "7-8": "well-defined params/examples", "9-10": "highly specific, exact requirements" },
      w: 1.3
    },
    constraints: {
      q: "Format, tone, limits, requirements defined?",
      types: ["format(JSON/MD/camelCase)", "structural(sections/numbering)", "tone(formal/technical)", "negative(avoid/exclude)", "quality(parsable/complete)", "numerical(word count)", "technical(types/naming)"],
      s: { "0-4": "minimal/none", "5-6": "few basic(1-3)", "7-8": "multiple clear(4-6)", "9-10": "comprehensive(7+)" },
      w: 1.2
    },
    elaboration: {
      q: "Context, rationale, background provided?",
      types: ["for X purpose", "because Y", "use-case examples", "background info"],
      s: { "0-4": "no context", "5-6": "minimal(1-2 mentions)", "7-8": "good context+examples", "9-10": "rich context+use-cases+reasoning" },
      w: 1.3
    },
    efficiency: {
      q: "Concise without sacrificing clarity?",
      s: { "0-4": "overly verbose/terse", "5-6": "acceptable, some redundancy", "7-8": "well-balanced, minimal waste", "9-10": "perfect brevity, every word adds value" },
      w: 1.0
    },
    structure: {
      q: "Logically organized?",
      s: { "0-4": "disorganized", "5-6": "basic organization", "7-8": "well-structured, clear sections", "9-10": "expertly organized, flows perfectly" },
      w: 1.2
    },
    intent_alignment: {
      q: "Does prompt match what AI should do?",
      s: { "0-4": "unclear what AI should produce", "5-6": "general direction, ambiguous", "7-8": "clear expected output", "9-10": "perfect alignment ask↔result" },
      w: 1.4
    },
    adaptability: {
      q: "Structure absorbs new context maintaining clarity?",
      markers: ["placeholders([X],{Y})", "variables(the topic)", "roles(as a)", "sections", "conditionals"],
      s: { "0-4": "hardcoded, cannot swap", "5-6": "some structure, tightly coupled", "7-8": "clear structural markers for swapping", "9-10": "template-grade, universal" },
      w: 0.4
    }
  },

  output: {
    quality: {
      q: "Output coherence + prompt validity",
      rule: "FIRST check prompt validity THEN score output",
      gibberish: { action: "max score 2", reason: "hallucinated nonsense" },
      vague: { action: "cap 3-5", reason: "likely hallucination" },
      clear: { range: [0,10], s: { "0-4": "poor/incomplete", "5-6": "basic/functional", "7-8": "good/well-formatted", "9-10": "excellent/publication-ready" } }
    },
    intent: {
      q: "Output matches prompt request?",
      gibberish: { score: 0, reason: "no intent to align" },
      vague: { range: [1,3], reason: "weak intent" },
      partial: { range: [4,7] },
      full: { range: [8,10] }
    },
    split: { prompt: 0.5, output: 0.5 }
  },

  format: {
    prompt_only: {
      type: "json",
      schema: {
        clarity: { score: "X", reasoning: "..." },
        specificity: { score: "X", reasoning: "..." },
        constraints: { score: "X", reasoning: "..." },
        elaboration: { score: "X", reasoning: "..." },
        efficiency: { score: "X", reasoning: "..." },
        structure: { score: "X", reasoning: "..." },
        intentAlignment: { score: "X", reasoning: "..." },
        adaptability: { score: "X", reasoning: "..." }
      }
    },
    combined: {
      type: "json",
      schema: {
        prompt: "same as prompt_only schema",
        output: { quality: "X", intentAlignment: "X" }
      }
    }
  }
};

// Compile schema into system prompts
export function compileGradingPrompt(mode: 'prompt_only' | 'combined'): string {
  const G = GRADING_JSON;
  const pillarsStr = Object.entries(G.pillars).map(([k, v]) => 
    `${k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' ')}(0-10): ${v.q} [${Object.entries(v.s).map(([r,d]) => `${r}:${d}`).join('; ')}]`
  ).join('\n');

  const base = `Expert prompt evaluator. Score 0-10 each pillar.
CALIBRATION: ${G.rule}
Scale: poor=${G.scale.poor.join('-')}, avg=${G.scale.avg.join('-')}, good=${G.scale.good.join('-')}, exc=${G.scale.exc.join('-')}

PILLARS:
${pillarsStr}`;

  if (mode === 'prompt_only') {
    return `${base}

OUTPUT: Valid JSON
${JSON.stringify(G.format.prompt_only.schema, null, 0).replace(/"/g, '')}`;
  }

  // Combined mode
  return `${base}

OUTPUT EVALUATION:
1. Quality(0-10): Check prompt first!
   - Gibberish prompt → max 2 (hallucinated)
   - Vague prompt → cap 3-5 (likely hallucination)
   - Clear prompt → score normally
   Levels: ${Object.entries(G.output.quality.clear.s).map(([r,d]) => `${r}:${d}`).join('; ')}

2. Intent Alignment(0-10):
   - Gibberish → 0 (no intent)
   - Vague → 1-3 (weak intent)
   - Partial → 4-7
   - Full → 8-10
   STRICT: No clear user intent = 0-1

OUTPUT: Valid JSON
{prompt:{clarity:{score:X,reasoning:"..."},...8 pillars},output:{quality:X,intentAlignment:X}}`;
}

// Get weights for score calculation
export function getWeights(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(GRADING_JSON.pillars).map(([k, v]) => [k, v.w])
  );
}
