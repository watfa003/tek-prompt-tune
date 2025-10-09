import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body for preview mode
    const body = await req.json().catch(() => ({}));
    const isPreview = body.preview === true;

    // Get user's data retention settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('data_retention_days')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Failed to fetch user settings');
    }

    const retentionDays = settings?.data_retention_days || 30;

    // If retention is -1, it means "forever" - don't delete anything
    if (retentionDays === -1) {
      return new Response(
        JSON.stringify({ 
          message: 'Data retention set to forever, no cleanup needed',
          retentionDays: -1,
          cutoffDate: null,
          willDelete: { prompts: 0, optimizations: 0, speedOptimizations: 0, chatSessions: 0, chatMessages: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString();

    console.log(`${isPreview ? 'Preview' : 'Cleanup'} for user ${user.id}: retention=${retentionDays} days, cutoff=${cutoffDateStr}`);

    // Count records that will be deleted
    const { count: promptsCount } = await supabaseClient
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    const { count: optimizationsCount } = await supabaseClient
      .from('optimization_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    const { count: speedOptCount } = await supabaseClient
      .from('speed_optimizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    const { data: oldSessions } = await supabaseClient
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    let chatMessagesCount = 0;
    if (oldSessions && oldSessions.length > 0) {
      const sessionIds = oldSessions.map(s => s.id);
      const { count } = await supabaseClient
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds);
      chatMessagesCount = count || 0;
    }

    const sessionsCount = oldSessions?.length || 0;

    console.log(`Found: ${promptsCount} prompts, ${optimizationsCount} optimizations, ${speedOptCount} speed opts, ${sessionsCount} sessions, ${chatMessagesCount} messages`);

    // If preview mode, return counts without deleting
    if (isPreview) {
      return new Response(
        JSON.stringify({
          message: `Preview: ${promptsCount + optimizationsCount + speedOptCount + sessionsCount + chatMessagesCount} records will be deleted`,
          preview: true,
          retentionDays,
          cutoffDate: cutoffDateStr,
          willDelete: {
            prompts: promptsCount || 0,
            optimizations: optimizationsCount || 0,
            speedOptimizations: speedOptCount || 0,
            chatSessions: sessionsCount,
            chatMessages: chatMessagesCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actually delete the data
    const { error: promptsError } = await supabaseClient
      .from('prompts')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    if (promptsError) {
      console.error('Error deleting prompts:', promptsError);
    }

    const { error: optimizationsError } = await supabaseClient
      .from('optimization_history')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    if (optimizationsError) {
      console.error('Error deleting optimization_history:', optimizationsError);
    }

    const { error: speedOptError } = await supabaseClient
      .from('speed_optimizations')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    if (speedOptError) {
      console.error('Error deleting speed_optimizations:', speedOptError);
    }

    // Delete chat messages first (foreign key constraint)
    if (oldSessions && oldSessions.length > 0) {
      const sessionIds = oldSessions.map(s => s.id);
      const { error: messagesError } = await supabaseClient
        .from('chat_messages')
        .delete()
        .in('session_id', sessionIds);

      if (messagesError) {
        console.error('Error deleting chat_messages:', messagesError);
      }
    }

    // Delete old chat_sessions
    const { error: sessionsError } = await supabaseClient
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDateStr);

    if (sessionsError) {
      console.error('Error deleting chat_sessions:', sessionsError);
    }

    console.log(`Cleanup complete: deleted ${promptsCount} prompts, ${optimizationsCount} optimizations, ${speedOptCount} speed opts, ${sessionsCount} sessions, ${chatMessagesCount} messages`);

    return new Response(
      JSON.stringify({
        message: `Successfully cleaned up data older than ${retentionDays} days`,
        retentionDays,
        cutoffDate: cutoffDateStr,
        deleted: {
          prompts: promptsCount || 0,
          optimizations: optimizationsCount || 0,
          speedOptimizations: speedOptCount || 0,
          chatSessions: sessionsCount,
          chatMessages: chatMessagesCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-old-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
