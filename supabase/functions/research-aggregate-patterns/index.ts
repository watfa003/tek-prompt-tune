import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================\\
// PATTERN AGGREGATION & STATISTICAL ANALYSIS
// All metrics are RELATIVE - based on deltas and comparisons, not absolute scores
// ============================================================================\\

interface PatternStats {
  pattern: string;
  test_type: string;
  sample_size: number;
  
  // Central tendency (of deltas)
  mean_power_score: number;
  median_power_score: number;
  
  // Variability
  std_dev: number;
  min_power: number;
  max_power: number;
  
  // Confidence (statistical)
  confidence_score: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  
  // Domain effectiveness
  domain_effectiveness: Record<string, {
    mean_power: number;
    sample_size: number;
    is_effective: boolean;
  }>;
  
  // Complexity interaction
  complexity_interaction: Record<string, {
    mean_power: number;
    sample_size: number;
  }>;
  
  // Regression analysis
  regression_rate: number;
  common_regressions: string[];
  
  // Trade-off profile
  common_gains: Record<string, number>;
  common_losses: Record<string, number>;
  
  // Behavioral fingerprint
  avg_reasoning_delta: number;
  avg_example_delta: number;
  avg_step_delta: number;
  avg_formality_shift: number;
  
  // Overall assessment
  is_recommended: boolean;
  recommendation_strength: 'strong' | 'moderate' | 'weak' | 'not_recommended';
  best_domains: string[];
  avoid_domains: string[];
}

function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  if (values.length < 2) return { mean, stdDev: 0 };
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return { mean, stdDev: Math.sqrt(variance) };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateConfidenceInterval(
  mean: number,
  stdDev: number,
  sampleSize: number,
  confidenceLevel: number = 0.95
): { low: number; high: number; confidence: number } {
  if (sampleSize < 2) {
    return { low: mean, high: mean, confidence: 0.1 };
  }
  
  // Z-score for 95% confidence
  const zScore = 1.96;
  const standardError = stdDev / Math.sqrt(sampleSize);
  const marginOfError = zScore * standardError;
  
  // Confidence score based on sample size and consistency
  const sampleConfidence = Math.min(sampleSize / 20, 1);
  const consistencyConfidence = stdDev < 1 ? 1 : Math.max(0.2, 1 - (stdDev - 1) / 5);
  const confidence = sampleConfidence * 0.5 + consistencyConfidence * 0.5;
  
  return {
    low: mean - marginOfError,
    high: mean + marginOfError,
    confidence,
  };
}

