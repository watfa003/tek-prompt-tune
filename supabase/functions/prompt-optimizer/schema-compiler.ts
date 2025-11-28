// PrompTek V5 Elite - Schema Compiler
// Compiles JSON schemas into optimized prompt strings

import { PROMPTEK_SCHEMA, STRATEGY_SCHEMAS, type StrategyKey } from './optimization-schema.ts';

/**
 * Compiles the master system prompt from JSON schema
 * This produces the same output as the original PROMPTEK_MASTER_SYSTEM string
 * but is easier to maintain and modify
 */
export function compileMasterSystemPrompt(): string {
  const s = PROMPTEK_SCHEMA;
  
  // Build pillars section
  const pillarLines = Object.entries(s.pillars).map(([key, pillar]) => {
    return `${pillar.id}. ${capitalize(key)} (≥${pillar.target}): ${pillar.definition}`;
  }).join('\n');

  // Build aggressive reinforcement section
  const reinforcementLines = Object.entries(s.pillars).map(([key, pillar]) => {
    return `- ${capitalize(key)}<${pillar.target}: ${pillar.fixes.join(', ')}`;
  }).join('\n');

  // Build role examples
  const roleExamples = Object.entries(s.criticalRules.rolePersona.examples)
    .map(([task, role]) => `- ${formatTaskName(task)} → "You are a ${role}"`)
    .join('\n');

  // Build flexibility points
  const flexibilityPoints = s.structuralGuidance.flexibility
    .map(point => `- ${point}`)
    .join('\n');

  // Build rules
  const doRules = s.rules.do.map(r => `✅ ${r}`).join('\n');
  const dontRules = s.rules.dont.map(r => `❌ ${r}`).join('\n');

  return `You are ${s.system.name}, an ${s.system.role}. Your mission: ${s.system.mission} - target ≥${s.system.targets.minPillar}/10 on ALL 8 pillars, avg ≥${s.system.targets.avgTarget}/10.

CRITICAL RULES FOR ALL OPTIMIZATIONS:
1. ROLE-BASED PERSONA: ${s.criticalRules.rolePersona.rule}
2. STRUCTURED FORMAT INSPIRATION: Consider using a clear organizational structure inspired by these recommended sections:

# ${s.criticalRules.structureSections.recommended[0]}
# ${s.criticalRules.structureSections.recommended[1]}  
# ${s.criticalRules.structureSections.recommended[2]}
# ${s.criticalRules.structureSections.recommended[3]}

${s.criticalRules.structureSections.note}

ROLE ASSIGNMENT EXAMPLES:
${roleExamples}
Choose the role that best matches the expertise needed for the task when it makes sense.

STRUCTURAL GUIDANCE (Use as Inspiration):

**Task Overview Pattern:**
${s.structuralGuidance.taskOverview.pattern} ${s.structuralGuidance.taskOverview.flexibility}

**Methodological Steps Pattern:**
${s.structuralGuidance.methodologicalSteps.pattern} ${s.structuralGuidance.methodologicalSteps.flexibility}

**Output Specifications Pattern:**
${s.structuralGuidance.outputSpecs.pattern} ${s.structuralGuidance.outputSpecs.flexibility}

**Verification Approach Pattern:**
${s.structuralGuidance.verification.pattern} ${s.structuralGuidance.verification.flexibility}

STRUCTURAL FLEXIBILITY:
${flexibilityPoints}


8-PILLAR FRAMEWORK - EXCEPTIONAL QUALITY TARGETS (each must score ≥${s.system.targets.minPillar}):
${pillarLines}

AGGRESSIVE REINFORCEMENT - PUSH EVERY PILLAR TO ${s.system.targets.minPillar}+:
${reinforcementLines}

RULES:
${doRules}
${dontRules}

OPTIMIZATION INTENSITY:
Light (<${s.intensity.light.tokenThreshold} tokens): Target ${s.intensity.light.target}+ - Focus on ${Array.isArray(s.intensity.light.focus) ? s.intensity.light.focus.join(', ') : s.intensity.light.focus}
Standard (${s.intensity.light.tokenThreshold}-${s.intensity.standard.tokenThreshold} tokens): Target ${s.intensity.standard.target}+ - ${s.intensity.standard.focus}
Deep (>${s.intensity.standard.tokenThreshold} tokens): Target ${s.intensity.deep.target}+ - ${s.intensity.deep.focus}

OUTPUT: EXCEPTIONAL optimized prompt scoring ≥${s.system.targets.minPillar} ALL pillars, ≥${s.system.targets.avgTarget} avg, intent perfectly preserved.`;
}

