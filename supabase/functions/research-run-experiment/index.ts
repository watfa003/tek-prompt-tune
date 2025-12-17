import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExperimentConfig {
  name: string;
  description?: string;
  experimentType: 'behavioral' | 'tokenizer' | 'cross_model' | 'full';
  testTypes?: string[]; // for behavioral: trigger_phrase, role, position, structure
  models?: string[];
  providers?: string[];
  customPrompts?: { prompt: string; domain: string; complexity: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, config } = await req.json() as { action: string; config?: ExperimentConfig };
    
    console.log(`Research experiment action: ${action}`);
    
    switch (action) {
      case 'create': {
        if (!config) throw new Error('Config required for create action');
        
        // Calculate total tests
        const testTypes = config.testTypes || ['trigger_phrase', 'role', 'position', 'structure'];
        const basePromptCount = config.customPrompts?.length || 10;
        const providerCount = config.providers?.length || 1;
        
        // Rough estimate of total tests
        let totalTests = 0;
        if (testTypes.includes('trigger_phrase')) totalTests += 15 * basePromptCount * providerCount;
        if (testTypes.includes('role')) totalTests += 10 * basePromptCount * providerCount;
        if (testTypes.includes('position')) totalTests += 5 * Math.min(basePromptCount, 5) * providerCount;
        if (testTypes.includes('structure')) totalTests += 8 * basePromptCount * providerCount;
        
        const { data: experiment, error } = await supabase
          .from('research_experiments')
          .insert({
            name: config.name,
            description: config.description,
            experiment_type: config.experimentType,
            config: {
              test_types: testTypes,
              models: config.models || ['llama-3.1-8b-instant'],
              providers: config.providers || ['groq'],
              custom_prompts: config.customPrompts,
            },
            total_tests: totalTests,
            status: 'pending',
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ 
          success: true,
          experiment,
          message: `Created experiment "${config.name}" with ~${totalTests} planned tests`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'run': {
        const { experimentId } = await req.json();
        if (!experimentId) throw new Error('experimentId required');
        
        // Get experiment config
        const { data: experiment } = await supabase
          .from('research_experiments')
          .select('*')
          .eq('id', experimentId)
          .single();
          
        if (!experiment) throw new Error('Experiment not found');
        
        const expConfig = experiment.config as any;
        const testTypes = expConfig.test_types || ['trigger_phrase'];
        
        // Run each test type sequentially
        // Note: In production, you'd want to use background jobs or queues
        const functionsUrl = `${supabaseUrl}/functions/v1`;
        
        for (const testType of testTypes) {
          console.log(`Running test type: ${testType}`);
          
          await fetch(`${functionsUrl}/research-behavioral-test`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experimentId,
              testType,
              config: {
                models: expConfig.models,
                providers: expConfig.providers,
                basePrompts: expConfig.custom_prompts,
              },
            }),
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          message: `Started running experiment ${experimentId}`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'status': {
        const { experimentId } = await req.json();
        
        const { data: experiment } = await supabase
          .from('research_experiments')
          .select('*')
          .eq('id', experimentId)
          .single();
          
        const { count: resultCount } = await supabase
          .from('research_results')
          .select('*', { count: 'exact', head: true })
          .eq('experiment_id', experimentId);
          
        return new Response(JSON.stringify({ 
          success: true,
          experiment,
          completed_tests: resultCount || 0,
          progress: experiment?.total_tests 
            ? ((resultCount || 0) / experiment.total_tests * 100).toFixed(1) + '%'
            : 'Unknown',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'list': {
        const { data: experiments } = await supabase
          .from('research_experiments')
          .select('*')
          .order('created_at', { ascending: false });
          
        return new Response(JSON.stringify({ 
          success: true,
          experiments,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'results': {
        const { experimentId, testType, limit = 100 } = await req.json();
        
        let query = supabase
          .from('research_results')
          .select('*')
          .order('score_delta', { ascending: false })
          .limit(limit);
          
        if (experimentId) query = query.eq('experiment_id', experimentId);
        if (testType) query = query.eq('test_type', testType);
        
        const { data: results } = await query;
        
        // Calculate statistics
        const stats = {
          total: results?.length || 0,
          avg_delta: 0,
          positive_count: 0,
          negative_count: 0,
          best_modification: null as any,
          worst_modification: null as any,
        };
        
        if (results?.length) {
          const deltas = results.map(r => r.score_delta || 0);
          stats.avg_delta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          stats.positive_count = deltas.filter(d => d > 0).length;
          stats.negative_count = deltas.filter(d => d < 0).length;
          stats.best_modification = results[0];
          stats.worst_modification = results[results.length - 1];
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          results,
          stats,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'analyze': {
        // Trigger pattern extraction
        const functionsUrl = `${supabaseUrl}/functions/v1`;
        
        await fetch(`${functionsUrl}/research-extract-patterns`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'extract_all' }),
        });
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Pattern extraction triggered',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'delete': {
        const { experimentId } = await req.json();
        if (!experimentId) throw new Error('experimentId required');
        
        // Results will cascade delete due to FK
        await supabase
          .from('research_experiments')
          .delete()
          .eq('id', experimentId);
          
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Experiment deleted',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Research experiment error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
