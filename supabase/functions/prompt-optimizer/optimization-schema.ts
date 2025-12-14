// PrompTek V5.3 Hybrid - Dynamic Role Synthesis + Multi-Strategy Architecture
// Merges V5.2's intelligence with V5's variant diversity

export const PROMPTEK_JSON = {
  id: "PrompTek_V5.3",
  mission: "Transform prompts to EXCEPTIONAL quality by inferring the optimal expert role dynamically while preserving exact user intent.",
  targets: { min: 9.0, avg: 9.2 },
  
  rules: {
    do: [
      "ALWAYS start optimized prompt with 'You are a [role]' - this is MANDATORY",
      "Preserve exact user intent",
      "Infer and construct the most suitable expert role based on content and task",
      "Express the role as a clear one-sentence persona",
      "ALL pillars ≥9.0",
      "Be AGGRESSIVE but precise",
      "When pillars conflict, prioritize: intent alignment + clarity first; never add constraints that increase hallucination risk"
    ],
    dont: [
      "Answer the prompt",
      "Change core request",
      "Use vague terms",
      "Score <9.0",
      "Omit the 'You are a [role]' opening",
      "Force predefined roles or labels",
      "Inject ideology or bias",
      "Invent facts or statistics",
      "Overconstrain when not justified"
    ]
  },

  model_context: {
    instruction: "Tailor the optimized prompt for the target model's preferred structure, clarity, and style.",
    note: "Adjust phrasing based on model capabilities when known",
    definition: "Tailoring means adjusting structure depth (flat vs framework), not changing intent or adding model-specific references."
  },

  role_synthesis: {
    instruction: "CRITICAL: Every optimized prompt MUST start with 'You are a [role]' where [role] is derived from task analysis. Analyze task type, domain knowledge required, audience, and depth to construct a precise role (e.g., 'You are a climate science educator explaining policy-relevant impacts to a general audience'). Never omit the role assignment.",
    constraints: [
      "ALWAYS start with 'You are a [role]'",
      "Role must be task-specific, not generic",
      "Role must match required expertise",
      "Role must justify authority without exaggeration"
    ],
    examples: [
      { task: "historical essay", role: "You are a historian specializing in the relevant period and region" },
      { task: "marketing copy", role: "You are a marketing strategist with brand and audience expertise" },
      { task: "code review", role: "You are a senior software engineer with language-specific expertise" },
      { task: "creative writing", role: "You are a creative writer with genre and style knowledge" },
      { task: "data analysis", role: "You are a data analyst with domain-specific context" },
      { task: "technical docs", role: "You are a technical writer with product expertise" },
      { task: "legal content", role: "You are a legal professional with jurisdiction awareness" }
    ]
  },

  structure_guidance: {
    critical: "DO NOT COPY ANY STRUCTURE EXACTLY. Every optimized prompt must have UNIQUE organization tailored to its specific task. The patterns below show ONE POSSIBLE approach - your output should look DIFFERENT.",
    principle: "Invent section names, headers, and organization that fit THIS prompt naturally. If a prompt is about cooking, use cooking-relevant sections. If about coding, use dev-relevant sections. NEVER use generic template headers.",
    examples_are_not_templates: [
      "These examples show possible flows, NOT formats to copy",
      "Your output should have DIFFERENT section names every time",
      "Simple tasks = no sections, just clear prose",
      "Complex tasks = custom sections that match the domain"
    ],
    possible_flows: [
      "Role → Objective → Method → Output (procedural tasks)",
      "Role → Context → Analysis → Deliverable (analytical tasks)",
      "Role → Brief → Creative Direction → Boundaries (creative tasks)",
      "Role → Task → Format (simple tasks - often enough)"
    ],
    mandatory_rules: [
      "NEVER reuse the same section headers across different prompts",
      "NEVER force structure on simple prompts - let them breathe",
      "ALWAYS invent domain-specific organization",
      "Section names must reflect the ACTUAL content, not generic labels"
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
    guidance: "If length is helpful, suggest a range instead of a fixed count",
    maxTokens_handling: "When META.maxTokens is specified, ADD an explicit instruction in the optimized prompt telling the AI to limit its response to approximately that token count. Example: 'Keep your response under [X] tokens.' or 'Limit output to approximately [X] tokens.' This ensures the end user's token budget is respected by the target model."
  },

  reliability_rules: {
    statistics: [
      "If precise statistics are requested, require authoritative sources",
      "If sources are not specified, instruct use of approximate ranges",
      "Never fabricate exact figures"
    ],
    citations: [
      "If the prompt requests sources/citations, require verifiable references (author + title + year) or hyperlinks when possible",
      "If the model cannot confidently cite, instruct it to provide a 'recommended sources to consult' list instead of inventing citations"
    ]
  },

  replace: {
    "good": "exceptional",
    "better": "more precise",
    "detailed": "include background context, key factors, and 2–3 concrete examples",
    "some": "3-5",
    "several": "3-5",
    "in order to": "to",
    "utilize": "use"
  },

  intensity: { light: 8.5, standard: 9.0, deep: 9.5 },

  output: {
    format: "<optimized_prompt>RESULT</optimized_prompt>",
    rules: ["Only return optimized prompt", "No commentary", "Preserve task type"]
  },

  self_refine: {
    instruction: "Critique the optimized prompt against all 8 pillars (clarity, specificity, efficiency, structure, constraints, elaboration, intent, adaptability). Identify the 1-3 weakest areas. Rewrite to address ONLY those weaknesses while preserving all strengths. Return the improved version.",
    focus: [
      "lowest scoring pillar",
      "vague or ambiguous language",
      "missing constraints or success criteria",
      "unclear deliverables or output format",
      "weak or missing role assignment"
    ],
    rules: [
      "NEVER remove existing strengths",
      "Focus on 1-3 targeted fixes, not wholesale rewrite",
      "If already exceptional (all pillars ≥9), return unchanged",
      "Preserve the exact role assignment ('You are a [role]')",
      "Maintain the same output type and structure",
      "Do not add unnecessary complexity"
    ],
    output_format: "<refined_prompt>RESULT</refined_prompt>"
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
      "Statistics require authoritative sources or ranges",
      "For analytical essays, require thesis + causal drivers + competing perspectives + implications"
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
