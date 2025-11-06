import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { validateUserApiKey, extractApiKey } from '../shared/api-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const apiKey = extractApiKey(req, body);
    const { userId } = await validateUserApiKey(
      apiKey,
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { prompt_a, prompt_b, target_llm, output_type = 'text', test_task } = body;

    if (!prompt_a || !prompt_b || !target_llm) {
      throw new Error('Missing required fields: prompt_a, prompt_b, and target_llm');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call existing prompt-lab-analyze function
    const { data: battleResult, error: battleError } = await supabase.functions.invoke('prompt-lab-analyze', {
      body: {
        mode: 'compare',
        prompt_a,
        prompt_b,
        target_llm,
        output_type,
        test_task: test_task || '',
        user_id: userId
      }
    });

    if (battleError) throw battleError;

    return new Response(
      JSON.stringify({
        result_id: battleResult.result_id,
        winner: battleResult.winner,
        prompt_a,
        prompt_b,
        score_a: battleResult.score_a,
        score_b: battleResult.score_b,
        category_breakdown_a: battleResult.category_breakdown_a,
        category_breakdown_b: battleResult.category_breakdown_b,
        reasoning: battleResult.reasoning,
        target_llm
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('API lab battle error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Invalid') || error.message.includes('Missing') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
