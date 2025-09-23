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

// AI Provider configurations
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
      'claude-opus-4-1-20250805': { name: 'claude-opus-4-1-20250805', maxTokens: 4096 },
      'claude-sonnet-4-20250514': { name: 'claude-sonnet-4-20250514', maxTokens: 4096 },
      'claude-3-5-haiku-20241022': { name: 'claude-3-5-haiku-20241022', maxTokens: 4096 }
    }
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: googleApiKey,
    models: {
      'gemini-pro': { name: 'gemini-pro', maxTokens: 2048 },
      'gemini-ultra': { name: 'gemini-ultra', maxTokens: 2048 }
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
      'mistral-large': { name: 'mistral-large', maxTokens: 2048 },
      'mistral-medium': { name: 'mistral-medium', maxTokens: 2048 }
    }
  }
};

// Optimization strategies
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Clarity Enhancement",
    systemPrompt: "Improve the clarity and precision of this prompt. Make it unambiguous and easy to understand:",
    weight: 0.3
  },
  specificity: {
    name: "Specificity Improvement", 
    systemPrompt: "Add specific details, examples, and constraints to make this prompt more precise:",
    weight: 0.25
  },
  context: {
    name: "Context Addition",
    systemPrompt: "Add relevant context and background information to this prompt:",
    weight: 0.2
  },
  format: {
    name: "Format Structure",
    systemPrompt: "Restructure this prompt with clear formatting and sections:",
    weight: 0.15
  },
  efficiency: {
    name: "Efficiency Optimization",
    systemPrompt: "Optimize this prompt for better AI model performance and token efficiency:",
    weight: 0.1
  }
};

