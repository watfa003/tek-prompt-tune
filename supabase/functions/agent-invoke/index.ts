import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

// Call AI provider
async function callAIProvider(
  provider: string,
  model: string,
  systemPrompt: string,
  userInput: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  console.log(`Calling ${provider} with model ${model}`);
  
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userInput }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('OpenAI API error:', error);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }

      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey!,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userInput }
            ],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Anthropic API error:', error);
          throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
      }

      case 'google': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nUser: ${userInput}`
                }]
              }],
              generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: temperature,
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('Google API error:', error);
          throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }

      case 'groq': {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userInput }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Groq API error:', error);
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }

      case 'mistral': {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userInput }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Mistral API error:', error);
          throw new Error(`Mistral API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Get request body
    const { agent_id, input } = await req.json();
    
    if (!agent_id || !input) {
      return new Response(
        JSON.stringify({ error: 'agent_id and input are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Validate API key and get associated agent
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, agent_id')
      .eq('key', apiKey)
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

    // Call AI provider with agent configuration
    const output = await callAIProvider(
      agent.provider,
      agent.model,
      agent.user_prompt || 'You are a helpful AI assistant.',
      input,
      agent.max_tokens || 2048,
      agent.temperature || 0.7
    );

    const processingTime = Date.now() - startTime;

    // Return response
    return new Response(
      JSON.stringify({
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
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
