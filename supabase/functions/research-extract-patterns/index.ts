import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternAnalysis {
  pattern: string;
  avgDelta: number;
  sampleSize: number;
  stdDev: number;
  minDelta: number;
  maxDelta: number;
  effectiveDomains: string[];
  effectiveModels: string[];
  categoryImpact: Record<string, number>;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function calculateConfidence(sampleSize: number, stdDev: number, meanDelta: number): number {
  // Simple confidence calculation based on sample size and consistency
  const sampleConfidence = Math.min(sampleSize / 20, 1); // Max confidence at 20+ samples
  const consistencyConfidence = stdDev < 0.5 ? 1 : Math.max(0, 1 - (stdDev - 0.5) / 2);
  const effectivenessConfidence = meanDelta > 0 ? Math.min(meanDelta / 2, 1) : 0;
  
  return (sampleConfidence * 0.3 + consistencyConfidence * 0.4 + effectivenessConfidence * 0.3);
}

async function analyzePatterns(
  results: any[],
  patternType: string
): Promise<PatternAnalysis[]> {
  // Group results by modification applied
  const patternGroups: Record<string, any[]> = {};
  
  for (const result of results) {
    const key = result.modification_applied;
    if (!patternGroups[key]) {
      patternGroups[key] = [];
    }
    patternGroups[key].push(result);
  }
  
  const analyses: PatternAnalysis[] = [];
  
  for (const [pattern, group] of Object.entries(patternGroups)) {
    const deltas = group.map(r => r.score_delta || 0);
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const stdDev = calculateStdDev(deltas, avgDelta);
    
    // Find which domains this pattern works best for
    const domainDeltas: Record<string, number[]> = {};
    const modelDeltas: Record<string, number[]> = {};
    const categoryImpacts: Record<string, number[]> = {};
    
    for (const result of group) {
      const domain = result.metadata?.prompt_domain || 'unknown';
      const model = result.model_used;
      
      if (!domainDeltas[domain]) domainDeltas[domain] = [];
      domainDeltas[domain].push(result.score_delta || 0);
      
      if (!modelDeltas[model]) modelDeltas[model] = [];
      modelDeltas[model].push(result.score_delta || 0);
      
      // Track per-category impact
      if (result.category_scores && result.metadata?.base_category_scores) {
        const base = result.metadata.base_category_scores;
        const modified = result.category_scores;
        for (const cat of Object.keys(modified)) {
          if (base[cat] !== undefined && modified[cat] !== undefined) {
            if (!categoryImpacts[cat]) categoryImpacts[cat] = [];
            categoryImpacts[cat].push(modified[cat] - base[cat]);
          }
        }
      }
    }
    
    // Find domains with positive average delta
    const effectiveDomains = Object.entries(domainDeltas)
      .filter(([_, deltas]) => deltas.reduce((a, b) => a + b, 0) / deltas.length > 0.1)
      .map(([domain]) => domain);
      
    const effectiveModels = Object.entries(modelDeltas)
      .filter(([_, deltas]) => deltas.reduce((a, b) => a + b, 0) / deltas.length > 0.1)
      .map(([model]) => model);
    
    // Average category impacts
    const categoryImpact: Record<string, number> = {};
    for (const [cat, impacts] of Object.entries(categoryImpacts)) {
      categoryImpact[cat] = impacts.reduce((a, b) => a + b, 0) / impacts.length;
    }
    
    analyses.push({
      pattern,
      avgDelta,
      sampleSize: group.length,
      stdDev,
      minDelta: Math.min(...deltas),
      maxDelta: Math.max(...deltas),
      effectiveDomains,
      effectiveModels,
      categoryImpact,
    });
  }
  
  // Sort by effectiveness (avgDelta) descending
  analyses.sort((a, b) => b.avgDelta - a.avgDelta);
  
  return analyses;
}

async function extractTriggerPatterns(supabase: any): Promise<void> {
  const { data: results } = await supabase
    .from('research_results')
    .select('*')
    .eq('test_type', 'trigger_phrase');
    
  if (!results?.length) {
    console.log('No trigger phrase results to analyze');
    return;
  }
  
  const analyses = await analyzePatterns(results, 'trigger');
  
  for (const analysis of analyses) {
    if (analysis.avgDelta > 0 && analysis.sampleSize >= 3) {
      const confidence = calculateConfidence(analysis.sampleSize, analysis.stdDev, analysis.avgDelta);
      
      await supabase.from('extracted_patterns').upsert({
        pattern_type: analysis.avgDelta > 0.5 ? 'amplifier' : 'trigger',
        pattern_value: analysis.pattern,
        effectiveness_score: analysis.avgDelta,
        sample_size: analysis.sampleSize,
        confidence,
        applicable_domains: analysis.effectiveDomains,
        applicable_models: analysis.effectiveModels,
        metadata: {
          std_dev: analysis.stdDev,
          min_delta: analysis.minDelta,
          max_delta: analysis.maxDelta,
          category_impact: analysis.categoryImpact,
          source: 'trigger_phrase_test',
        },
        last_validated: new Date().toISOString(),
        is_active: confidence > 0.5,
      }, {
        onConflict: 'pattern_type,pattern_value',
      });
      
      console.log(`Extracted trigger pattern: "${analysis.pattern}" (delta: ${analysis.avgDelta.toFixed(2)}, confidence: ${confidence.toFixed(2)})`);
    } else if (analysis.avgDelta < -0.2) {
      // This is an inhibitor pattern
      const confidence = calculateConfidence(analysis.sampleSize, analysis.stdDev, Math.abs(analysis.avgDelta));
      
      await supabase.from('extracted_patterns').upsert({
        pattern_type: 'inhibitor',
        pattern_value: analysis.pattern,
        effectiveness_score: analysis.avgDelta,
        sample_size: analysis.sampleSize,
        confidence,
        applicable_domains: analysis.effectiveDomains,
        applicable_models: analysis.effectiveModels,
        metadata: {
          std_dev: analysis.stdDev,
          category_impact: analysis.categoryImpact,
          source: 'trigger_phrase_test',
          warning: 'This pattern decreases output quality',
        },
        last_validated: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'pattern_type,pattern_value',
      });
      
      console.log(`Extracted inhibitor pattern: "${analysis.pattern}" (delta: ${analysis.avgDelta.toFixed(2)})`);
    }
  }
}

async function extractRolePatterns(supabase: any): Promise<void> {
  const { data: results } = await supabase
    .from('research_results')
    .select('*')
    .eq('test_type', 'role');
    
  if (!results?.length) {
    console.log('No role test results to analyze');
    return;
  }
  
  const analyses = await analyzePatterns(results, 'role');
  
  for (const analysis of analyses) {
    if (analysis.avgDelta > 0 && analysis.sampleSize >= 3) {
      const confidence = calculateConfidence(analysis.sampleSize, analysis.stdDev, analysis.avgDelta);
      
      await supabase.from('extracted_patterns').upsert({
        pattern_type: 'role',
        pattern_value: analysis.pattern,
        effectiveness_score: analysis.avgDelta,
        sample_size: analysis.sampleSize,
        confidence,
        applicable_domains: analysis.effectiveDomains,
        applicable_models: analysis.effectiveModels,
        metadata: {
          std_dev: analysis.stdDev,
          category_impact: analysis.categoryImpact,
          source: 'role_test',
        },
        last_validated: new Date().toISOString(),
        is_active: confidence > 0.5,
      }, {
        onConflict: 'pattern_type,pattern_value',
      });
      
      console.log(`Extracted role pattern: "${analysis.pattern}" (delta: ${analysis.avgDelta.toFixed(2)})`);
    }
  }
}

async function extractPositionPatterns(supabase: any): Promise<void> {
  const { data: results } = await supabase
    .from('research_results')
    .select('*')
    .eq('test_type', 'position');
    
  if (!results?.length) {
    console.log('No position test results to analyze');
    return;
  }
  
  // Group by position
  const positionScores: Record<string, number[]> = {};
  
  for (const result of results) {
    const position = result.metadata?.position || 'unknown';
    if (!positionScores[position]) positionScores[position] = [];
    positionScores[position].push(result.score_delta || 0);
  }
  
  // Find best positions
  const positionRanking = Object.entries(positionScores)
    .map(([position, deltas]) => ({
      position,
      avgDelta: deltas.reduce((a, b) => a + b, 0) / deltas.length,
      sampleSize: deltas.length,
    }))
    .sort((a, b) => b.avgDelta - a.avgDelta);
  
  // Store the optimal position as a structure pattern
  if (positionRanking.length > 0) {
    const best = positionRanking[0];
    
    await supabase.from('extracted_patterns').upsert({
      pattern_type: 'structure',
      pattern_value: `instruction_position:${best.position}`,
      effectiveness_score: best.avgDelta,
      sample_size: best.sampleSize,
      confidence: 0.8,
      applicable_domains: [],
      applicable_models: [],
      metadata: {
        all_positions: positionRanking,
        source: 'position_test',
        recommendation: `Place critical instructions at ${best.position} for best results`,
      },
      last_validated: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'pattern_type,pattern_value',
    });
    
    console.log(`Best instruction position: ${best.position} (delta: ${best.avgDelta.toFixed(2)})`);
  }
}

async function extractStructurePatterns(supabase: any): Promise<void> {
  const { data: results } = await supabase
    .from('research_results')
    .select('*')
    .eq('test_type', 'structure');
    
  if (!results?.length) {
    console.log('No structure test results to analyze');
    return;
  }
  
  const analyses = await analyzePatterns(results, 'structure');
  
  for (const analysis of analyses) {
    if (analysis.sampleSize >= 3) {
      const confidence = calculateConfidence(analysis.sampleSize, analysis.stdDev, Math.abs(analysis.avgDelta));
      
      await supabase.from('extracted_patterns').upsert({
        pattern_type: 'structure',
        pattern_value: analysis.pattern,
        effectiveness_score: analysis.avgDelta,
        sample_size: analysis.sampleSize,
        confidence,
        applicable_domains: analysis.effectiveDomains,
        applicable_models: analysis.effectiveModels,
        metadata: {
          std_dev: analysis.stdDev,
          category_impact: analysis.categoryImpact,
          source: 'structure_test',
        },
        last_validated: new Date().toISOString(),
        is_active: analysis.avgDelta > 0 && confidence > 0.5,
      }, {
        onConflict: 'pattern_type,pattern_value',
      });
      
      console.log(`Extracted structure pattern: "${analysis.pattern}" (delta: ${analysis.avgDelta.toFixed(2)})`);
    }
  }
}

async function generatePatternSummary(supabase: any): Promise<any> {
  const { data: patterns } = await supabase
    .from('extracted_patterns')
    .select('*')
    .eq('is_active', true)
    .order('effectiveness_score', { ascending: false });
    
  if (!patterns?.length) {
    return { message: 'No active patterns found' };
  }
  
  // Group by type
  const byType: Record<string, any[]> = {};
  for (const p of patterns) {
    if (!byType[p.pattern_type]) byType[p.pattern_type] = [];
    byType[p.pattern_type].push(p);
  }
  
  // Generate summary
  const summary = {
    total_patterns: patterns.length,
    by_type: Object.entries(byType).map(([type, ps]) => ({
      type,
      count: ps.length,
      top_patterns: ps.slice(0, 5).map(p => ({
        pattern: p.pattern_value,
        effectiveness: p.effectiveness_score,
        confidence: p.confidence,
      })),
    })),
    top_amplifiers: patterns
      .filter(p => p.pattern_type === 'amplifier')
      .slice(0, 10)
      .map(p => ({ pattern: p.pattern_value, delta: p.effectiveness_score })),
    inhibitors_to_avoid: patterns
      .filter(p => p.pattern_type === 'inhibitor')
      .map(p => ({ pattern: p.pattern_value, delta: p.effectiveness_score })),
    best_roles: patterns
      .filter(p => p.pattern_type === 'role')
      .slice(0, 5)
      .map(p => ({ role: p.pattern_value, delta: p.effectiveness_score })),
  };
  
  return summary;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    
    console.log(`Pattern extraction action: ${action}`);
    
    switch (action) {
      case 'extract_all':
        await extractTriggerPatterns(supabase);
        await extractRolePatterns(supabase);
        await extractPositionPatterns(supabase);
        await extractStructurePatterns(supabase);
        const summary = await generatePatternSummary(supabase);
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Pattern extraction complete',
          summary,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'extract_triggers':
        await extractTriggerPatterns(supabase);
        break;
        
      case 'extract_roles':
        await extractRolePatterns(supabase);
        break;
        
      case 'extract_positions':
        await extractPositionPatterns(supabase);
        break;
        
      case 'extract_structures':
        await extractStructurePatterns(supabase);
        break;
        
      case 'get_summary':
        const summaryData = await generatePatternSummary(supabase);
        return new Response(JSON.stringify({ 
          success: true,
          summary: summaryData,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'export_for_optimizer':
        // Export patterns in format usable by optimizer
        const { data: activePatterns } = await supabase
          .from('extracted_patterns')
          .select('*')
          .eq('is_active', true)
          .gte('confidence', 0.6);
          
        const optimizerConfig = {
          trigger_phrases: activePatterns
            ?.filter(p => p.pattern_type === 'trigger' || p.pattern_type === 'amplifier')
            .map(p => ({
              phrase: p.pattern_value,
              effectiveness: p.effectiveness_score,
              domains: p.applicable_domains,
            })) || [],
          inhibitor_phrases: activePatterns
            ?.filter(p => p.pattern_type === 'inhibitor')
            .map(p => p.pattern_value) || [],
          role_patterns: activePatterns
            ?.filter(p => p.pattern_type === 'role')
            .map(p => ({
              pattern: p.pattern_value,
              effectiveness: p.effectiveness_score,
              domains: p.applicable_domains,
            })) || [],
          structure_recommendations: activePatterns
            ?.filter(p => p.pattern_type === 'structure')
            .map(p => ({
              pattern: p.pattern_value,
              effectiveness: p.effectiveness_score,
              domains: p.applicable_domains,
            })) || [],
        };
        
        return new Response(JSON.stringify({ 
          success: true,
          optimizer_config: optimizerConfig,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pattern extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
