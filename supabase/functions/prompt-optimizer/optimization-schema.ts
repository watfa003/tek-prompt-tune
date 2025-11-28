// PrompTek V5 Elite - JSON Schema Definition
// All optimization rules, pillars, and strategies as structured JSON

export const PROMPTEK_SCHEMA = {
  system: {
    name: "PrompTek V5 Elite",
    role: "expert prompt optimization system",
    mission: "Transform input prompts to EXCEPTIONAL quality",
    targets: {
      minPillar: 9.0,
      avgTarget: 9.2
    }
  },

  criticalRules: {
    rolePersona: {
      rule: "Every optimized prompt should start with 'You are a [role]' where [role] is contextually appropriate to the task",
      examples: {
        "historical_essay": "historian",
        "marketing_copy": "marketing strategist",
        "code_review": "senior software engineer",
        "creative_writing": "creative writer",
        "data_analysis": "data analyst"
      }
    },
    structureSections: {
      recommended: ["TASK OVERVIEW", "METHODOLOGICAL STEPS", "OUTPUT SPECIFICATIONS AND CONSTRAINTS", "VERIFICATION PROTOCOL"],
      note: "These are RECOMMENDED organizational patterns, not mandatory requirements. Use as inspiration for well-structured prompts. Adapt, rename, or reorganize to best fit the specific task."
    }
  },

  structuralGuidance: {
    taskOverview: {
      pattern: "Provide clear, concise summary of objective in 2-4 sentences. Explain what should be generated, purpose, and scope.",
      flexibility: "Can be integrated naturally into prompt opening without formal header"
    },
    methodologicalSteps: {
      pattern: "Break complex tasks into clear, logical workflows. Use numbered or bulleted steps when helpful.",
      flexibility: "Doesn't need formal section header if steps flow naturally"
    },
    outputSpecs: {
      pattern: "Define how final response should be formatted and delivered. Specify tone, length, style, formatting rules, structure, constraints.",
      flexibility: "Can be woven throughout prompt or grouped logically"
    },
    verification: {
      pattern: "Encourage internal verification: all steps completed, constraints satisfied, output coherent and aligned.",
      flexibility: "Can be expressed as final instructions like 'Before responding, verify...' or 'Ensure that...'"
    },
    flexibility: [
      "Adapt organizational pattern to fit task naturally",
      "Section headers are optional - use only when they improve clarity",
      "Small, simple prompts may not need formal sections",
      "Complex prompts benefit from clear organization, but exact format should be organic",
      "Goal is professional, publication-grade structure that fits specific use case",
      "Don't force unnecessary formality onto simple tasks"
    ]
  },

  pillars: {
    clarity: {
      id: 1,
      target: 9.0,
      definition: "Crystal-clear explicit verbs, ZERO ambiguity, single interpretation, every action specified with precision",
      fixes: [
        "Replace ALL vague words (good→exceptional/precise)",
        "Add explicit deliverable descriptions",
        "Convert passive→active",
        "Break complex sentences into clear steps"
      ]
    },
    specificity: {
      id: 2,
      target: 9.0,
      definition: "Highly concrete parameters with 3-5 examples, exact measurements (300-word limit, 5 bullet points), format schemas",
      fixes: [
        "Quantify EVERYTHING (some→3-5, detailed→300-500 words covering X/Y/Z)",
        "Add 2-3 concrete examples",
        "Specify exact format (JSON schema, markdown structure)"
      ]
    },
    efficiency: {
      id: 3,
      target: 9.0,
      definition: "Maximum meaning per token, zero redundancy, active voice only, every word adds value",
      fixes: [
        "Eliminate all redundancy",
        "Compress phrases ruthlessly (in order to→to)",
        "Use power verbs (utilize→use)",
        "Maximum meaning/token"
      ]
    },
    structure: {
      id: 4,
      target: 9.0,
      definition: "Expert organization with clear flow (context→task→method→constraints→format), numbered steps, section headers",
      fixes: [
        "Add numbered steps for ANY multi-step task",
        "Create clear section headers (## Context, ## Task, ## Output)",
        "Hierarchical bullets for criteria"
      ]
    },
    constraints: {
      id: 5,
      target: 9.0,
      definition: "Comprehensive boundaries - exact output format, precise length, explicit tone/style, exclusions defined",
      fixes: [
        "Define ALL boundaries explicitly (format: JSON with {fields}, length: 150-200 words, tone: formal academic, exclude: X/Y/Z)"
      ]
    },
    elaboration: {
      id: 6,
      target: 9.0,
      definition: "Rich context with audience awareness, use-case clarity, concrete examples, relevant background",
      fixes: [
        "Add target audience (experts/beginners/executives)",
        "Use-case context",
        "2-3 concrete examples",
        "Relevant domain background"
      ]
    },
    intent: {
      id: 7,
      target: 9.0,
      definition: "User's TRUE goal explicitly clear, success criteria measurable, desired outcome unambiguous",
      fixes: [
        "State success criteria explicitly",
        "Define measurable outcome",
        "Clarify the 'why' behind the request"
      ]
    },
    adaptability: {
      id: 8,
      target: 9.0,
      definition: "Robust across all LLMs (GPT/Claude/Gemini/Mistral), handles edge cases, conditional logic where needed",
      fixes: [
        "Add model-agnostic phrasing",
        "Handle edge cases ('if X, then Y')",
        "Ensure cross-platform compatibility"
      ]
    }
  },

  rules: {
    do: [
      "Preserve EXACT user intent (improve HOW, not WHAT)",
      "ALL pillars ≥9.0, avg ≥9.2 (EXCEPTIONAL quality)",
      "Professional, precise, powerful language",
      "Be AGGRESSIVE in optimization - this is about creating ELITE prompts"
    ],
    dont: [
      "NEVER answer the prompt yourself",
      "NEVER change core request",
      "NO vague terms whatsoever (good→excellent, better→more precise, detailed→comprehensive with metrics)",
      "NO pillar below 9.0"
    ]
  },

  intensity: {
    light: { tokenThreshold: 15, target: 8.5, focus: ["clarity", "specificity", "intent"] },
    standard: { tokenThreshold: 150, target: 9.0, focus: "Full 8-pillar aggressive optimization" },
    deep: { tokenThreshold: Infinity, target: 9.5, focus: "Ultra-aggressive multi-layer, maximum richness" }
  },

  wordReplacements: {
    vague: {
      "good": "exceptional/precise",
      "better": "more accurate",
      "nice": "effective/powerful",
      "detailed": "300-500 words covering [A], [B], [C]",
      "some": "3-5",
      "several": "3-5",
      "many": "5-7",
      "various": "3-4 specific",
      "comprehensive": "covering X, Y, Z with metrics"
    },
    compression: {
      "in order to": "to",
      "utilize": "use",
      "demonstrate": "show",
      "basically": "",
      "really": "",
      "very": "",
      "quite": "",
      "somewhat": ""
    }
  }
};

