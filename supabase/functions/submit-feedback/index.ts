import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      promptId,
      analysisId,
      feedback,
      strategy,
      provider,
      model
    } = await req.json();

    // Validate feedback value
    if (!feedback || !['positive', 'negative', 'neutral'].includes(feedback)) {
      return new Response(
        JSON.stringify({ error: 'Invalid feedback value. Must be positive, negative, or neutral.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Need either promptId or analysisId
    if (!promptId && !analysisId) {
      return new Response(
        JSON.stringify({ error: 'Either promptId or analysisId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`📝 Recording ${feedback} feedback from user ${userId}`);

    let updatedCount = 0;

    // If we have an analysisId, update that specific record
    if (analysisId) {
      const { data, error } = await supabase
        .from('prompt_analysis')
        .update({
          user_feedback: feedback,
          feedback_at: new Date().toISOString()
        })
        .eq('id', analysisId)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('Error updating prompt_analysis by analysisId:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to record feedback', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updatedCount = data?.length || 0;
    }
    // If we have a promptId, update all related analysis records
    else if (promptId) {
      const { data, error } = await supabase
        .from('prompt_analysis')
        .update({
          user_feedback: feedback,
          feedback_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('Error updating prompt_analysis by promptId:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to record feedback', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updatedCount = data?.length || 0;
    }

    // Log for future strategy performance analysis
    console.log(`✅ Recorded ${feedback} feedback for ${updatedCount} analysis record(s)`, {
      promptId,
      analysisId,
      strategy,
      provider,
      model,
      feedback,
      userId
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback recorded successfully',
        updatedRecords: updatedCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
