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
    const apiKey = extractApiKey(req);
    const { userId } = await validateUserApiKey(
      apiKey,
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const provider = url.searchParams.get('provider');
    const outputType = url.searchParams.get('output_type');
    const favoritesOnly = url.searchParams.get('favorites_only') === 'true';
    const orderBy = url.searchParams.get('order_by') || 'created_at';
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Build query
    let query = supabase
      .from('prompts')
      .select(`
        id,
        original_prompt,
        optimized_prompt,
        score,
        ai_provider,
        model_name,
        output_type,
        created_at,
        status,
        variants_generated,
        user_favorites!left(id)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (provider) query = query.eq('ai_provider', provider);
    if (outputType) query = query.eq('output_type', outputType);
    if (favoritesOnly) {
      query = query.not('user_favorites', 'is', null);
    }
    
    // Order and paginate
    query = query.order(orderBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: prompts, error, count } = await query;

    if (error) throw error;

    // Transform response
    const history = (prompts || []).map(p => ({
      id: p.id,
      prompt: p.original_prompt,
      optimized_prompt: p.optimized_prompt,
      score: p.score,
      provider: p.ai_provider,
      model: p.model_name,
      output_type: p.output_type,
      variants_generated: p.variants_generated,
      is_favorite: Array.isArray(p.user_favorites) && p.user_favorites.length > 0,
      status: p.status,
      created_at: p.created_at
    }));

    return new Response(
      JSON.stringify({
        history,
        pagination: {
          limit,
          offset,
          total: count || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('API history error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
