// PrompTek V5 Elite - JSON Schema Compiler
// Outputs ultra-compact JSON instructions for GPT-4o Mini
// Now with DSPy-style dynamic wording replacement

import { PROMPTEK_JSON, STRATEGIES, type StrategyKey } from './optimization-schema.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cache for dynamic replacements (refreshed periodically)
let dynamicReplacementsCache: Record<string, string> = {};
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load winning wording patterns from Supabase
 * Returns a map of original_phrase -> winning_phrase
 */
async function loadDynamicReplacements(): Promise<Record<string, string>> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase credentials not available, using static replacements only');
      return {};
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('wording_patterns')
      .select('original_phrase, winning_phrase, avg_score_improvement')
      .eq('is_active', true)
      .gte('confidence', 0.6) // Only high-confidence patterns
      .order('avg_score_improvement', { ascending: false });
    
    if (error) {
      console.error('Failed to load wording patterns:', error);
      return {};
    }
    
    const dynamicReplace: Record<string, string> = {};
    for (const pattern of data || []) {
      // Only use the best variation for each original phrase
      if (!dynamicReplace[pattern.original_phrase]) {
        dynamicReplace[pattern.original_phrase] = pattern.winning_phrase;
      }
    }
    
    console.log(`📚 Loaded ${Object.keys(dynamicReplace).length} dynamic wording patterns`);
    return dynamicReplace;
  } catch (e) {
    console.error('Error loading dynamic replacements:', e);
    return {};
  }
}

/**
 * Get merged replacements (static + dynamic)
 * Dynamic patterns take precedence over static ones
 */
async function getMergedReplacements(): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Refresh cache if stale
  if (now - lastCacheRefresh > CACHE_TTL_MS) {
    dynamicReplacementsCache = await loadDynamicReplacements();
    lastCacheRefresh = now;
  }
  
  // Merge: dynamic patterns override static ones
  return {
    ...PROMPTEK_JSON.replace,
    ...dynamicReplacementsCache,
  };
}

/**
 * Compiles master system as compact JSON string
 * Now includes dynamically discovered wording patterns
 */
export async function compileMasterSystemPromptAsync(modelName?: string): Promise<string> {
  const mergedReplace = await getMergedReplacements();
  
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    model_context: modelName ? { ...PROMPTEK_JSON.model_context, target_model: modelName } : PROMPTEK_JSON.model_context,
    role_synthesis: PROMPTEK_JSON.role_synthesis,
    structure_guidance: PROMPTEK_JSON.structure_guidance,
    pillars: PROMPTEK_JSON.pillars,
    length_policy: PROMPTEK_JSON.length_policy,
    reliability_rules: PROMPTEK_JSON.reliability_rules,
    replace: mergedReplace, // Uses dynamic + static replacements
    intensity: PROMPTEK_JSON.intensity,
    output: PROMPTEK_JSON.output,
    self_refine: PROMPTEK_JSON.self_refine
  });
}

/**
 * Compiles master system as compact JSON string (sync version for backwards compatibility)
 */
export function compileMasterSystemPrompt(modelName?: string): string {
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    model_context: modelName ? { ...PROMPTEK_JSON.model_context, target_model: modelName } : PROMPTEK_JSON.model_context,
    role_synthesis: PROMPTEK_JSON.role_synthesis,
    structure_guidance: PROMPTEK_JSON.structure_guidance,
    pillars: PROMPTEK_JSON.pillars,
    length_policy: PROMPTEK_JSON.length_policy,
    reliability_rules: PROMPTEK_JSON.reliability_rules,
    replace: PROMPTEK_JSON.replace,
    intensity: PROMPTEK_JSON.intensity,
    output: PROMPTEK_JSON.output,
    self_refine: PROMPTEK_JSON.self_refine
  });
}

/**
 * Compiles strategy-specific JSON prompt with dynamic replacements
 */
export async function compileStrategyPromptAsync(strategyKey: StrategyKey, modelName?: string): Promise<string> {
  const strat = STRATEGIES[strategyKey];
  const mergedReplace = await getMergedReplacements();
  
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    model_context: modelName ? { ...PROMPTEK_JSON.model_context, target_model: modelName } : PROMPTEK_JSON.model_context,
    role_synthesis: PROMPTEK_JSON.role_synthesis,
    structure_guidance: PROMPTEK_JSON.structure_guidance,
    pillars: PROMPTEK_JSON.pillars,
    length_policy: PROMPTEK_JSON.length_policy,
    reliability_rules: PROMPTEK_JSON.reliability_rules,
    replace: mergedReplace, // Uses dynamic + static replacements
    strategy: {
      name: strat.name,
      focus: strat.focus,
      targets: strat.targets,
      apply: strat.apply,
      fix: strat.fix
    },
    output: PROMPTEK_JSON.output,
    self_refine: PROMPTEK_JSON.self_refine
  });
}

/**
 * Compiles strategy-specific JSON prompt (sync version)
 */
export function compileStrategyPrompt(strategyKey: StrategyKey, modelName?: string): string {
  const strat = STRATEGIES[strategyKey];
  
  return JSON.stringify({
    sys: PROMPTEK_JSON.id,
    mission: PROMPTEK_JSON.mission,
    targets: PROMPTEK_JSON.targets,
    rules: PROMPTEK_JSON.rules,
    model_context: modelName ? { ...PROMPTEK_JSON.model_context, target_model: modelName } : PROMPTEK_JSON.model_context,
    role_synthesis: PROMPTEK_JSON.role_synthesis,
    structure_guidance: PROMPTEK_JSON.structure_guidance,
    pillars: PROMPTEK_JSON.pillars,
    length_policy: PROMPTEK_JSON.length_policy,
    reliability_rules: PROMPTEK_JSON.reliability_rules,
    replace: PROMPTEK_JSON.replace,
    strategy: {
      name: strat.name,
      focus: strat.focus,
      targets: strat.targets,
      apply: strat.apply,
      fix: strat.fix
    },
    output: PROMPTEK_JSON.output,
    self_refine: PROMPTEK_JSON.self_refine
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

/**
 * Build optimization strategies with dynamic replacements (async)
 */
export async function buildOptimizationStrategiesAsync(): Promise<Record<StrategyKey, {
  name: string;
  definition: string;
  systemPrompt: string;
  weight: number;
  condition?: (prompt: string) => boolean;
}>> {
  const strategies: any = {};
  
  for (const key of Object.keys(STRATEGIES) as StrategyKey[]) {
    const schema = STRATEGIES[key];
    strategies[key] = {
      name: schema.name,
      definition: schema.apply.join('. '),
      systemPrompt: await compileStrategyPromptAsync(key),
      weight: schema.w,
      ...(schema.cond && {
        condition: (prompt: string) => checkStrategyCondition(key, prompt)
      })
    };
  }
  
  return strategies;
}

/**
 * Force refresh of dynamic replacements cache
 */
export async function refreshDynamicReplacements(): Promise<number> {
  dynamicReplacementsCache = await loadDynamicReplacements();
  lastCacheRefresh = Date.now();
  return Object.keys(dynamicReplacementsCache).length;
}

/**
 * Get current dynamic replacements (for debugging)
 */
export function getCurrentDynamicReplacements(): Record<string, string> {
  return { ...dynamicReplacementsCache };
}

// Pre-compiled exports (static, for backwards compatibility)
export const COMPILED_MASTER_PROMPT = compileMasterSystemPrompt();
export const COMPILED_STRATEGIES = buildOptimizationStrategies();

export { StrategyKey };