function countOccurrences<T>(items: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = String(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

async function aggregatePatternStats(
  supabase: any,
  experimentId?: string
): Promise<PatternStats[]> {
  // Fetch results
  let query = supabase.from('research_results').select('*');
  
  if (experimentId) {
    query = query.eq('experiment_id', experimentId);
  }
  
  query = query.neq('test_type', 'baseline');
  
  const { data: results, error } = await query;
  
  if (error) throw error;
  if (!results?.length) return [];
  
  // Group by modification
  const groups: Record<string, any[]> = {};
  
  for (const result of results) {
    const key = result.modification_applied;
    if (!groups[key]) groups[key] = [];
    groups[key].push(result);
  }
  
  const stats: PatternStats[] = [];
  
  for (const [pattern, group] of Object.entries(groups)) {
    // Extract power scores
    const powerScores = group
      .map(r => r.metadata?.power_score || r.metadata?.delta?.power_score)
      .filter(s => s !== undefined && s !== null) as number[];
    
    if (powerScores.length === 0) continue;
    
    const { mean, stdDev } = calculateStdDev(powerScores);
    const median = calculateMedian(powerScores);
    const ci = calculateConfidenceInterval(mean, stdDev, powerScores.length);
    
    // Domain effectiveness
    const domainGroups: Record<string, number[]> = {};
    for (const r of group) {
      const domain = r.metadata?.domain || 'unknown';
      const ps = r.metadata?.power_score || r.metadata?.delta?.power_score;
      if (ps !== undefined) {
        if (!domainGroups[domain]) domainGroups[domain] = [];
        domainGroups[domain].push(ps);
      }
    }
    
    const domainEffectiveness: Record<string, any> = {};
    const effectiveDomains: string[] = [];
    const ineffectiveDomains: string[] = [];
    
    for (const [domain, scores] of Object.entries(domainGroups)) {
      const { mean: domainMean } = calculateStdDev(scores);
      const isEffective = domainMean > 0.3 && scores.length >= 2;
      
      domainEffectiveness[domain] = {
        mean_power: domainMean,
        sample_size: scores.length,
        is_effective: isEffective,
      };
      
      if (isEffective) effectiveDomains.push(domain);
      else if (domainMean < 0) ineffectiveDomains.push(domain);
    }
    
    // Complexity interaction
    const complexityGroups: Record<string, number[]> = {};
    for (const r of group) {
      const complexity = r.metadata?.complexity || 'unknown';
      const ps = r.metadata?.power_score || r.metadata?.delta?.power_score;
      if (ps !== undefined) {
        if (!complexityGroups[complexity]) complexityGroups[complexity] = [];
        complexityGroups[complexity].push(ps);
      }
    }
    
    const complexityInteraction: Record<string, any> = {};
    for (const [complexity, scores] of Object.entries(complexityGroups)) {
      const { mean: compMean } = calculateStdDev(scores);
      complexityInteraction[complexity] = {
        mean_power: compMean,
        sample_size: scores.length,
      };
    }
    
    // Regression analysis
    const regressions = group.filter(r => r.metadata?.is_regression || r.metadata?.delta?.is_regression);
    const regressionRate = group.length > 0 ? regressions.length / group.length : 0;
    
    const allRegressionCategories: string[] = [];
    for (const r of regressions) {
      const cats = r.metadata?.regression_categories || r.metadata?.delta?.regression_categories || [];
      allRegressionCategories.push(...cats);
    }
    const commonRegressions = Object.entries(countOccurrences(allRegressionCategories))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
    
    // Trade-off analysis
    const allGains: string[] = [];
    const allLosses: string[] = [];
    
    for (const r of group) {
      const tradeoffs = r.metadata?.tradeoffs || r.metadata?.delta?.tradeoffs;
      if (tradeoffs) {
        allGains.push(...(tradeoffs.gained || []));
        allLosses.push(...(tradeoffs.lost || []));
      }
    }
    
    const commonGains = countOccurrences(allGains);
    const commonLosses = countOccurrences(allLosses);
    
    // Normalize counts to rates
    for (const key of Object.keys(commonGains)) {
      commonGains[key] = commonGains[key] / group.length;
    }
    for (const key of Object.keys(commonLosses)) {
      commonLosses[key] = commonLosses[key] / group.length;
    }
    
    // Behavioral deltas
    const reasoningDeltas = group
      .map(r => r.metadata?.delta?.reasoning_delta)
      .filter(d => d !== undefined) as number[];
    const exampleDeltas = group
      .map(r => r.metadata?.delta?.example_delta)
      .filter(d => d !== undefined) as number[];
    const stepDeltas = group
      .map(r => r.metadata?.delta?.step_delta)
      .filter(d => d !== undefined) as number[];
    const formalityShifts = group
      .map(r => r.metadata?.delta?.formality_shift)
      .filter(d => d !== undefined) as number[];
    
    const avgReasoningDelta = reasoningDeltas.length > 0
      ? reasoningDeltas.reduce((a, b) => a + b, 0) / reasoningDeltas.length
      : 0;
    const avgExampleDelta = exampleDeltas.length > 0
      ? exampleDeltas.reduce((a, b) => a + b, 0) / exampleDeltas.length
      : 0;
    const avgStepDelta = stepDeltas.length > 0
      ? stepDeltas.reduce((a, b) => a + b, 0) / stepDeltas.length
      : 0;
    const avgFormalityShift = formalityShifts.length > 0
      ? formalityShifts.reduce((a, b) => a + b, 0) / formalityShifts.length
      : 0;
    
    // Recommendation assessment
    const isRecommended = mean > 0.3 && ci.confidence > 0.5 && regressionRate < 0.3;
    
    let recommendationStrength: 'strong' | 'moderate' | 'weak' | 'not_recommended';
    if (!isRecommended) {
      recommendationStrength = 'not_recommended';
    } else if (mean > 1.0 && ci.confidence > 0.7 && regressionRate < 0.1) {
      recommendationStrength = 'strong';
    } else if (mean > 0.5 && ci.confidence > 0.5 && regressionRate < 0.2) {
      recommendationStrength = 'moderate';
    } else {
      recommendationStrength = 'weak';
    }
    
    stats.push({
      pattern,
      test_type: group[0].test_type,
      sample_size: group.length,
      
      mean_power_score: mean,
      median_power_score: median,
      
      std_dev: stdDev,
      min_power: Math.min(...powerScores),
      max_power: Math.max(...powerScores),
      
      confidence_score: ci.confidence,
      confidence_interval_low: ci.low,
      confidence_interval_high: ci.high,
      
      domain_effectiveness: domainEffectiveness,
      complexity_interaction: complexityInteraction,
      
      regression_rate: regressionRate,
      common_regressions: commonRegressions,
      
      common_gains: commonGains,
      common_losses: commonLosses,
      
      avg_reasoning_delta: avgReasoningDelta,
      avg_example_delta: avgExampleDelta,
      avg_step_delta: avgStepDelta,
      avg_formality_shift: avgFormalityShift,
      
      is_recommended: isRecommended,
      recommendation_strength: recommendationStrength,
      best_domains: effectiveDomains,
      avoid_domains: ineffectiveDomains,
    });
  }
  
  // Sort by mean power score
  stats.sort((a, b) => b.mean_power_score - a.mean_power_score);
  
  return stats;
}

async function saveToExtractedPatterns(
  supabase: any,
  stats: PatternStats[]
): Promise<number> {
  let saved = 0;
  
  for (const stat of stats) {
    // Only save patterns that meet minimum criteria
    if (stat.sample_size < 3) continue;
    if (stat.confidence_score < 0.3) continue;
    
    // Determine pattern type
    let patternType: string;
    if (stat.mean_power_score > 0.8 && stat.regression_rate < 0.1) {
      patternType = 'amplifier';
    } else if (stat.mean_power_score < -0.3) {
      patternType = 'inhibitor';
    } else if (stat.test_type === 'role') {
      patternType = 'role';
    } else if (stat.test_type === 'structure') {
      patternType = 'structure';
    } else if (stat.test_type === 'cot') {
      patternType = 'cot';
    } else if (stat.test_type === 'constraint') {
      patternType = 'constraint';
    } else {
      patternType = 'trigger';
    }
    
    const { error } = await supabase.from('extracted_patterns').upsert({
      pattern_type: patternType,
      pattern_value: stat.pattern,
      effectiveness_score: stat.mean_power_score,
      sample_size: stat.sample_size,
      confidence: stat.confidence_score,
      applicable_domains: stat.best_domains,
      applicable_models: [], // To be filled by cross-model testing
      metadata: {
        test_type: stat.test_type,
        std_dev: stat.std_dev,
        median_power: stat.median_power_score,
        confidence_interval: {
          low: stat.confidence_interval_low,
          high: stat.confidence_interval_high,
        },
        regression_rate: stat.regression_rate,
        common_regressions: stat.common_regressions,
        common_gains: stat.common_gains,
        common_losses: stat.common_losses,
        behavioral_profile: {
          avg_reasoning_delta: stat.avg_reasoning_delta,
          avg_example_delta: stat.avg_example_delta,
          avg_step_delta: stat.avg_step_delta,
          avg_formality_shift: stat.avg_formality_shift,
        },
        domain_effectiveness: stat.domain_effectiveness,
        complexity_interaction: stat.complexity_interaction,
        recommendation_strength: stat.recommendation_strength,
        avoid_domains: stat.avoid_domains,
      },
      last_validated: new Date().toISOString(),
      is_active: stat.is_recommended,
    }, {
      onConflict: 'pattern_type,pattern_value',
    });
    
    if (!error) {
      saved++;
      console.log(`Saved pattern: ${stat.pattern} (${patternType}, power: ${stat.mean_power_score.toFixed(2)}, confidence: ${stat.confidence_score.toFixed(2)})`);
    }
  }
  
  return saved;
}

async function generateOptimizableRules(
  supabase: any
): Promise<any> {
  // Fetch active, confident patterns
  const { data: patterns, error } = await supabase
    .from('extracted_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.5)
    .gte('sample_size', 3)
    .order('effectiveness_score', { ascending: false });
  
  if (error) throw error;
  if (!patterns?.length) return { rules: [], message: 'No qualifying patterns found' };
  
  // Group by pattern type
  const byType: Record<string, any[]> = {};
  for (const p of patterns) {
    if (!byType[p.pattern_type]) byType[p.pattern_type] = [];
    byType[p.pattern_type].push(p);
  }
  
  // Generate rules for optimizer
  const rules = {
    // Top amplifiers to inject
    power_amplifiers: (byType['amplifier'] || [])
      .filter(p => p.effectiveness_score > 0.5)
      .slice(0, 5)
      .map(p => ({
        phrase: p.pattern_value,
        power_score: p.effectiveness_score,
        confidence: p.confidence,
        best_for: p.applicable_domains || [],
        avoid_for: p.metadata?.avoid_domains || [],
        behavioral_boost: {
          reasoning: p.metadata?.behavioral_profile?.avg_reasoning_delta || 0,
          examples: p.metadata?.behavioral_profile?.avg_example_delta || 0,
          steps: p.metadata?.behavioral_profile?.avg_step_delta || 0,
        },
      })),
    
    // Triggers by category
    triggers_by_domain: {} as Record<string, any[]>,
    
    // Patterns to avoid
    inhibitors: (byType['inhibitor'] || [])
      .map(p => ({
        phrase: p.pattern_value,
        negative_impact: Math.abs(p.effectiveness_score),
        avoid_in: p.applicable_domains || [],
      })),
    
    // Best roles
    effective_roles: (byType['role'] || [])
      .filter(p => p.effectiveness_score > 0)
      .slice(0, 5)
      .map(p => ({
        role: p.pattern_value,
        effectiveness: p.effectiveness_score,
        best_domains: p.applicable_domains || [],
      })),
    
    // Structure recommendations
    structure_rules: (byType['structure'] || [])
      .filter(p => p.effectiveness_score > 0)
      .map(p => ({
        structure: p.pattern_value,
        effectiveness: p.effectiveness_score,
        use_when: p.applicable_domains || [],
      })),
    
    // CoT patterns
    cot_patterns: (byType['cot'] || [])
      .filter(p => p.effectiveness_score > 0)
      .map(p => ({
        pattern: p.pattern_value,
        reasoning_boost: p.metadata?.behavioral_profile?.avg_reasoning_delta || 0,
        step_boost: p.metadata?.behavioral_profile?.avg_step_delta || 0,
        best_for: p.applicable_domains || [],
      })),
    
    // Meta statistics
    total_patterns: patterns.length,
    avg_confidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
    generated_at: new Date().toISOString(),
  };
  
  // Build domain-specific trigger recommendations
  const allTriggers = [...(byType['amplifier'] || []), ...(byType['trigger'] || [])];
  for (const trigger of allTriggers) {
    for (const domain of (trigger.applicable_domains || [])) {
      if (!rules.triggers_by_domain[domain]) {
        rules.triggers_by_domain[domain] = [];
      }
      rules.triggers_by_domain[domain].push({
        phrase: trigger.pattern_value,
        effectiveness: trigger.effectiveness_score,
        confidence: trigger.confidence,
      });
    }
  }
  
  // Sort triggers within each domain
  for (const domain of Object.keys(rules.triggers_by_domain)) {
    rules.triggers_by_domain[domain].sort(
      (a, b) => b.effectiveness - a.effectiveness
    );
    // Keep top 3 per domain
    rules.triggers_by_domain[domain] = rules.triggers_by_domain[domain].slice(0, 3);
  }
  
  return rules;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, experiment_id } = await req.json();
    
    console.log(`Pattern aggregation action: ${action}`);
    
    switch (action) {
      case 'aggregate':
        // Aggregate stats from results
        const stats = await aggregatePatternStats(supabase, experiment_id);
        
        return new Response(JSON.stringify({ 
          success: true,
          patterns_analyzed: stats.length,
          stats: stats.slice(0, 20), // Return top 20
          summary: {
            total: stats.length,
            recommended: stats.filter(s => s.is_recommended).length,
            strong: stats.filter(s => s.recommendation_strength === 'strong').length,
            moderate: stats.filter(s => s.recommendation_strength === 'moderate').length,
            not_recommended: stats.filter(s => !s.is_recommended).length,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'extract':
        // Aggregate and save to extracted_patterns
        const allStats = await aggregatePatternStats(supabase, experiment_id);
        const savedCount = await saveToExtractedPatterns(supabase, allStats);
        
        return new Response(JSON.stringify({ 
          success: true,
          patterns_analyzed: allStats.length,
          patterns_saved: savedCount,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'generate_rules':
        // Generate optimizer-ready rules
        const rules = await generateOptimizableRules(supabase);
        
        return new Response(JSON.stringify({ 
          success: true,
          rules,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'get_top_patterns':
        // Quick access to top performing patterns
        const { data: topPatterns } = await supabase
          .from('extracted_patterns')
          .select('*')
          .eq('is_active', true)
          .gte('confidence', 0.5)
          .order('effectiveness_score', { ascending: false })
          .limit(10);
        
        return new Response(JSON.stringify({ 
          success: true,
          patterns: topPatterns || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'get_domain_patterns':
        // Get patterns for a specific domain
        const { domain } = await req.json();
        
        const { data: domainPatterns } = await supabase
          .from('extracted_patterns')
          .select('*')
          .eq('is_active', true)
          .contains('applicable_domains', [domain])
          .order('effectiveness_score', { ascending: false });
        
        return new Response(JSON.stringify({ 
          success: true,
          domain,
          patterns: domainPatterns || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Pattern aggregation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
