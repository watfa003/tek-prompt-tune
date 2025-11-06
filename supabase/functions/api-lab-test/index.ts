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

    const { prompt, target_llm, output_type = 'text', test_task } = body;

    if (!prompt || !target_llm) {
      throw new Error('Missing required fields: prompt and target_llm');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call existing prompt-lab-analyze function
    const { data: labResult, error: labError } = await supabase.functions.invoke('prompt-lab-analyze', {
      body: {
        mode: 'single',
        prompt_a: prompt,
        target_llm,
        output_type,
        test_task: test_task || '',
        user_id: userId
      },
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });

    if (labError) throw labError;

    return new Response(
      JSON.stringify({
        result_id: labResult.result_id,
        prompt,
        total_score: labResult.total_score,
        category_breakdown: labResult.category_breakdown,
        ai_output: labResult.ai_output,
        prompt_type: labResult.prompt_type,
        ai_analysis: labResult.ai_analysis,
        target_llm,
        response_latency_ms: labResult.response_latency_ms
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('API lab test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Invalid') || error.message.includes('Missing') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
