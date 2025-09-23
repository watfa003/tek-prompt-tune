import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// AI Provider configurations (simplified for speed)
const AI_PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: openAIApiKey,
    models: {
      'gpt-5-2025-08-07': { name: 'gpt-5-2025-08-07', maxTokens: 4096 },
      'gpt-4o': { name: 'gpt-4o', maxTokens: 4096 },
      'gpt-4o-mini': { name: 'gpt-4o-mini', maxTokens: 4096 }
    }
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: anthropicApiKey,
    models: {
      'claude-opus-4-1-20250805': { name: 'claude-3-5-sonnet-20241022', maxTokens: 4096 },
      'claude-sonnet-4-20250514': { name: 'claude-3-5-sonnet-20241022', maxTokens: 4096 },
      'claude-3-5-haiku-20241022': { name: 'claude-3-5-haiku-20241022', maxTokens: 4096 }
    }
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: groqApiKey,
    models: {
      'llama-3.1-70b': { name: 'llama-3.1-70b-versatile', maxTokens: 2048 },
      'mixtral-8x7b': { name: 'mixtral-8x7b-32768', maxTokens: 2048 }
    }
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    apiKey: mistralApiKey,
    models: {
      'mistral-large': { name: 'mistral-large-latest', maxTokens: 2048 },
      'mistral-medium': { name: 'mistral-medium-latest', maxTokens: 2048 }
    }
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: googleApiKey,
    models: {
      'gemini-pro': { name: 'gemini-pro', maxTokens: 2048 },
      'gemini-ultra': { name: 'gemini-pro', maxTokens: 2048 }
    }
  }
};

