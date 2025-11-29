// PrompTek V5 Elite - Ultra-Compact JSON Schema
// Optimized for GPT-4o Mini parsing speed

export const PROMPTEK_JSON = {
  id: "PrompTek_V5",
  mission: "Transform prompts to EXCEPTIONAL quality",
  targets: { min: 9.0, avg: 9.2 },
  
  rules: {
    do: [
      "Start with 'You are a [role]'",
      "Preserve exact user intent",
      "ALL pillars ≥9.0",
      "Be AGGRESSIVE"
    ],
    dont: [
      "Answer the prompt",
      "Change core request",
      "Use vague terms",
      "Score <9.0"
    ]
  },

  roles: {
    essay: "historian",
    marketing: "marketing strategist", 
    code: "senior software engineer",
    creative: "creative writer",
    data: "data analyst"
  },

  pillars: {
    clarity:     { t: 9, d: "Zero ambiguity, explicit verbs, single interpretation", f: ["vague→precise", "passive→active", "break >20 words"] },
    specificity: { t: 9, d: "Quantified params, 3-5 examples, exact metrics", f: ["some→3-5", "detailed→300-500w", "add format schema"] },
    efficiency:  { t: 9, d: "Max meaning/token, zero redundancy", f: ["eliminate filler", "compress phrases", "power verbs"] },
    structure:   { t: 9, d: "Context→Task→Method→Constraints→Format", f: ["numbered steps", "section headers", "hierarchical bullets"] },
    constraints: { t: 9, d: "Exact format, length, tone, exclusions", f: ["define ALL boundaries", "precise length", "explicit tone"] },
    elaboration: { t: 9, d: "Audience, use-case, examples, background", f: ["add audience", "context", "2-3 examples"] },
    intent:      { t: 9, d: "TRUE goal clear, success criteria measurable", f: ["success criteria", "measurable outcome", "clarify why"] },
    adaptability:{ t: 9, d: "Works across GPT/Claude/Gemini/Mistral", f: ["model-agnostic", "edge cases", "conditionals"] }
  },

  replace: {
    "good": "exceptional",
    "better": "more precise",
    "detailed": "300-500w covering X,Y,Z",
    "some": "3-5",
    "several": "3-5",
    "in order to": "to",
    "utilize": "use"
  },

  intensity: { light: 8.5, standard: 9.0, deep: 9.5 },

  output: {
    format: "<optimized_prompt>RESULT</optimized_prompt>",
    rules: ["Only return optimized prompt", "No commentary", "Preserve task type"]
  }
};

export const STRATEGIES = {
  clarity: {
    name: "Cognitive Fusion Elite",
    focus: ["clarity", "structure", "intent"],
    targets: { clarity: 9, structure: 9, intent: 9 },
    w: 0.3,
    apply: [
      "Replace ALL vague words",
      "Explicit power verbs",
      "Passive→active",
      "Linear flow: context→task→method→output",
      "Single interpretation only"
    ],
    fix: "If clarity<9: eliminate ambiguity, explicit deliverables, convert passive, break complex sentences"
  },

  specificity: {
    name: "Precision Abstraction Elite",
    focus: ["specificity", "constraints", "clarity"],
    targets: { specificity: 9, constraints: 9, clarity: 9 },
    w: 0.25,
    apply: [
      "Quantify EVERYTHING",
      "Replace vague descriptors",
      "Exact numerical constraints",
      "Format schemas",
      "2-3 concrete examples"
    ],
    fix: "If specificity<9: quantify all (some→3-5), add format schema, include examples, measurable metrics"
  },

  efficiency: {
    name: "Semantic Compression",
    focus: ["efficiency", "specificity", "clarity"],
    targets: { efficiency: 7.8, specificity: 7.5, clarity: 7.5 },
    w: 0.2,
    apply: [
      "Active voice only",
      "Compress redundant phrases",
      "Eliminate filler words",
      "Dense meaning"
    ],
    fix: "If efficiency<7.8: convert passive→active, remove filler, consolidate, power verbs"
  },

  structure: {
    name: "Directive Synthesis",
    focus: ["structure", "clarity", "constraints"],
    targets: { structure: 7.8, clarity: 7.5, constraints: 7.5 },
    w: 0.15,
    apply: [
      "Context→Task→Method→Constraints→Output",
      "Numbered steps",
      "Section headers",
      "Hierarchical bullets",
      "Explicit dependencies"
    ],
    fix: "If structure<7.8: add numbered steps, section headers, hierarchical bullets, state order"
  },

  constraints: {
    name: "Constraint-Driven Creativity Elite",
    focus: ["constraints", "elaboration", "specificity"],
    targets: { constraints: 9, elaboration: 9, specificity: 9 },
    w: 0.1,
    apply: [
      "Exact format schema",
      "Precise length (150-200w)",
      "Explicit tone",
      "Style rules",
      "Exclusions & edge cases"
    ],
    fix: "If constraints<9: format schema, length limits, explicit tone, exclusions, quality criteria"
  },

  elaboration: {
    name: "Contextual Intelligence Matrix",
    focus: ["elaboration", "intent", "adaptability"],
    targets: { elaboration: 8.6, intent: 8.5, adaptability: 8.5 },
    w: 0.12,
    cond: { type: "length", op: "<", val: 200 },
    apply: [
      "Audience awareness",
      "Use-case context",
      "Relevant background",
      "1-2 examples"
    ],
    fix: "If elaboration<8.6: specify audience, add context, provide examples, include background"
  },

  intent: {
    name: "Semantic Anchoring Elite",
    focus: ["intent", "specificity", "clarity"],
    targets: { intent: 9, specificity: 8.5, clarity: 8.5 },
    w: 0.12,
    cond: { type: "regex", pattern: "\\b(improve|better|fix|enhance|optimize|analyze|make)\\b" },
    apply: [
      "Identify TRUE goal",
      "Explicit success criteria",
      "Define outcome precisely",
      "Preserve exact verb"
    ],
    fix: "If intent<9: add success criteria, define outcome, state primary goal, anchor terms"
  },

  adaptability: {
    name: "Cognitive Elasticity",
    focus: ["adaptability", "intent", "clarity"],
    targets: { adaptability: 8.6, intent: 8.5, clarity: 8.5 },
    w: 0.08,
    apply: [
      "Model-agnostic language",
      "Conditional phrasing",
      "Fallback options",
      "Handle variations"
    ],
    fix: "If adaptability<8.6: add if/when clauses, fallbacks, avoid model-specific terms"
  }
};

export type StrategyKey = keyof typeof STRATEGIES;