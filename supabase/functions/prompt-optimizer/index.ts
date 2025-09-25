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
      // UI aliases mapping to supported models
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
  },
  structure: {
    name: "Structure and Steps",
    systemPrompt: "Improve the logical structure with step-by-step instructions and sections:",
    weight: 0.15
  },
  constraints: {
    name: "Constraints and Format",
    systemPrompt: "Add constraints, acceptance criteria, and a precise output format:",
    weight: 0.1
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
      maxTokens = 1024,
      temperature = 0.7,
      influence = '',
      influenceWeight = 0
    } = await req.json();

    console.log('prompt-optimizer received:', { maxTokens, modelName, aiProvider, temperature, variants, outputType });

    if (!originalPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Original prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
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
    const allStrategies = Object.keys(OPTIMIZATION_STRATEGIES);
    const variantCount = Math.min(Math.max(Number(variants) || 1, 1), allStrategies.length);
    const strategyKeys = allStrategies.slice(0, variantCount);
    
    const variantPromises = strategyKeys.map(async (strategyKey) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey as keyof typeof OPTIMIZATION_STRATEGIES];
      
      try {
        // Simplified optimization prompt for speed
        let optimizationPrompt = `${strategy.systemPrompt}\n\nOriginal: ${originalPrompt}`;
        
        // Critical rules: keep user's intent and only improve the prompt
        optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Do NOT generate meta-prompts (e.g., 'create a prompt', 'write code that generates a prompt').\n- Return ONLY the improved prompt text with no extra commentary or markdown fences.\n- Do not change the task into writing code unless the original prompt explicitly requested code.`;
        
        if (outputType && outputType !== 'text') {
          optimizationPrompt += `\n- Ensure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format (this affects the AI's response format only, not the prompt itself).`;
        }
        
        if (influence && influenceWeight > 0) {
          optimizationPrompt += `\n\nStyle influence (${influenceWeight}%): ${influence.slice(0, 200)}`;
        }

        if (taskDescription) {
          optimizationPrompt += `\n\nContext: ${taskDescription}`;
        }

        // Single API call for optimization using cheaper model
        const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || modelName;
        const optimizedPrompt = await callAIProvider(
          aiProvider, 
          optimizationModel, 
          optimizationPrompt, 
          Math.min(maxTokens, 4096), // Respect user setting but cap at reasonable limit
          temperature
        );
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          return null;
        }

        // Advanced length-based evaluation
        const score = evaluateOutput(optimizedPrompt, strategy.weight);

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
      .map(result => (result as PromiseFulfilledResult<any>).value);

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
    Promise.resolve().then(() => backgroundUpdates());

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Optimized AI provider calls
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
  if (!providerConfig || !providerConfig.apiKey) {
    throw new Error(`Provider ${provider} not configured`);
  }

  let modelConfig = (providerConfig.models as any)[model];
  if (!modelConfig && provider === 'groq') {
    // Fallback to the only supported Groq model we expose
    modelConfig = (providerConfig.models as any)['llama-3.1-8b'];
  }
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
  console.log(`Making API call to ${providerConfig.baseUrl} with model: ${model}`);
  
    const isNewerModel = /^(gpt-5|gpt-4\.1|o3|o4)/i.test(model);
    const payload: any = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
    };
    if (isNewerModel) {
      payload.max_completion_tokens = maxTokens; // Newer models use max_completion_tokens and ignore temperature
    } else {
      payload.max_tokens = maxTokens; // Legacy models use max_tokens
      payload.temperature = Math.min(temperature, 1.0);
    }

    console.log('openai-compatible payload', { model, isNewerModel, max: isNewerModel ? payload.max_completion_tokens : payload.max_tokens });

    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  console.log(`API response status: ${response.status} for model: ${model}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API call failed for ${model}:`, errorText);
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
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
    const errorText = await response.text();
    console.error('Google API error details:', errorText);
    throw new Error(`Google API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    console.error('Google API response has no candidates:', data);
    throw new Error('Google API returned no candidates');
  }
  
  if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('Google API response has no content parts:', data.candidates[0]);
    throw new Error('Google API returned no content parts');
  }
  
  return data.candidates[0].content.parts[0].text;
}

// Advanced evaluation logic with length-based analysis
function evaluateOutput(prompt: string, strategyWeight: number): number {
  const words = prompt.split(' ').length;
  const sentences = prompt.split(/[.!?]+/).length;
  const approximateTokens = words * 1.3; // Rough token estimation

  // Length-based evaluation strategy with calibrated scoring ranges
  if (approximateTokens <= 1000) {
    return fullDetailedEvaluation(prompt, words, sentences, strategyWeight);
  } else {
    return compressedAnalysis(prompt, words, sentences, strategyWeight);
  }
}

// Full detailed evaluation for shorter outputs
function fullDetailedEvaluation(prompt: string, words: number, sentences: number, strategyWeight: number): number {
  // Calibrated sub-scores (0..1) with higher base values
  const hasSpecificTerms = /\b(specific|detail|example|step|instruction|format|constraint|criteria|acceptance)\b/i.test(prompt);
  const hasStructure = /(?:\n\s*[-*]\s|\d+\.|:|#\s)/.test(prompt);
  const hasContext = /\b(context|background|purpose|goal|objective|audience|constraints)\b/i.test(prompt);
  const hasTransitions = /\b(then|next|after|before|finally|additionally|furthermore|therefore|however)\b/i.test(prompt);
  const avgWordsPerSentence = words / Math.max(sentences, 1);

  const accuracy = Math.min(1,
    0.6 + (hasSpecificTerms ? 0.2 : 0) + (hasContext ? 0.1 : 0) + (hasStructure ? 0.1 : 0)
  );

  const sectionsCount = prompt.split(/\n\n|\n(?=[A-Z])|\d+\.|#{1,6}\s/).length;
  const completeness = Math.min(1,
    0.6 + (words >= 50 ? 0.15 : 0) + (words >= 100 ? 0.15 : 0) + (hasStructure ? 0.1 : 0)
  );

  const clarity = Math.min(1,
    0.6 + ((avgWordsPerSentence >= 12 && avgWordsPerSentence <= 22) ? 0.2 : 0) + (hasTransitions ? 0.1 : 0)
  );

  let score = 0.7 + 0.25 * (0.4 * accuracy + 0.35 * completeness + 0.25 * clarity);

  // Penalties for bad quality
  const hasCutoffText = prompt.trim().endsWith('...') || /\b(tbc|to be continued)\b/i.test(prompt);
  const isVeryShort = words < 10;
  const isGibberish = /^(.)\1{10,}|^[^a-zA-Z0-9\s]{20,}/.test(prompt.trim());
  const isBlank = prompt.trim().length < 5;
  
  if (isBlank || isGibberish) score = 0.2; // Very bad output
  else if (isVeryShort) score -= 0.3; // Severe penalty for very short
  else if (words < 20) score -= 0.15; 
  else if (words < 40) score -= 0.08;
  
  if (words > 400) score -= 0.03;
  if (hasCutoffText) score -= 0.1;
  if (checkForRepetition(prompt)) score -= 0.08;

  // Strategy bonus
  score += strategyWeight * 0.08;

  return Math.min(1.0, Math.max(0.2, score));
}

// Compressed analysis for longer outputs
function compressedAnalysis(prompt: string, words: number, sentences: number, strategyWeight: number): number {
  const sections = prompt.split(/\n\n|\n(?=[A-Z])|\d+\.|#{1,6}\s/).length;
  const avgWordsPerSentence = words / Math.max(sentences, 1);

  // Required sections presence check
  const requiredSections = {
    introduction: /\b(introduction|overview|purpose|goal)\b/i.test(prompt),
    methodology: /\b(method|approach|steps|process|procedure)\b/i.test(prompt),
    requirements: /\b(requirement|constraint|criteria|specification|acceptance)\b/i.test(prompt),
    format: /\b(format|structure|template|output|result)\b/i.test(prompt),
    conclusion: /\b(conclusion|summary|final|end)\b/i.test(prompt)
  } as const;
  const presentSections = Object.values(requiredSections).filter(Boolean).length;

  const structure = Math.min(1, 0.6 + (sections >= 3 ? 0.2 : 0) + (sections >= 5 ? 0.2 : 0));
  const coverage = Math.min(1, 0.6 + (presentSections / 5) * 0.4);
  const clarity = Math.min(1, 0.6 + ((avgWordsPerSentence >= 12 && avgWordsPerSentence <= 24) ? 0.2 : 0) + (/\b(first|second|third|finally)\b/i.test(prompt) ? 0.1 : 0));

  let score = 0.7 + 0.25 * (0.5 * structure + 0.3 * coverage + 0.2 * clarity);

  // Penalties for bad quality
  const hasCutoffText = prompt.trim().endsWith('...') || /\b(tbc|to be continued)\b/i.test(prompt);
  const isVeryShort = words < 50;
  const isGibberish = /^(.)\1{10,}|^[^a-zA-Z0-9\s]{20,}/.test(prompt.trim());
  const isBlank = prompt.trim().length < 5;
  
  if (isBlank || isGibberish) score = 0.15; // Very bad output
  else if (isVeryShort) score -= 0.25; // Severe penalty for very short long-form
  else if (words < 200) score -= 0.1; 
  else if (words < 350) score -= 0.05;
  
  if (hasCutoffText) score -= 0.12;
  if (checkForRepetition(prompt)) score -= 0.08;
  if (words > 3000) score -= 0.03;

  // Strategy bonus
  score += strategyWeight * 0.08;

  return Math.min(1.0, Math.max(0.15, score));
}

// Helper function to detect repetition
function checkForRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  return sentences.length > uniqueSentences.size * 1.1; // Slightly stricter repetition detection
}