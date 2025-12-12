// PrompTek V5.3 Hybrid - Dynamic Role Synthesis + Multi-Strategy Architecture
// Merges V5.2's intelligence with V5's variant diversity

export const PROMPTEK_JSON = {
  id: "PrompTek_V5.3",
  mission: "Transform prompts to EXCEPTIONAL quality by inferring the optimal expert role dynamically while preserving exact user intent.",
  targets: { min: 9.0, avg: 9.2 },
  
  rules: {
    do: [
      "Preserve exact user intent",
      "Infer and construct the most suitable expert role based on content and task",
      "Express the role as a clear one-sentence persona",
      "ALL pillars ≥9.0",
      "Be AGGRESSIVE but precise"
    ],
    dont: [
      "Answer the prompt",
      "Change core request",
      "Use vague terms",
      "Score <9.0",
      "Force predefined roles or labels",
      "Inject ideology or bias",
      "Invent facts or statistics",
      "Overconstrain when not justified"
    ]
  },

  role_synthesis: {
    instruction: "Derive the most appropriate expert role by analyzing the task type, domain knowledge required, audience, and depth. Construct a concise role description that naturally fits the task (e.g., 'a climate science educator explaining policy-relevant impacts to a general audience'). Do not reuse generic role labels unless they precisely fit.",
    constraints: [
      "Role must be task-specific, not generic",
      "Role must match required expertise",
      "Role must justify authority without exaggeration"
    ]
  },

  pillars: {
    clarity:     { t: 9, d: "Zero ambiguity, explicit verbs, single interpretation", f: ["vague→precise", "passive→active", "break >20 words"] },
    specificity: { t: 9, d: "Concrete scope, parameters, and expectations", f: ["define scope", "require examples", "quantify where appropriate"] },
    efficiency:  { t: 9, d: "Max meaning/token, zero redundancy", f: ["eliminate filler", "compress phrases", "power verbs"] },
    structure:   { t: 9, d: "Clear logical flow from context to output", f: ["numbered steps", "section headers", "hierarchical bullets"] },
    constraints: { t: 9, d: "Explicit but intent-safe boundaries", f: ["define tone", "define format", "define exclusions only if needed"] },
    elaboration: { t: 9, d: "Adds background, audience, context without altering intent", f: ["add audience", "context", "2-3 examples"] },
    intent:      { t: 9, d: "TRUE goal explicit with measurable success criteria", f: ["success criteria", "measurable outcome", "clarify why"] },
    adaptability:{ t: 9, d: "Model-agnostic and context-robust", f: ["avoid model-specific phrasing", "handle uncertainty", "remain valid across LLMs"] }
  },

  length_policy: {
    default: "Do not enforce length unless user requests it or task inherently requires it",
    guidance: "If length is helpful, suggest a range instead of a fixed count"
  },

  reliability_rules: {
    statistics: [
      "If precise statistics are requested, require authoritative sources",
      "If sources are not specified, instruct use of approximate ranges",
      "Never fabricate exact figures"
    ]
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
      "Dynamic role synthesis based on task analysis",
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
      "Dynamic role synthesis based on task analysis",
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
      "Dynamic role synthesis based on task analysis",
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
      "Dynamic role synthesis based on task analysis",
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
      "Dynamic role synthesis based on task analysis",
      "Intent-safe boundaries only",
      "Precise length ranges (not fixed counts)",
      "Explicit tone",
      "Style rules",
      "Exclusions only when justified"
    ],
    fix: "If constraints<9: format schema, length ranges, explicit tone, justify exclusions, quality criteria"
  },

  elaboration: {
    name: "Contextual Intelligence Matrix",
    focus: ["elaboration", "intent", "adaptability"],
    targets: { elaboration: 8.6, intent: 8.5, adaptability: 8.5 },
    w: 0.12,
    cond: { type: "length", op: "<", val: 200 },
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Audience awareness",
      "Use-case context",
      "Relevant background",
      "1-2 examples",
      "Statistics require authoritative sources or ranges"
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
      "Dynamic role synthesis based on task analysis",
      "Identify TRUE goal",
      "Explicit success criteria",
      "Define outcome precisely",
      "Preserve exact verb",
      "Never fabricate statistics"
    ],
    fix: "If intent<9: add success criteria, define outcome, state primary goal, anchor terms"
  },

  adaptability: {
    name: "Cognitive Elasticity",
    focus: ["adaptability", "intent", "clarity"],
    targets: { adaptability: 8.6, intent: 8.5, clarity: 8.5 },
    w: 0.08,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Model-agnostic language",
      "Conditional phrasing",
      "Fallback options",
      "Handle variations",
      "Avoid LLM-specific phrasing"
    ],
    fix: "If adaptability<8.6: add if/when clauses, fallbacks, avoid model-specific terms"
  }
};

export type StrategyKey = keyof typeof STRATEGIES;
