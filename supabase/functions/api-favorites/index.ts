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
    const itemType = url.searchParams.get('item_type');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let query = supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data: favorites, error } = await query;
    if (error) throw error;

    // Fetch full item details
    const enrichedFavorites = await Promise.all(
      (favorites || []).map(async (fav) => {
        if (fav.item_type === 'prompt') {
          const { data: prompt } = await supabase
            .from('prompts')
            .select('*')
            .eq('id', fav.item_id)
            .single();
          return { ...fav, item_details: prompt };
        } else if (fav.item_type === 'template') {
          const { data: template } = await supabase
            .from('prompt_templates')
            .select('*')
            .eq('id', fav.item_id)
            .single();
          return { ...fav, item_details: template };
        }
        return fav;
      })
    );

    return new Response(
      JSON.stringify({ favorites: enrichedFavorites }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('API favorites error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
