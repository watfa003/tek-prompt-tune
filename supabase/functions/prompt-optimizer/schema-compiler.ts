// PrompTek V5 Elite - JSON Schema Compiler
// Outputs ultra-compact JSON instructions for GPT-4o Mini

import { PROMPTEK_JSON, STRATEGIES, type StrategyKey } from './optimization-schema.ts';

/**
 * Compiles master system as compact JSON string
 */
export function compileMasterSystemPrompt(): string {
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    roles: PROMPTEK_JSON.roles,
    pillars: PROMPTEK_JSON.pillars,
    replace: PROMPTEK_JSON.replace,
    intensity: PROMPTEK_JSON.intensity,
    output: PROMPTEK_JSON.output
  });
}

/**
 * Compiles strategy-specific JSON prompt
 */
export function compileStrategyPrompt(strategyKey: StrategyKey): string {
  const strat = STRATEGIES[strategyKey];
  
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    roles: PROMPTEK_JSON.roles,
    pillars: PROMPTEK_JSON.pillars,
    replace: PROMPTEK_JSON.replace,
    strategy: {
      name: strat.name,
      focus: strat.focus,
      targets: strat.targets,
      apply: strat.apply,
      fix: strat.fix
    },
    output: PROMPTEK_JSON.output
  });
}

/**
 * Get strategy display name
 */
export function getStrategyName(strategyKey: StrategyKey): string {
  return STRATEGIES[strategyKey]?.name || strategyKey;
}

/**
 * Get strategy weight
 */
export function getStrategyWeight(strategyKey: StrategyKey): number {
  return STRATEGIES[strategyKey]?.w || 0.1;
}

/**
 * Check if strategy condition is met
 */
export function checkStrategyCondition(strategyKey: StrategyKey, prompt: string): boolean {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy.cond) return true;

  const cond = strategy.cond;
  
  if (cond.type === 'length') {
    const length = prompt.length;
    switch (cond.op) {
      case '<': return length < cond.val;
      case '>': return length > cond.val;
      case '<=': return length <= cond.val;
      case '>=': return length >= cond.val;
      default: return true;
    }
  }
  
  if (cond.type === 'regex') {
    const regex = new RegExp(cond.pattern, 'i');
    return regex.test(prompt);
  }

  return true;
}

/**
 * Get available strategies filtered by conditions
 */
export function getAvailableStrategies(prompt: string): StrategyKey[] {
  return (Object.keys(STRATEGIES) as StrategyKey[]).filter(key => 
    checkStrategyCondition(key, prompt)
  );
}

/**
 * Build optimization strategies object for edge function
 */
export function buildOptimizationStrategies(): Record<StrategyKey, {
  name: string;
  definition: string;
  systemPrompt: string;
  weight: number;
  condition?: (prompt: string) => boolean;
}> {
  const strategies: any = {};
  
  for (const key of Object.keys(STRATEGIES) as StrategyKey[]) {
    const schema = STRATEGIES[key];
    strategies[key] = {
      name: schema.name,
      definition: schema.apply.join('. '),
      systemPrompt: compileStrategyPrompt(key),
      weight: schema.w,
      ...(schema.cond && {
        condition: (prompt: string) => checkStrategyCondition(key, prompt)
      })
    };
  }
  
  return strategies;
}

// Pre-compiled exports
export const COMPILED_MASTER_PROMPT = compileMasterSystemPrompt();
export const COMPILED_STRATEGIES = buildOptimizationStrategies();

export { StrategyKey };