// Faster optimization strategies (simplified for speed)
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Clarity Enhancement",
    systemPrompt: "Make this prompt clearer and more specific:",
    weight: 0.3
  },
  specificity: {
    name: "Specificity Improvement", 
    systemPrompt: "Add specific details and examples to this prompt:",
    weight: 0.25
  },
  efficiency: {
    name: "Efficiency Optimization",
    systemPrompt: "Optimize this prompt for better AI performance:",
    weight: 0.2
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalPrompt, 
      taskDescription, 
      aiProvider = 'openai', 
      modelName = 'gpt-4o-mini', 
      outputType = 'text',
      variants = 3,
      userId,
      maxTokens = 1024, // Reduced for speed
      temperature = 0.7,
      influence = '',
      influenceWeight = 0
    } = await req.json();

    if (!originalPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Original prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    // Create initial prompt record in background
    const createPromptRecord = async () => {
      return await supabase
        .from('prompts')
        .insert({
          user_id: userId,
          original_prompt: originalPrompt,
          task_description: taskDescription,
          ai_provider: aiProvider,
          model_name: modelName,
          output_type: outputType,
          status: 'processing'
        })
        .select()
        .single();
    };

    // Start prompt record creation
    const promptRecordPromise = createPromptRecord();

    // Generate optimized variants in parallel for maximum speed
    const strategyKeys = Object.keys(OPTIMIZATION_STRATEGIES).slice(0, Math.min(variants, 3));
    
    const variantPromises = strategyKeys.map(async (strategyKey) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey];
      
      try {
        // Simplified optimization prompt for speed
        let optimizationPrompt = `${strategy.systemPrompt}\n\nOriginal: ${originalPrompt}`;
        
        if (outputType && outputType !== 'text') {
          optimizationPrompt += `\n\nTarget output type: ${outputType}`;
        }
        
        if (influence && influenceWeight > 0) {
          optimizationPrompt += `\n\nStyle influence (${influenceWeight}%): ${influence.slice(0, 200)}`;
        }

        if (taskDescription) {
          optimizationPrompt += `\n\nContext: ${taskDescription}`;
        }

        // Single API call for optimization (no separate testing for speed)
        const optimizedPrompt = await callAIProvider(
          aiProvider, 
          modelName, 
          optimizationPrompt, 
          Math.min(maxTokens, 1024), // Limit tokens for speed
          temperature
        );
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          return null;
        }

        // Quick scoring (simplified)
        const score = quickScore(optimizedPrompt, strategy.weight);

        return {
          prompt: optimizedPrompt,
          strategy: strategy.name,
          score: score,
          response: `Optimized using ${strategy.name} strategy`,
          metrics: {
            tokens_used: optimizedPrompt.length,
            response_length: optimizedPrompt.length,
            prompt_length: originalPrompt.length,
            strategy_weight: strategy.weight * 100
          }
        };

      } catch (error) {
        console.error(`Error processing strategy ${strategyKey}:`, error);
        return null;
      }
    });

    // Wait for variants in parallel
    const [promptRecordResult, ...variantResults] = await Promise.allSettled([
      promptRecordPromise,
      ...variantPromises
    ]);

    // Get prompt record
    const promptRecord = promptRecordResult.status === 'fulfilled' ? promptRecordResult.value.data : null;
    if (!promptRecord) {
      throw new Error('Failed to create prompt record');
    }

    // Filter successful variants
    const optimizedVariants = variantResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (optimizedVariants.length === 0) {
      throw new Error('Failed to generate any optimized variants');
    }

    // Find best variant
    const bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const processingTime = Date.now() - startTime;

    // Background task for database updates (don't block response)
    const backgroundUpdates = async () => {
      try {
        // Store optimization history
        const historyPromises = optimizedVariants.map(variant => 
          supabase.from('optimization_history').insert({
            user_id: userId,
            prompt_id: promptRecord.id,
            variant_prompt: variant.prompt,
            ai_response: variant.response,
            score: variant.score,
            metrics: variant.metrics,
            generation_time_ms: processingTime,
            tokens_used: variant.metrics.tokens_used
          })
        );

        await Promise.allSettled(historyPromises);

        // Update prompt record
        await supabase
          .from('prompts')
          .update({
            optimized_prompt: bestVariant.prompt,
            score: bestVariant.score,
            performance_metrics: {
              best_strategy: bestVariant.strategy,
              total_variants: optimizedVariants.length,
              processing_time_ms: processingTime,
              average_score: optimizedVariants.reduce((sum, v) => sum + v.score, 0) / optimizedVariants.length
            },
            variants_generated: optimizedVariants.length,
            status: 'completed'
          })
          .eq('id', promptRecord.id);

        console.log('Background database updates completed');
      } catch (error) {
        console.error('Background update error:', error);
      }
    };

    // Start background task
    EdgeRuntime.waitUntil(backgroundUpdates());

    // Return immediate response
    const response = {
      promptId: promptRecord.id,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      bestScore: bestVariant.score,
      variants: optimizedVariants,
      summary: {
        improvementScore: Math.max(0, bestVariant.score - 0.5),
        bestStrategy: bestVariant.strategy,
        totalVariants: optimizedVariants.length,
        processingTimeMs: processingTime
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in prompt-optimizer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Optimized AI provider calls
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig || !providerConfig.apiKey) {
    throw new Error(`Provider ${provider} not configured`);
  }

  const modelConfig = providerConfig.models[model];
  if (!modelConfig) {
    throw new Error(`Model ${model} not available`);
  }

  try {
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
        return await callOpenAICompatible(providerConfig, modelConfig.name, prompt, maxTokens, temperature);
      
      case 'anthropic':
        return await callAnthropic(providerConfig, modelConfig.name, prompt, maxTokens);
      
      case 'google':
        return await callGoogle(providerConfig, modelConfig.name, prompt, maxTokens);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    return null;
  }
}

async function callOpenAICompatible(providerConfig: any, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: Math.min(temperature, 1.0),
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'x-api-key': providerConfig.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch(`${providerConfig.baseUrl}/${model}:generateContent?key=${providerConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Quick scoring for speed (simplified)
function quickScore(prompt: string, strategyWeight: number): number {
  const words = prompt.split(' ').length;
  const sentences = prompt.split(/[.!?]+/).length;
  
  // Basic quality indicators
  let score = 0.5; // Base score
  
  // Length quality (optimal 50-200 words)
  if (words >= 50 && words <= 200) score += 0.2;
  else if (words >= 30 && words <= 300) score += 0.1;
  
  // Structure quality
  if (sentences > 1) score += 0.1;
  if (prompt.includes(':') || prompt.includes('-')) score += 0.1;
  
  // Apply strategy bonus
  score += strategyWeight * 0.1;
  
  return Math.min(1.0, score);
}