// Scoring criteria
const SCORING_CRITERIA = {
  clarity: { weight: 0.25, description: "How clear and unambiguous the prompt is" },
  specificity: { weight: 0.25, description: "How specific and detailed the instructions are" },
  context: { weight: 0.2, description: "How well context is provided" },
  structure: { weight: 0.15, description: "How well-structured and organized" },
  efficiency: { weight: 0.15, description: "How efficient for AI processing" }
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
      maxTokens = 2048,
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

    // Create initial prompt record
    const { data: promptRecord, error: promptError } = await supabase
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

    if (promptError) {
      console.error('Error creating prompt record:', promptError);
      throw new Error('Failed to create prompt record');
    }

    // Generate optimized variants
    const optimizedVariants = [];
    const strategyKeys = Object.keys(OPTIMIZATION_STRATEGIES).slice(0, variants);
    
    for (const strategyKey of strategyKeys) {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey];
      
      try {
        // Apply influence if provided
        let optimizationPrompt = strategy.systemPrompt + "\n\nOriginal prompt: " + originalPrompt;
        
        if (influence && influenceWeight > 0) {
          const influenceStrength = influenceWeight / 100;
          optimizationPrompt += `\n\nINFLUENCE TEMPLATE (${influenceWeight}% weight): Use this as inspiration for style and approach:\n${influence}\n\nApply this influence with ${influenceStrength} strength while maintaining the optimization strategy.`;
        }

        if (taskDescription) {
          optimizationPrompt += "\n\nTask context: " + taskDescription;
        }

        optimizationPrompt += "\n\nPlease optimize the original prompt using the " + strategy.name + " strategy.";

        // Call AI API based on provider
        const optimizedPrompt = await callAIProvider(aiProvider, modelName, optimizationPrompt, maxTokens, temperature);
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          continue;
        }

        // Test the optimized prompt
        const testPrompt = optimizedPrompt + "\n\nSample query: Create a simple example relevant to: " + (taskDescription || "general purpose");
        const testResponse = await callAIProvider(aiProvider, modelName, testPrompt, maxTokens, temperature);
        
        if (!testResponse) {
          console.error('Failed to get test response for strategy:', strategyKey);
          continue;
        }

        // Calculate score for this variant
        const score = await scorePrompt(optimizedPrompt, testResponse, strategy.weight);

        const variant = {
          prompt: optimizedPrompt,
          strategy: strategy.name,
          score: score,
          response: testResponse,
          metrics: {
            tokens_used: testResponse.length + optimizedPrompt.length,
            response_length: testResponse.length,
            prompt_length: optimizedPrompt.length,
            strategy_weight: strategy.weight * 100
          }
        };

        optimizedVariants.push(variant);

        // Store in optimization history
        await supabase
          .from('optimization_history')
          .insert({
            user_id: userId,
            prompt_id: promptRecord.id,
            variant_prompt: optimizedPrompt,
            ai_response: testResponse,
            score: score,
            metrics: variant.metrics,
            generation_time_ms: Date.now() - startTime,
            tokens_used: variant.metrics.tokens_used
          });

      } catch (error) {
        console.error(`Error processing strategy ${strategyKey}:`, error);
        continue;
      }
    }

    if (optimizedVariants.length === 0) {
      throw new Error('Failed to generate any optimized variants');
    }

    // Find best variant
    const bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const processingTime = Date.now() - startTime;

    // Update prompt record with results
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

    // Prepare response
    const response = {
      promptId: promptRecord.id,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      bestScore: bestVariant.score,
      variants: optimizedVariants,
      summary: {
        improvementScore: Math.max(0, bestVariant.score - 0.5), // Baseline improvement
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

// Helper function to call different AI providers
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig || !providerConfig.apiKey) {
    throw new Error(`Provider ${provider} not configured or API key missing`);
  }

  const modelConfig = providerConfig.models[model];
  if (!modelConfig) {
    throw new Error(`Model ${model} not available for provider ${provider}`);
  }

  try {
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
        return await callOpenAICompatible(providerConfig, modelConfig.name, prompt, maxTokens, temperature);
      
      case 'anthropic':
        return await callAnthropic(providerConfig, modelConfig.name, prompt, maxTokens, temperature);
      
      case 'google':
        return await callGoogle(providerConfig, modelConfig.name, prompt, maxTokens, temperature);
      
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
      max_tokens: Math.min(maxTokens, 4096),
      temperature: Math.min(temperature, 1.0),
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(providerConfig: any, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'x-api-key': providerConfig.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: Math.min(maxTokens, 4096),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(providerConfig: any, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string> {
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
        maxOutputTokens: Math.min(maxTokens, 2048),
        temperature: Math.min(temperature, 1.0),
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Scoring functions
async function scorePrompt(prompt: string, response: string, strategyWeight: number): Promise<number> {
  const clarityScore = scoreClarity(prompt);
  const specificityScore = scoreSpecificity(prompt);
  const contextScore = scoreContext(prompt);
  const structureScore = scoreStructure(prompt);
  const efficiencyScore = scoreEfficiency(prompt, response);

  const weightedScore = (
    clarityScore * SCORING_CRITERIA.clarity.weight +
    specificityScore * SCORING_CRITERIA.specificity.weight +
    contextScore * SCORING_CRITERIA.context.weight +
    structureScore * SCORING_CRITERIA.structure.weight +
    efficiencyScore * SCORING_CRITERIA.efficiency.weight
  );

  // Apply strategy bonus
  const strategyBonus = strategyWeight * 0.2;
  return Math.min(1.0, weightedScore + strategyBonus);
}

function scoreClarity(prompt: string): number {
  const words = prompt.split(' ').length;
  const sentences = prompt.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Optimal range: 10-20 words per sentence
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) return 1.0;
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) return 0.8;
  if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 30) return 0.6;
  return 0.4;
}

function scoreSpecificity(prompt: string): number {
  const specificWords = ['specific', 'exactly', 'must', 'should', 'include', 'format', 'example', 'detailed'];
  const found = specificWords.filter(word => prompt.toLowerCase().includes(word));
  return Math.min(1.0, found.length / 4);
}

function scoreContext(prompt: string): number {
  const contextWords = ['context', 'background', 'purpose', 'goal', 'audience', 'use case'];
  const found = contextWords.filter(word => prompt.toLowerCase().includes(word));
  return Math.min(1.0, found.length / 3);
}

function scoreStructure(prompt: string): number {
  const hasNumbering = /\d+\./.test(prompt);
  const hasBullets = /[-•*]/.test(prompt);
  const hasHeaders = /#+/.test(prompt) || /[A-Z][^.]*:/.test(prompt);
  
  let score = 0.3; // Base score
  if (hasNumbering) score += 0.3;
  if (hasBullets) score += 0.2;
  if (hasHeaders) score += 0.2;
  
  return Math.min(1.0, score);
}

function scoreEfficiency(prompt: string, response: string): number {
  const promptTokens = prompt.length / 4; // Rough token estimation
  const responseTokens = response.length / 4;
  const ratio = responseTokens / promptTokens;
  
  // Good ratio is 2-8 (response should be 2-8x longer than prompt)
  if (ratio >= 2 && ratio <= 8) return 1.0;
  if (ratio >= 1.5 && ratio <= 10) return 0.8;
  if (ratio >= 1 && ratio <= 12) return 0.6;
  return 0.4;
}