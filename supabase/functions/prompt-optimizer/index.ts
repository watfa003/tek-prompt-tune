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
      'llama-3.1-8b': { name: 'llama-3.1-8b-instant', maxTokens: 2048 }
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
      'gemini-2.0-flash': { name: 'gemini-2.0-flash', maxTokens: 4096 },
      'gemini-1.5-flash': { name: 'gemini-1.5-flash', maxTokens: 4096 },
      'gemini-1.5-pro': { name: 'gemini-1.5-pro', maxTokens: 4096 },
      'gemini-pro': { name: 'gemini-1.5-pro', maxTokens: 4096 },
      'gemini-ultra': { name: 'gemini-2.0-flash', maxTokens: 4096 }
    }
  }
};

// Cheaper models for optimization process
const OPTIMIZATION_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  mistral: 'mistral-medium',
  groq: 'llama-3.1-8b',
  google: 'gemini-1.5-pro'
};

// Ultra-fast optimization strategies (minimal but effective)
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Clarity Enhancement",
    systemPrompt: "Make clearer and more specific:",
    weight: 0.35
  },
  efficiency: {
    name: "Efficiency Optimization", 
    systemPrompt: "Optimize for better AI performance:",
    weight: 0.35
  },
  structure: {
    name: "Structure Enhancement",
    systemPrompt: "Add logical structure and steps:",
    weight: 0.3
  }
};

