// PrompTek V5 Elite - Compact Schema Compiler
// Compiles JSON schemas into token-efficient prompts

import { PROMPTEK_SCHEMA, STRATEGY_SCHEMAS, type StrategyKey } from './optimization-schema.ts';

/**
 * Compiles a COMPACT master system prompt from JSON schema
 * Optimized for minimal tokens while preserving all rules
 */
export function compileMasterSystemPrompt(): string {
  const s = PROMPTEK_SCHEMA;
  
  // Compact pillars: "1.Clarity≥9: definition | fixes"
  const pillarsCompact = Object.entries(s.pillars).map(([key, p]) => 
    `${p.id}.${key.charAt(0).toUpperCase() + key.slice(1)}≥${p.target}: ${p.definition}`
  ).join('\n');

  // Compact fixes as single line per pillar
  const fixesCompact = Object.entries(s.pillars).map(([key, p]) => 
    `${key}<${p.target}: ${p.fixes.join('; ')}`
  ).join('\n');

  // Compact role examples
  const roleExamples = Object.entries(s.criticalRules.rolePersona.examples)
    .map(([task, role]) => `${task.replace(/_/g, ' ')}→${role}`)
    .join(', ');

  return `SYSTEM: ${s.system.name}
MISSION: ${s.system.mission}
TARGETS: All pillars ≥${s.system.targets.minPillar}, avg ≥${s.system.targets.avgTarget}

RULES:
• Start with "You are a [role]" (${roleExamples})
• Structure: TASK→METHOD→CONSTRAINTS→VERIFY (adapt to task)
• Preserve exact user intent
• Be aggressive - create ELITE prompts
• NEVER answer the prompt, only optimize it
• NO vague terms (good→exceptional, some→3-5, detailed→300-500 words)

8 PILLARS (each ≥${s.system.targets.minPillar}):
${pillarsCompact}

FIXES:
${fixesCompact}

INTENSITY: <15 tokens→8.5+, 15-150→9.0+, >150→9.5+

OUTPUT: Return ONLY the optimized prompt between <optimized_prompt> tags.`;
}

/**
 * Compiles a COMPACT strategy-specific prompt
 */
export function compileStrategyPrompt(strategyKey: StrategyKey): string {
  const master = compileMasterSystemPrompt();
  const strat = STRATEGY_SCHEMAS[strategyKey];
  
  // Compact target pillars
  const targets = Object.entries(strat.targetPillars)
    .map(([p, score]) => `${p}≥${score}`)
    .join(', ');

  // Compact transformations
  const transforms = strat.transformations.map(t => {
    if ('examples' in t && t.examples) {
      return `• ${t.rule} (${t.examples.slice(0, 2).join(', ')})`;
    }
    return `• ${t.rule}`;
  }).join('\n');

  return `${master}

STRATEGY: ${strat.name}
${strat.definition}
Targets: ${targets}

Apply:
${transforms}

${strat.conditionalFix}`;
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

// Export pre-compiled prompts for direct use
export const COMPILED_MASTER_PROMPT = compileMasterSystemPrompt();
export const COMPILED_STRATEGIES = buildOptimizationStrategies();

export { StrategyKey };