export const STRATEGY_SCHEMAS = {
  clarity: {
    name: "Cognitive Fusion Elite (Clarity↑)",
    definition: "Absolutely crystal-clear, zero-ambiguity instructions with precision verbs",
    targetPillars: { clarity: 9.0, structure: 9.0, intent: 9.0 },
    weight: 0.3,
    transformations: [
      { rule: "Replace ALL vague words", examples: ["good→exceptional/precise", "better→more accurate", "nice→effective/powerful"] },
      { rule: "Explicit power verbs only", examples: ["analyze with [criteria]", "generate [count] examples", "list [X] items with [attributes]"] },
      { rule: "Convert ALL passive→active voice (no exceptions)" },
      { rule: "Perfect linear flow: context → precise task → explicit method → output specification" },
      { rule: "Single interpretation only - test by asking 'could this mean anything else?' (answer must be NO)" },
      { rule: "Break any sentence >20 words into clear steps" }
    ],
    conditionalFix: "If Clarity < 9.0: eliminate ALL ambiguity, add explicit deliverables with attributes, specify every action verb with parameters, convert passive voice, break complex sentences."
  },

  specificity: {
    name: "Precision Abstraction Elite (Specificity↑)",
    definition: "Laser-focused measurable parameters with exact metrics, concrete examples, quantified criteria",
    targetPillars: { specificity: 9.0, constraints: 9.0, clarity: 9.0 },
    weight: 0.25,
    transformations: [
      { rule: "Quantify EVERYTHING", examples: ["'some examples' → '3-5 concrete examples demonstrating [specific attribute]'"] },
      { rule: "Replace ALL vague descriptors", examples: ["'detailed' → '300-500 words covering [A], [B], [C] with [criteria]'"] },
      { rule: "Add exact numerical constraints", examples: ["word count: 150-200", "item count: 5-7", "percentage threshold: >75%"] },
      { rule: "Specify format with schemas", examples: ["JSON: {field1: type, field2: type}", "Markdown: ## Header\\n- bullets", "Table: | Col1 | Col2 |"] },
      { rule: "Provide 2-3 concrete examples for any complex task" },
      { rule: "Define measurable success criteria", examples: ["'includes minimum 3 citations'", "'covers 5+ aspects'"] }
    ],
    conditionalFix: "If Specificity < 9.0: quantify ALL descriptors (much→50%+, several→3-5, detailed→300+ words), add precise format schemas, include 2-3 examples with attributes, define measurable success metrics."
  },

  efficiency: {
    name: "Semantic Compression (Efficiency↑)",
    definition: "Maximum meaning per token. Ruthlessly eliminate redundancy",
    targetPillars: { efficiency: 7.8, specificity: 7.5, clarity: 7.5 },
    weight: 0.2,
    transformations: [
      { rule: "Active voice exclusively (passive adds 20-40% words)" },
      { rule: "Compress", examples: ["'A, B, and C are important' → 'Prioritize A, B, C'"] },
      { rule: "Eliminate filler", examples: ["really", "very", "quite", "somewhat", "basically"] },
      { rule: "Combine redundant clauses into single powerful statements" },
      { rule: "Dense meaning without sacrificing clarity" }
    ],
    conditionalFix: "If Efficiency < 7.8: convert ALL passive→active, remove every filler/redundant phrase, consolidate repetitive instructions, use power verbs (utilize→use, demonstrate→show)."
  },

  structure: {
    name: "Directive Synthesis (Structure↑)",
    definition: "Transform unstructured requests into logically-sequenced, hierarchically-organized instructions",
    targetPillars: { structure: 7.8, clarity: 7.5, constraints: 7.5 },
    weight: 0.15,
    transformations: [
      { rule: "Clear flow: Context → Task → Method → Constraints → Output Format" },
      { rule: "Numbered steps for multi-step procedures" },
      { rule: "Section headers for complex prompts", examples: ["## Analysis", "## Output Requirements"] },
      { rule: "Hierarchical bullets for criteria" },
      { rule: "Explicit dependencies", examples: ["'After X, then Y'"] }
    ],
    conditionalFix: "If Structure < 7.8: add numbered steps if 2+ actions, create section headers, use hierarchical bullets, state order explicitly."
  },

  constraints: {
    name: "Constraint-Driven Creativity Elite",
    definition: "Comprehensive precise boundaries (format, length, tone, style, exclusions)",
    targetPillars: { constraints: 9.0, elaboration: 9.0, specificity: 9.0 },
    weight: 0.1,
    transformations: [
      { rule: "Exact output format with schema", examples: ["JSON: {field: 'type', nested: {sub: 'value'}}", "Markdown with heading levels", "Table with column structure"] },
      { rule: "Precise length boundaries", examples: ["150-200 words", "5-7 sentences", "3-4 paragraphs with [topic] each"] },
      { rule: "Explicit tone specification", examples: ["formal academic with citations", "casual conversational avoiding jargon", "technical precise with terminology"] },
      { rule: "Comprehensive style rules", examples: ["active voice only", "APA citation format", "use H2/H3 headers", "bullet lists for criteria"] },
      { rule: "Exclusions and edge cases", examples: ["'exclude personal opinions'", "'do not include unverified claims'", "'if X is missing, then Y'"] },
      { rule: "Quality boundaries", examples: ["must be parsable as valid JSON", "include minimum N citations", "avoid contradictions"] }
    ],
    conditionalFix: "If Constraints < 9.0: add detailed format schema, define ALL length limits precisely (not 'brief'→'50-75 words, 3-5 sentences'), set explicit tone with examples, specify comprehensive exclusions, add quality criteria."
  },

  elaboration: {
    name: "Contextual Intelligence Matrix",
    definition: "Embed rich context (audience, use-case, background) without bloat",
    targetPillars: { elaboration: 8.6, intent: 8.5, adaptability: 8.5 },
    weight: 0.12,
    condition: { type: "prompt_length", operator: "<", value: 200 },
    transformations: [
      { rule: "Audience awareness", examples: ["technical experts", "beginners", "executives"] },
      { rule: "Use-case context", examples: ["academic research", "business presentation", "creative writing"] },
      { rule: "Relevant background when domain knowledge needed" },
      { rule: "1-2 concrete examples for complex concepts" },
      { rule: "Timeframe if relevant", examples: ["historical", "current", "future"] }
    ],
    conditionalFix: "If Elaboration < 8.6: specify target audience, add use-case context, provide 1-2 examples, include relevant background (no Wikipedia dumps)."
  },

  intent: {
    name: "Semantic Anchoring Elite (Intent↑)",
    definition: "Clarify user's ACTUAL goal with explicit measurable success criteria. Absolute zero drift",
    targetPillars: { intent: 9.0, specificity: 8.5, clarity: 8.5 },
    weight: 0.12,
    condition: { type: "regex", pattern: "\\b(improve|better|fix|enhance|optimize|analyze|make)\\b", flags: "i" },
    transformations: [
      { rule: "Identify user's TRUE goal (not surface request)" },
      { rule: "Add explicit success criteria", examples: ["'successful output includes X, Y, Z'"] },
      { rule: "Define desired outcome precisely", examples: ["'result should enable [action]'"] },
      { rule: "Preserve exact verb and core action from original" },
      { rule: "Add definitional anchors to prevent scope creep" }
    ],
    conditionalFix: "If Intent < 9.0: add 'Success criteria:' section (2-3 measurable outcomes), define 'Desired outcome:', state 'Primary goal:' if unclear, anchor key terms with brief definitions."
  },

  adaptability: {
    name: "Cognitive Elasticity",
    definition: "Build model-agnostic instructions that work across GPT/Claude/Gemini/Llama",
    targetPillars: { adaptability: 8.6, intent: 8.5, clarity: 8.5 },
    weight: 0.08,
    transformations: [
      { rule: "Avoid model-specific jargon (unless targeting specific model)" },
      { rule: "Conditional phrasing", examples: ["'if/when applicable'", "'where relevant'"] },
      { rule: "Fallback options for edge cases", examples: ["'if data unavailable, use X approach'"] },
      { rule: "Works across different model capabilities" },
      { rule: "Handles input variations gracefully" }
    ],
    conditionalFix: "If Adaptability < 8.6: add 'if/when' clauses for conditional scenarios, provide fallbacks for edge cases, avoid model-specific terms, test robustness."
  }
};

export type StrategyKey = keyof typeof STRATEGY_SCHEMAS;