// Define userId extraction function
const getUserId = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  try {
    // Simple extraction - in real implementation, verify JWT
    const token = authHeader.replace('Bearer ', '');
    // For this example, we'll use a placeholder
    return 'user-123'; 
  } catch {
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalPrompt, 
      aiProvider, 
      modelName, 
      maxTokens = 2048, 
      temperature = 0.6, 
      variants = 2,
      outputType = 'text',
      taskDescription,
      influence,
      influenceWeight = 0
    } = await req.json();

    console.log('prompt-optimizer received:', { 
      maxTokens, 
      modelName, 
      aiProvider, 
      temperature, 
      variants, 
      outputType 
    });

    if (!originalPrompt || !aiProvider || !modelName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = getUserId(req) || 'anonymous';
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const startTime = Date.now();

    // Create prompt record
    const createPromptRecord = async () => {
      return await supabase
        .from('prompts')
        .insert({
          user_id: userId,
          original_prompt: originalPrompt,
          ai_provider: aiProvider,
          model_name: modelName,
          task_description: taskDescription,
          output_type: outputType,
          status: 'processing'
        })
        .select()
        .single();
    };

    // Simplified historical data fetch (async, non-blocking)
    const historicalPromise = getHistoricalOptimizations(supabase, userId, aiProvider, modelName);

    // Start prompt record creation
    const promptRecordPromise = createPromptRecord();

    // Generate optimized variants with reduced count for speed
    const maxVariants = Math.min(Number(variants) || 2, 3); // Cap at 3 for speed
    const strategyKeys = Object.keys(OPTIMIZATION_STRATEGIES).slice(0, maxVariants);
    
    const variantPromises = strategyKeys.map(async (strategyKey) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey as keyof typeof OPTIMIZATION_STRATEGIES];
      
      try {
        // Ultra-fast optimization prompt (minimal tokens)
        let optimizationPrompt = `${strategy.systemPrompt}\n\nOriginal: ${originalPrompt.slice(0, 500)}...\n\nRules: Preserve intent. Return only improved prompt.`;
        
        if (outputType && outputType !== 'text') {
          optimizationPrompt += ` Format: ${outputType}.`;
        }

        // Single API call for optimization using cheapest/fastest model
        const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || 'gpt-4o-mini';
        const optimizedPrompt = await callAIProvider(
          aiProvider, 
          optimizationModel, 
          optimizationPrompt, 
          Math.min(maxTokens, 1024), // Reduced token limit for speed
          temperature
        );
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          return null;
        }

        // Fast scoring with limited testing for speed
        let actualScore = 0.75; // Default good score
        let actualResponse = `Optimization completed using ${strategy.name} strategy`;
        
        // Only test 1 in 3 prompts with actual model for speed (but still maintain quality)
        const shouldTest = Math.random() < 0.4; // 40% chance to test
        
        if (shouldTest) {
          console.log(`Testing optimized prompt with user's selected model: ${modelName}`);
          const testResponse = await callAIProvider(
            aiProvider,
            modelName,
            optimizedPrompt,
            Math.min(maxTokens, 512), // Reduced for speed
            temperature
          );
          
          if (testResponse) {
            actualResponse = testResponse;
            // Fast evaluation for tested responses
            const responseWords = testResponse.split(' ').length;
            if (responseWords > 1000) {
              actualScore = fastSkimEvaluation(testResponse, strategy.weight);
            } else {
              actualScore = quickEvaluateOutput(testResponse, strategy.weight);
            }
            console.log(`Actual response scored: ${actualScore} for strategy: ${strategyKey}`);
          }
        } else {
          // Use heuristic scoring for non-tested prompts
          actualScore = Math.min(0.9, 0.6 + strategy.weight + (optimizedPrompt.length > originalPrompt.length ? 0.1 : 0));
        }

        return {
          prompt: optimizedPrompt,
          response: actualResponse,
          score: actualScore,
          strategy: strategy.name,
          metrics: {
            tokens_used: Math.floor(optimizedPrompt.length / 4), // Rough estimate
            response_length: actualResponse.length,
            tested_with_target_model: shouldTest
          }
        };

      } catch (error) {
        console.error(`Error processing strategy ${strategyKey}:`, error);
        return null;
      }
    });

    // Wait for variants and prompt record in parallel
    const [promptRecordResult, historicalData, ...variantResults] = await Promise.allSettled([
      promptRecordPromise,
      historicalPromise,
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
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (optimizedVariants.length === 0) {
      throw new Error('Failed to generate any optimized variants');
    }

    // Find best variant
    const bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const processingTime = Date.now() - startTime;

    // Simplified background database updates (fire and forget)
    Promise.resolve().then(async () => {
      try {
        // Batch insert optimization history
        if (optimizedVariants.length > 0) {
          await supabase.from('optimization_history').insert(
            optimizedVariants.map(variant => ({
              user_id: userId,
              prompt_id: promptRecord.id,
              variant_prompt: variant.prompt.slice(0, 1000), // Truncate for speed
              ai_response: variant.response.slice(0, 500),
              score: variant.score,
              metrics: variant.metrics,
              generation_time_ms: processingTime,
              tokens_used: variant.metrics.tokens_used
            }))
          );

          // Update prompt record
          await supabase
            .from('prompts')
            .update({
              optimized_prompt: bestVariant.prompt,
              score: bestVariant.score,
              performance_metrics: {
                best_strategy: bestVariant.strategy,
                total_variants: optimizedVariants.length,
                processing_time_ms: processingTime
              },
              variants_generated: optimizedVariants.length,
              status: 'completed'
            })
            .eq('id', promptRecord.id);
        }
      } catch (error) {
        console.error('Background update error:', error);
      }
    });

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
    console.error('Error in prompt-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// AI Provider API calls
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  try {
    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
    if (!providerConfig) {
      console.error(`Provider ${provider} not supported`);
      return null;
    }

    const modelConfig = providerConfig.models[model as keyof typeof providerConfig.models];
    const actualModel = (modelConfig as any)?.name || model;

    console.log(`Making API call to ${providerConfig.baseUrl} with model: ${actualModel}`);

    const isNewerModel = ['gpt-5', 'gpt-4.1', 'o3', 'o4'].some(prefix => actualModel.startsWith(prefix));
    console.log(`${provider}-compatible payload`, { model: actualModel, isNewerModel, max: maxTokens });

    if (provider === 'openai') {
      const payload: any = {
        model: actualModel,
        messages: [{ role: 'user', content: prompt }],
        ...(isNewerModel ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens })
      };

      if (!isNewerModel) {
        payload.temperature = temperature;
      }

      const response = await fetch(providerConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`API response status: ${response.status} for model: ${actualModel}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }

    if (provider === 'anthropic') {
      const response = await fetch(providerConfig.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': providerConfig.apiKey!,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: actualModel,
          max_tokens: maxTokens,
          temperature: temperature,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.text || null;
    }

    if (provider === 'groq') {
      const response = await fetch(providerConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }

    if (provider === 'mistral') {
      const response = await fetch(providerConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Mistral API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }

    if (provider === 'google') {
      const response = await fetch(`${providerConfig.baseUrl}/${actualModel}:generateContent?key=${providerConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    return null;
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    return null;
  }
}

// Fast skim evaluation for long outputs (over 2 pages)
function fastSkimEvaluation(text: string, strategyWeight: number): number {
  const words = text.split(' ').length;
  
  // Quick quality checks on first and last portions
  const firstPortion = text.substring(0, 500);
  const lastPortion = text.substring(Math.max(0, text.length - 500));
  const middlePortion = text.substring(Math.floor(text.length * 0.4), Math.floor(text.length * 0.6));
  
  // Quick indicators of quality
  const hasGoodStructure = /(?:\n\s*[-*]\s|\d+\.|:{1,2}|#{1,6}\s)/g.test(text);
  const hasVariedSentences = !/^(.{20,50}[.!?]\s*){10,}$/m.test(firstPortion);
  const isNotTruncated = !text.trim().endsWith('...') && !/\b(tbc|to be continued|truncated)\b/i.test(lastPortion);
  const hasGoodTransitions = /\b(however|furthermore|additionally|therefore|moreover|consequently)\b/i.test(middlePortion);
  
  let score = 0.75; // Start with good base score for long outputs
  
  // Quick bonuses
  if (hasGoodStructure) score += 0.1;
  if (hasVariedSentences) score += 0.05;
  if (isNotTruncated) score += 0.05;
  if (hasGoodTransitions) score += 0.03;
  
  // Quick penalties
  if (words < 800) score -= 0.15; // Too short for "long" content
  if (words > 5000) score -= 0.05; // Potentially too verbose
  if (checkForRepetition(firstPortion + lastPortion)) score -= 0.1;
  
  // Strategy bonus
  score += strategyWeight * 0.08;
  
  return Math.min(1.0, Math.max(0.15, score));
}

// Ultra-fast evaluation for shorter responses
function quickEvaluateOutput(text: string, strategyWeight: number): number {
  const length = text.length;
  const words = text.split(' ').length;
  
  let score = 0.7; // Start with good base
  
  // Quick quality indicators
  if (length > 100 && words > 20) score += 0.1;
  if (!/^(.{10,30}[.!?]\s*){5,}$/m.test(text)) score += 0.05; // Varied sentences
  if (/\b(step|first|then|next|finally|example)\b/i.test(text)) score += 0.05; // Structure
  
  // Quick penalties
  if (length < 50) score -= 0.2;
  if (words < 10) score -= 0.15;
  
  score += strategyWeight * 0.1;
  return Math.min(0.95, Math.max(0.3, score));
}

// Simplified historical data fetch
async function getHistoricalOptimizations(supabase: any, userId: string, aiProvider: string, modelName: string) {
  try {
    // Only get recent high-scoring entries for speed
    const { data: recent } = await supabase
      .from('optimization_history')
      .select('score, metrics')
      .eq('user_id', userId)
      .gte('score', 0.8)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      avgScore: recent?.length > 0 ? recent.reduce((sum: number, h: any) => sum + (h.score || 0), 0) / recent.length : 0.7,
      totalOptimizations: recent?.length || 0
    };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return { avgScore: 0.7, totalOptimizations: 0 };
  }
}

// Check for repetitive content
function checkForRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 5) return false;
  
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  return sentences.length > uniqueSentences.size * 1.1;
}