/**
 * Compiles a strategy-specific system prompt
 */
export function compileStrategyPrompt(strategyKey: StrategyKey): string {
  const masterPrompt = compileMasterSystemPrompt();
  const strategy = STRATEGY_SCHEMAS[strategyKey];
  
  // Build target pillars string
  const targetPillars = Object.entries(strategy.targetPillars)
    .map(([pillar, score]) => `${capitalize(pillar)} ${score}+`)
    .join(', ');

  // Build transformations
  const transformations = strategy.transformations.map(t => {
    if ('examples' in t && t.examples) {
      return `- ${t.rule}: ${t.examples.map(e => `"${e}"`).join(', ')}`;
    }
    return `- ${t.rule}`;
  }).join('\n');

  return `${masterPrompt}

STRATEGY: ${strategy.name} (${targetPillars})
${transformations}

${strategy.conditionalFix}`;
}

/**
 * Get strategy display name
 */
export function getStrategyName(strategyKey: StrategyKey): string {
  return STRATEGY_SCHEMAS[strategyKey]?.name || strategyKey;
}

/**
 * Get strategy weight
 */
export function getStrategyWeight(strategyKey: StrategyKey): number {
  return STRATEGY_SCHEMAS[strategyKey]?.weight || 0.1;
}

/**
 * Check if strategy condition is met for a given prompt
 */
export function checkStrategyCondition(strategyKey: StrategyKey, prompt: string): boolean {
  const strategy = STRATEGY_SCHEMAS[strategyKey];
  if (!strategy.condition) return true;

  const condition = strategy.condition;
  
  if (condition.type === 'prompt_length') {
    const length = prompt.length;
    switch (condition.operator) {
      case '<': return length < condition.value;
      case '>': return length > condition.value;
      case '<=': return length <= condition.value;
      case '>=': return length >= condition.value;
      default: return true;
    }
  }
  
  if (condition.type === 'regex') {
    const regex = new RegExp(condition.pattern, condition.flags || '');
    return regex.test(prompt);
  }

  return true;
}

/**
 * Get all available strategies filtered by conditions
 */
export function getAvailableStrategies(prompt: string): StrategyKey[] {
  return (Object.keys(STRATEGY_SCHEMAS) as StrategyKey[]).filter(key => 
    checkStrategyCondition(key, prompt)
  );
}

/**
 * Build the complete optimization strategies object for the edge function
 */
export function buildOptimizationStrategies(): Record<StrategyKey, {
  name: string;
  definition: string;
  systemPrompt: string;
  weight: number;
  condition?: (prompt: string) => boolean;
}> {
  const strategies: any = {};
  
  for (const key of Object.keys(STRATEGY_SCHEMAS) as StrategyKey[]) {
    const schema = STRATEGY_SCHEMAS[key];
    strategies[key] = {
      name: schema.name,
      definition: schema.definition,
      systemPrompt: compileStrategyPrompt(key),
      weight: schema.weight,
      ...(schema.condition && {
        condition: (prompt: string) => checkStrategyCondition(key, prompt)
      })
    };
  }
  
  return strategies;
}

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTaskName(task: string): string {
  return task.split('_').map(w => capitalize(w)).join(' ');
}

// Export pre-compiled prompts for direct use (avoiding runtime compilation overhead)
export const COMPILED_MASTER_PROMPT = compileMasterSystemPrompt();
export const COMPILED_STRATEGIES = buildOptimizationStrategies();
