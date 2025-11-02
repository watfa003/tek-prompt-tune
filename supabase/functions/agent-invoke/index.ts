import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { 
  callLovableGateway,
  callWithRetry,
  API_TIMEOUTS,
  logAPICall
} from '../shared/api-reliability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// REMOVED: callAIProvider - now using unified callLovableGateway from api-reliability.ts

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const body = await req.json();
    const { agent_id, input, apiKey } = body;
    
    // Extract API key from Authorization header OR request body
    const authHeader = req.headers.get('Authorization');
    let finalApiKey: string;
    
    if (apiKey) {
      // Support apiKey in request body (for n8n and other clients)
      finalApiKey = apiKey;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Support Bearer token in Authorization header
      finalApiKey = authHeader.replace('Bearer ', '');
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Provide either "apiKey" in request body or "Authorization: Bearer YOUR_KEY" header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!agent_id || !input) {
      return new Response(
        JSON.stringify({ error: 'agent_id and input are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof input !== 'string' || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'input must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Validate API key and get associated agent
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, agent_id')
      .eq('key', finalApiKey)
      .single();

    if (keyError || !keyData) {
      console.error('Invalid API key:', keyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the agent_id matches the API key's agent
    if (keyData.agent_id !== agent_id) {
      return new Response(
        JSON.stringify({ error: 'Agent ID does not match API key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', keyData.user_id)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoking agent:', {
      agent_id,
      provider: agent.provider,
      model: agent.model,
      mode: agent.mode
    });

    const startTime = Date.now();

    // For optimization modes (speed/deep), call the prompt optimizer
    if (agent.mode === 'speed' || agent.mode === 'deep') {
      console.log('Calling prompt-optimizer for optimization mode');
      
      // Call the prompt-optimizer function with exact same parameters as normal optimizer
      const { data: optimizerData, error: optimizerError } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          originalPrompt: input,
          taskDescription: '', // API mode doesn't use task description
          userId: keyData.user_id,
          aiProvider: agent.provider,
          modelName: agent.model,
          outputType: agent.output_type || 'text',
          variants: agent.variants || 3,
          maxTokens: agent.max_tokens || 2048,
          temperature: agent.temperature || 0.7,
          mode: agent.mode,
          influence: '', // API mode doesn't use influence
          influenceWeight: 0 // API mode doesn't use influence
        }
      });

      if (optimizerError) {
        console.error('Optimizer error:', optimizerError);
        throw new Error(`Optimizer error: ${optimizerError.message}`);
      }

      const processingTime = Date.now() - startTime;

      // Log the optimization result
      const logData = {
        user_id: keyData.user_id,
        agent_id: agent.id,
        agent_name: agent.name,
        level: 'success',
        message: `Agent optimized prompt - ${agent.mode} mode completed in ${processingTime}ms`,
        original_prompt: input,
        optimized_prompt: optimizerData.bestOptimizedPrompt,
        metadata: {
          score: optimizerData.bestScore,
          strategy: optimizerData.summary.bestStrategy,
          variants_count: optimizerData.summary.totalVariants,
          improvement_score: optimizerData.summary.improvementScore,
          model: agent.model,
          provider: agent.provider,
          processing_time_ms: processingTime
        }
      };

      // Save log in background
      EdgeRuntime.waitUntil(
        supabase.from('agent_logs').insert(logData)
          .then(({ error }) => {
            if (error) console.error('Error saving agent log:', error);
          })
      );

      // Return the optimized prompt
      return new Response(
        JSON.stringify({
          agentId: agent_id,
          optimized_prompt: optimizerData.bestOptimizedPrompt,
          original_prompt: input,
          score: optimizerData.bestScore,
          strategy: optimizerData.summary.bestStrategy,
          variants_count: optimizerData.summary.totalVariants,
          improvement_score: optimizerData.summary.improvementScore,
          model: agent.model,
          provider: agent.provider,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For chat mode, use custom system prompt and call Lovable AI Gateway with retry logic
    const systemPrompt = agent.user_prompt || 'You are a helpful AI assistant.';
    
    const output = await callLovableGateway({
      provider: agent.provider,
      model: agent.model,
      systemPrompt,
      userPrompt: input,
      maxTokens: agent.max_tokens || 2048,
      temperature: agent.temperature || 0.7,
      context: `Agent-${agent.name}`
    });

    const processingTime = Date.now() - startTime;

    // Log the chat completion
    const logData = {
      user_id: keyData.user_id,
      agent_id: agent.id,
      agent_name: agent.name,
      level: 'success',
      message: `Agent invoked successfully - Response generated in ${(processingTime / 1000).toFixed(1)}s`,
      original_prompt: input,
      metadata: {
        tokens_used: output.length,
        model: agent.model,
        provider: agent.provider,
        processing_time_ms: processingTime,
        output_preview: output.substring(0, 200) + (output.length > 200 ? '...' : '')
      }
    };

    // Save log in background
    EdgeRuntime.waitUntil(
      supabase.from('agent_logs').insert(logData)
        .then(({ error }) => {
          if (error) console.error('Error saving agent log:', error);
        })
    );

    // Return response for chat mode
    return new Response(
      JSON.stringify({
        agentId: agent_id,
        output,
        tokens_used: output.length,
        model: agent.model,
        provider: agent.provider,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Agent invocation error:', error);
    
    // Try to log the error if we have enough context
    try {
      const body = await req.clone().json();
      const { agent_id } = body;
      
      if (agent_id && supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get agent details for logging
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name, user_id')
          .eq('id', agent_id)
          .single();
        
        if (agent) {
          EdgeRuntime.waitUntil(
            supabase.from('agent_logs').insert({
              user_id: agent.user_id,
              agent_id: agent.id,
              agent_name: agent.name,
              level: 'error',
              message: `Agent invocation failed: ${error.message}`,
              metadata: {
                error: error.toString(),
                stack: error.stack
              }
            })
          );
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
