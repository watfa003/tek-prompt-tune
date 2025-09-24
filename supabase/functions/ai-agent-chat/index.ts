import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create chat session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + '...',
          context: { 
            type: 'prompt_optimization',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create chat session');
      }
      currentSessionId = session.id;
    }

    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        user_id: userId,
        role: 'user',
        content: message
      });

    // Get conversation history for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Prepare conversation context
    const conversationHistory = history || [];
    const messages = [
      {
        role: 'system',
        content: `You are PrompTek AI Agent, an expert in prompt engineering and optimization. You help users:

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

Always provide practical, implementable advice for prompt optimization.`
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save AI response
    await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        user_id: userId,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          model: 'gpt-4',
          tokens_used: data.usage?.total_tokens || 0,
          generation_time_ms: Date.now()
        }
      });

    // Update session title if it's a new session
    if (!sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ 
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sessionId: currentSessionId,
        tokensUsed: data.usage?.total_tokens || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-agent-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});