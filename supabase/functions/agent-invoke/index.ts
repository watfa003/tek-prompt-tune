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
  
  // Validate API keys before attempting to call
  const apiKeyMap: Record<string, string | undefined> = {
    'openai': openAIApiKey,
    'anthropic': anthropicApiKey,
    'google': googleApiKey,
    'groq': groqApiKey,
    'mistral': mistralApiKey
  };

  const requiredApiKey = apiKeyMap[provider];
  if (!requiredApiKey) {
    throw new Error(`API key for ${provider} is not configured. Please add the ${provider.toUpperCase()}_API_KEY secret in Supabase.`);
  }
  
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

    // Determine system prompt based on agent mode
    let systemPrompt: string;
    if (agent.mode === 'speed' || agent.mode === 'deep') {
      // Use prompt optimization system prompt for optimization modes
      systemPrompt = `You are PrompTek AI Agent, an expert in prompt engineering and optimization. You help users:

1. **Generate optimized prompts** for various AI models and use cases
2. **Analyze and score prompts** based on clarity, specificity, and effectiveness
3. **Suggest improvements** to existing prompts
4. **Provide prompt engineering best practices**
5. **Create variants** of prompts for A/B testing

Key principles:
- Be specific and actionable in your suggestions
- Consider the target AI model and use case
- Focus on clarity, context, and desired output format
- Suggest measurable improvements
- Explain your reasoning

Always provide practical, implementable advice for prompt optimization.`;
    } else {
      // Use custom system prompt for chat mode
      systemPrompt = agent.user_prompt || 'You are a helpful AI assistant.';
    }

    // Call AI provider with agent configuration
    const output = await callAIProvider(
      agent.provider,
      agent.model,
      systemPrompt,
      input,
      agent.max_tokens || 2048,
      agent.temperature || 0.7
    );

    const processingTime = Date.now() - startTime;

    // Return response
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
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
