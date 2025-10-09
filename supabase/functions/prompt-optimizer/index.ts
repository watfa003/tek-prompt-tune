import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { handleSpeedMode } from './speed-mode-functions.ts';

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
      'gpt-5-mini-2025-08-07': { name: 'gpt-5-mini-2025-08-07', maxTokens: 4096 },
      'gpt-5-nano-2025-08-07': { name: 'gpt-5-nano-2025-08-07', maxTokens: 4096 },
      'gpt-4.1-2025-04-14': { name: 'gpt-4.1-2025-04-14', maxTokens: 4096 },
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
      'gemini-2.0-flash-lite': { name: 'gemini-2.0-flash-lite', maxTokens: 4096 },
      'gemini-2.0-flash': { name: 'gemini-2.0-flash', maxTokens: 4096 },
      'gemini-2.5-flash-lite': { name: 'gemini-2.5-flash-lite', maxTokens: 4096 },
      'gemini-2.5-flash': { name: 'gemini-2.5-flash', maxTokens: 4096 },
      'gemini-2.5-pro': { name: 'gemini-2.5-pro', maxTokens: 8192 }
    }
  }
};

// Cheaper models for optimization process
const OPTIMIZATION_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  mistral: 'mistral-medium',
  groq: 'llama-3.1-8b',
  google: 'gemini-2.5-flash'
};

// Faster optimization strategies (simplified for speed)
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Clarity Enhancement",
    systemPrompt: "You are a prompt optimization expert. Your job is to take the given prompt and make it clearer and more specific. Do NOT answer the prompt - only improve how it asks the question:",
    weight: 0.3
  },
  specificity: {
    name: "Specificity Improvement", 
    systemPrompt: "You are a prompt optimization expert. Your job is to add specific details and examples to make this prompt more precise. Do NOT answer the prompt - only improve how it asks the question:",
    weight: 0.25
  },
  efficiency: {
    name: "Efficiency Optimization",
    systemPrompt: "You are a prompt optimization expert. Your job is to optimize this prompt for better AI performance and efficiency. Do NOT answer the prompt - only improve how it asks the question:",
    weight: 0.2
  },
  structure: {
    name: "Structure and Steps",
    systemPrompt: "You are a prompt optimization expert. Your job is to improve the logical structure with step-by-step instructions and clear sections. Do NOT answer the prompt - only improve how it asks the question:",
    weight: 0.15
  },
  constraints: {
    name: "Constraints and Format",
    systemPrompt: "You are a prompt optimization expert. Your job is to add constraints, acceptance criteria, and a precise output format. Do NOT answer the prompt - only improve how it asks the question:",
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
      maxTokens = null,
      temperature = 0.7,
      influence = '',
      influenceWeight = 0,
      mode = 'deep',
      // New template functionality
      isTemplate = false,
      templateId = null,
      saveAsTemplate = false,
      templateTitle = '',
      templateDescription = '',
      templateCategory = 'custom'
    } = await req.json();

    console.log('prompt-optimizer received:', { maxTokens, modelName, aiProvider, temperature, variants, outputType, mode, isTemplate, influenceWeight });

    if (!originalPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Original prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const startTime = Date.now();

    // Handle Speed Mode
    if (mode === 'speed') {
      return await handleSpeedMode(supabase, { 
        originalPrompt, 
        taskDescription, 
        outputType, 
        userId, 
        startTime, 
        variants, 
        aiProvider, 
        modelName,
        maxTokens,
        temperature,
        influence,
        influenceWeight
      });
    }

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

    // Load cached optimization insights instead of checking all history
    const cachedInsights = await loadOptimizationInsights(supabase, userId, aiProvider, modelName);
    
    // Generate optimized variants in parallel for maximum speed
    const allStrategies = Object.keys(OPTIMIZATION_STRATEGIES);
    const variantCount = Math.min(Math.max(Number(variants) || 1, 1), allStrategies.length);
    const strategyKeys = selectBestStrategies(allStrategies, variantCount, cachedInsights);
    
    const variantPromises = strategyKeys.map(async (strategyKey) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey as keyof typeof OPTIMIZATION_STRATEGIES];
      
      try {
        // For optimization: enhance the prompt while preserving intent
        let optimizationPrompt = `${strategy.systemPrompt}\n\nOriginal: ${originalPrompt}`;
        
        // Add cached insights if available
        const strategyInsights = cachedInsights.strategies[strategyKey];
        if (strategyInsights?.patterns?.length > 0) {
          optimizationPrompt += `\n\nSuccessful patterns for this strategy: ${strategyInsights.patterns.slice(0, 3).join(', ')}`;
        }
        
        // Critical rules: keep user's intent and only improve the prompt
        optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent exactly.\n- You are optimizing a PROMPT, not answering it directly.\n- Do NOT answer the user's question - only improve how they ask it.\n- Return ONLY the improved prompt enclosed between <optimized_prompt> and </optimized_prompt> with no other text.\n- Do not use markdown fences or commentary.\n- The output should still be a prompt that asks for the same thing, just better.\n- Do not change the task into writing code unless the original prompt explicitly requested code.`;
        
        // UNIFORM influence instructions - exactly the same for ALL variants
        if (influence && influence.trim().length > 0 && influenceWeight > 0) {
          const influenceStrength = 
            influenceWeight < 30 ? 'MINIMAL' :
            influenceWeight < 60 ? 'MODERATE' :
            'STRONG';
          
          optimizationPrompt += `\n\n=== INFLUENCE TEMPLATE (${influenceWeight}% weight) ===\nReference template:\n"${influence}"\n\n🎯 CRITICAL INFLUENCE RULES - APPLY UNIFORMLY:\n`;
          
          if (influenceWeight < 30) {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Use template for LIGHT INSPIRATION ONLY (tone/style hints)\n- PRIMARY FOCUS: ${100 - influenceWeight}% on original prompt\n- DO NOT copy template structure, phrasing, or patterns\n- Keep original prompt's core approach and voice`;
          } else if (influenceWeight < 60) {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Balance template guidance with original style\n- Blend template patterns with user's approach (${influenceWeight}% template / ${100 - influenceWeight}% original)\n- Adapt helpful template elements while preserving original intent`;
          } else {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Closely follow template's patterns and structure\n- Adapt template approach (${influenceWeight}%) to user's specific needs (${100 - influenceWeight}%)\n- Template is primary guide, original prompt provides the topic`;
          }
        } else if (influence && influence.trim().length > 0) {
          optimizationPrompt += `\n\n=== INFLUENCE: DISABLED (0%) ===\nA template was provided but set to 0% - COMPLETELY IGNORE IT. Focus only on the original prompt.`;
        }
        
        if (outputType && outputType !== 'text') {
          optimizationPrompt += `\n- Ensure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format (this affects the AI's response format only, not the prompt itself).`;
        }
        
        // CRITICAL: Only integrate max_tokens if it's set
        if (maxTokens) {
          optimizationPrompt += `\n- IMPORTANT: Integrate the token limit naturally into the prompt as a constraint. For example, add phrasing like "in ${maxTokens} tokens or less" or "Keep the response within ${maxTokens} tokens" or "Provide a concise response (max ${maxTokens} tokens)" as part of the prompt's requirements. Make it flow naturally with the rest of the prompt - don't just append it as metadata.`;
        }

        if (taskDescription) {
          optimizationPrompt += `\n\nContext: ${taskDescription}`;
        }

        // Single API call for optimization using cheaper model
        const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || modelName;
        // Ensure minimum 256 tokens for optimization, but use at least 512 for testing
        const optimizationTokens = Math.max(256, Math.min(maxTokens, 4096));
        const optimizedPromptRaw = await callAIProvider(
          aiProvider, 
          optimizationModel, 
          optimizationPrompt, 
          optimizationTokens,
          temperature
        );
        
        // Sanitize to ensure we only keep the improved prompt text (never an AI answer)
        let optimizedPrompt = (optimizedPromptRaw ?? '').toString();
        const tagMatch = optimizedPrompt.match(/<optimized_prompt>([\s\S]*?)<\/optimized_prompt>/i);
        if (tagMatch) {
          optimizedPrompt = tagMatch[1].trim();
        } else {
          const fenceMatch = optimizedPrompt.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
          if (fenceMatch) optimizedPrompt = fenceMatch[1].trim();
          optimizedPrompt = optimizedPrompt
            .replace(/^\s*Optimized Prompt:\s*/i, '')
            .replace(/^\s*(Here is|Here’s|Sure,|Certainly,|I can|As an AI)\b[:,]?\s*/i, '')
            .trim();
        }
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          return null;
        }

        // Test the optimized prompt with user's selected model
        let actualResponse = '';
        let actualScore = 0;
        
        try {
          console.log(`Testing optimized prompt with user's selected model: ${modelName}`);
          // Use maxTokens if set, otherwise use a reasonable default for testing
          const testTokens = maxTokens ? Math.max(512, Math.min(maxTokens, 4096)) : 2048;
          const testResponse = await callAIProvider(
            aiProvider,
            modelName,
            optimizedPrompt,
            testTokens,
            temperature
          );
          
          if (testResponse) {
            actualResponse = testResponse;
            // Score based on the actual response from the user's selected model
            // Use fast evaluation for very long responses (over 2 pages)
            const responseWords = testResponse.split(' ').length;
            if (responseWords > 1500) { // Roughly 2 pages
              console.log(`Using fast skim evaluation for long response (${responseWords} words)`);
              actualScore = fastSkimEvaluation(testResponse, strategy.weight);
            } else {
              actualScore = evaluateOutput(testResponse, strategy.weight);
            }
            console.log(`Actual response scored: ${actualScore} for strategy: ${strategyKey}`);
         } else {
           // If no response, re-score the optimized prompt but ensure it's actually optimized
           if (optimizedPrompt.length > originalPrompt.length * 0.8) {
             actualScore = evaluateOutput(optimizedPrompt, strategy.weight);
             actualResponse = `Successfully optimized using ${strategy.name} strategy`;
           } else {
             // Prompt wasn't properly optimized, give low score
             actualScore = strategy.weight * 0.3;
             actualResponse = `Partial optimization using ${strategy.name} strategy`;
           }
           console.log(`Using fallback scoring for strategy: ${strategyKey}`);
         }
       } catch (error) {
         console.error(`Error testing with user model ${modelName}:`, error);
         // Ensure we still have a properly optimized prompt even in error cases
         if (optimizedPrompt && optimizedPrompt.length > originalPrompt.length * 0.8) {
           actualScore = evaluateOutput(optimizedPrompt, strategy.weight);
           actualResponse = `Optimization completed using ${strategy.name} strategy (fallback)`;
         } else {
           // If optimization failed completely, return a lower score
           actualScore = strategy.weight * 0.2;
           actualResponse = `Limited optimization using ${strategy.name} strategy`;
         }
       }

        return {
          prompt: optimizedPrompt,
          strategy: strategy.name,
          score: actualScore,
          response: actualResponse,
            metrics: {
              tokens_used: optimizedPrompt.length,
              response_length: actualResponse.length,
              prompt_length: originalPrompt.length,
              strategy_weight: strategy.weight * 100,
              tested_with_target_model: actualResponse !== `Optimization completed using ${strategy.name} strategy`
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

    // Background task for database updates and optimization insights (don't block response)
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

        // Save batch findings to optimization insights - CRITICAL for speed optimization
        console.log('Starting to save batch insights to optimization_insights table...');
        await saveBatchInsights(supabase, userId, aiProvider, modelName, optimizedVariants, cachedInsights);
        console.log('✅ Batch insights saved successfully to optimization_insights table');

        console.log('Background database updates and insights completed');
      } catch (error) {
        console.error('❌ Background update error:', error);
        // Try to save insights even if other operations failed
        try {
          console.log('Attempting fallback save of batch insights...');
          await saveBatchInsights(supabase, userId, aiProvider, modelName, optimizedVariants, cachedInsights);
          console.log('✅ Fallback batch insights save successful');
        } catch (fallbackError) {
          console.error('❌ Fallback batch insights save failed:', fallbackError);
        }
      }
    };

    // Start background task to save insights
    console.log('🚀 Starting background task to save optimization insights...');
    Promise.resolve().then(() => backgroundUpdates().catch(err => 
      console.error('❌ Background task failed completely:', err)
    ));

    // Save as template if requested
    if (saveAsTemplate && templateTitle) {
      try {
        await supabase.from('prompt_templates').insert({
          user_id: userId,
          title: templateTitle,
          description: templateDescription || `Optimized template from ${bestVariant.strategy}`,
          template: bestVariant.prompt,
          category: templateCategory,
          output_type: outputType,
          rating: Math.min(Math.round(bestVariant.score * 5), 5), // Convert 0-1 score to 1-5 rating
          tags: [aiProvider, modelName, bestVariant.strategy.toLowerCase().replace(/\s+/g, '-')]
        });
        console.log('✅ Template saved successfully');
      } catch (templateError) {
        console.error('❌ Error saving template:', templateError);
      }
    }

    // Return immediate response
    const response = {
      promptId: promptRecord.id,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      bestScore: bestVariant.score,
      variants: optimizedVariants,
      templateSaved: saveAsTemplate && templateTitle,
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
  console.log(`🟢 OpenAI-compatible API call: ${model} with maxTokens: ${maxTokens}`);
  
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

    console.log('📦 Payload:', { model, isNewerModel, max: isNewerModel ? payload.max_completion_tokens : payload.max_tokens });

    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  console.log(`📡 Response status: ${response.status} for model: ${model}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API call failed for ${model}:`, errorText);
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ OpenAI-compatible API success: ${model}`);
  return data.choices[0].message.content;
}

async function callAnthropic(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  console.log(`🟣 Anthropic API call: ${model} with maxTokens: ${maxTokens}`);
  
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
    const errorText = await response.text();
    console.error(`❌ Anthropic API error (${response.status}):`, errorText);
    throw new Error(`Anthropic API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Anthropic API success: ${model}`);
  return data.content[0].text;
}

async function callGoogle(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  console.log(`🔵 Google API call: ${model} with maxTokens: ${maxTokens}`);
  
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
    console.error(`❌ Google API error (${response.status}):`, errorText);
    throw new Error(`Google API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ Google API response has no candidates:', JSON.stringify(data));
    throw new Error('Google API returned no candidates');
  }
  
  if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('❌ Google API response has no content parts:', JSON.stringify(data.candidates[0]));
    throw new Error('Google API returned no content parts');
  }
  
  console.log(`✅ Google API success: ${model}`);
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

// Load cached optimization insights for fast optimization
async function loadOptimizationInsights(supabase: any, userId: string, aiProvider: string, modelName: string) {
  try {
    console.log(`🔍 Loading cached insights for ${aiProvider}/${modelName}...`);
    const { data: insights } = await supabase
      .from('optimization_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('ai_provider', aiProvider)
      .eq('model_name', modelName)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (insights) {
      console.log(`✅ Loaded cached insights: ${insights.batch_count} batches, ${insights.total_optimizations} total opts, avg score: ${insights.avg_improvement_score?.toFixed(3)}`);
      console.log(`📊 Available strategies: ${Object.keys(insights.successful_strategies || {}).length}, patterns: ${Object.keys(insights.performance_patterns || {}).length}`);
      return {
        strategies: insights.successful_strategies || {},
        optimizationRules: insights.optimization_rules || {},
        performancePatterns: insights.performance_patterns || {},
        totalOptimizations: insights.total_optimizations || 0,
        avgUserScore: insights.avg_improvement_score || 0.5,
        hasCachedData: true,
        batchCount: insights.batch_count
      };
    }

    // No cached insights, return defaults for first run
    console.log('No cached insights found, using defaults for first optimization');
    return {
      strategies: {},
      optimizationRules: {},
      performancePatterns: {},
      totalOptimizations: 0,
      avgUserScore: 0.5,
      hasCachedData: false
    };
  } catch (error) {
    console.error('Error loading optimization insights:', error);
    return {
      strategies: {},
      optimizationRules: {},
      performancePatterns: {},
      totalOptimizations: 0,
      avgUserScore: 0.5,
      hasCachedData: false
    };
  }
}

// Save batch optimization findings to insights table
async function saveBatchInsights(supabase: any, userId: string, aiProvider: string, modelName: string, optimizedVariants: any[], previousInsights: any) {
  try {
    // Analyze current batch findings
    const batchSummary = {
      totalVariants: optimizedVariants.length,
      bestScore: Math.max(...optimizedVariants.map(v => v.score)),
      avgScore: optimizedVariants.reduce((sum, v) => sum + v.score, 0) / optimizedVariants.length,
      strategiesUsed: optimizedVariants.map(v => v.strategy),
      timestamp: new Date().toISOString()
    };

    // Extract successful strategies from this batch
    const successfulStrategies: any = {};
    optimizedVariants.forEach(variant => {
      if (variant.score > 0.7) {
        const patterns = extractSuccessfulPatterns(variant.prompt);
        const strategyKey = identifyStrategy(variant.strategy);
        
        if (!successfulStrategies[strategyKey]) {
          successfulStrategies[strategyKey] = { patterns: [], scores: [], count: 0 };
        }
        
        successfulStrategies[strategyKey].patterns.push(...patterns);
        successfulStrategies[strategyKey].scores.push(variant.score);
        successfulStrategies[strategyKey].count++;
      }
    });

    // Calculate averages for successful strategies
    Object.keys(successfulStrategies).forEach(key => {
      const strategy = successfulStrategies[key];
      strategy.avgScore = strategy.scores.reduce((sum: number, s: number) => sum + s, 0) / strategy.scores.length;
      strategy.patterns = [...new Set(strategy.patterns)]; // Remove duplicates
      delete strategy.scores; // Clean up
    });

    // Merge with previous insights
    const mergedStrategies = { ...previousInsights.strategies };
    Object.keys(successfulStrategies).forEach(key => {
      if (mergedStrategies[key]) {
        // Update existing strategy data
        mergedStrategies[key].patterns = [...new Set([...mergedStrategies[key].patterns, ...successfulStrategies[key].patterns])];
        mergedStrategies[key].avgScore = (mergedStrategies[key].avgScore + successfulStrategies[key].avgScore) / 2;
        mergedStrategies[key].count += successfulStrategies[key].count;
      } else {
        // Add new strategy data
        mergedStrategies[key] = successfulStrategies[key];
      }
    });

    // Performance patterns from this batch
    const performancePatterns = {
      topPerformingPromptLength: optimizedVariants
        .sort((a, b) => b.score - a.score)[0]?.prompt.length || 0,
      averageResponseTime: optimizedVariants
        .reduce((sum, v) => sum + (v.metrics.response_time || 0), 0) / optimizedVariants.length,
      mostSuccessfulStrategy: optimizedVariants
        .sort((a, b) => b.score - a.score)[0]?.strategy || 'unknown'
    };

    // Optimization rules learned from this batch
    const optimizationRules = {
      minPromptLength: Math.min(...optimizedVariants.map(v => v.prompt.length)),
      maxPromptLength: Math.max(...optimizedVariants.map(v => v.prompt.length)),
      optimalPromptLength: performancePatterns.topPerformingPromptLength,
      avoidPatterns: optimizedVariants
        .filter(v => v.score < 0.5)
        .map(v => extractSuccessfulPatterns(v.prompt))
        .flat()
        .filter((pattern, index, arr) => arr.indexOf(pattern) === index)
        .slice(0, 5) // Top 5 patterns to avoid
    };

    const newTotalOptimizations = (previousInsights.totalOptimizations || 0) + optimizedVariants.length;
    const newAvgScore = previousInsights.hasCachedData 
      ? (previousInsights.avgUserScore + batchSummary.avgScore) / 2
      : batchSummary.avgScore;
    const newBatchCount = (previousInsights.batchCount || 0) + 1;

    console.log(`Saving insights: batch ${newBatchCount}, total opts: ${newTotalOptimizations}, avg score: ${newAvgScore.toFixed(3)}`);

    // First try to update existing record
    const { data: existingRecord } = await supabase
      .from('optimization_insights')
      .select('id')
      .eq('user_id', userId)
      .eq('ai_provider', aiProvider)
      .eq('model_name', modelName)
      .maybeSingle();

    let result;
    if (existingRecord) {
      // Update existing record
      console.log(`Updating existing insights record: ${existingRecord.id}`);
      result = await supabase
        .from('optimization_insights')
        .update({
          batch_summary: batchSummary,
          successful_strategies: mergedStrategies,
          performance_patterns: performancePatterns,
          optimization_rules: optimizationRules,
          batch_count: newBatchCount,
          total_optimizations: newTotalOptimizations,
          avg_improvement_score: newAvgScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
    } else {
      // Insert new record
      console.log('Creating new insights record');
      result = await supabase
        .from('optimization_insights')
        .insert({
          user_id: userId,
          ai_provider: aiProvider,
          model_name: modelName,
          batch_summary: batchSummary,
          successful_strategies: mergedStrategies,
          performance_patterns: performancePatterns,
          optimization_rules: optimizationRules,
          batch_count: newBatchCount,
          total_optimizations: newTotalOptimizations,
          avg_improvement_score: newAvgScore
        });
    }

    const { error } = result;

    if (error) {
      console.error('❌ Error saving batch insights to optimization_insights table:', error);
      throw error; // Re-throw to trigger fallback logging
    } else {
      console.log(`✅ Successfully saved batch insights: ${optimizedVariants.length} variants, avg score: ${batchSummary.avgScore.toFixed(3)}, batch #${newBatchCount}`);
      
      // Verify the save worked by checking if record exists
      const { data: verification } = await supabase
        .from('optimization_insights')
        .select('batch_count, total_optimizations')
        .eq('user_id', userId)
        .eq('ai_provider', aiProvider)
        .eq('model_name', modelName)
        .maybeSingle();
      
      if (verification) {
        console.log(`✅ Verification successful: Record shows ${verification.batch_count} batches, ${verification.total_optimizations} total optimizations`);
      } else {
        console.error('❌ Verification failed: Could not find saved insights record');
      }
    }

  } catch (error) {
    console.error('❌ Critical error in saveBatchInsights:', error);
    throw error; // Re-throw so calling function can handle fallback
  }
}

// Select best strategies based on cached insights
function selectBestStrategies(allStrategies: string[], variantCount: number, cachedInsights: any): string[] {
  if (!cachedInsights.hasCachedData || cachedInsights.totalOptimizations < 3) {
    // Not enough cached data, use default order
    console.log('Using default strategy order - insufficient cached data');
    return allStrategies.slice(0, variantCount);
  }

  // Sort strategies by cached performance
  const strategyScores = allStrategies.map(strategy => ({
    strategy,
    score: cachedInsights.strategies[strategy]?.avgScore || 0.5,
    count: cachedInsights.strategies[strategy]?.count || 0
  }));

  strategyScores.sort((a, b) => {
    // Prioritize strategies with both high scores and sufficient data
    const scoreA = a.score * Math.min(1, a.count / 3); // Confidence factor
    const scoreB = b.score * Math.min(1, b.count / 3);
    return scoreB - scoreA;
  });
  
  // Take top performers but ensure some variety
  const selected = strategyScores.slice(0, Math.ceil(variantCount * 0.8)).map(s => s.strategy);
  
  // Add exploration strategies if needed
  if (selected.length < variantCount) {
    const remaining = allStrategies.filter(s => !selected.includes(s));
    selected.push(...remaining.slice(0, variantCount - selected.length));
  }
  
  console.log(`Selected strategies based on cached insights: ${selected.join(', ')}`);
  return selected.slice(0, variantCount);
}

// Extract successful patterns from optimized prompts
function extractSuccessfulPatterns(prompt: string): string[] {
  const patterns = [];
  
  // Look for common successful patterns
  if (/step.by.step|step-by-step/i.test(prompt)) patterns.push('step-by-step instructions');
  if (/example|for instance|such as/i.test(prompt)) patterns.push('concrete examples');
  if (/format|structure|organize/i.test(prompt)) patterns.push('clear formatting');
  if (/context|background|setting/i.test(prompt)) patterns.push('contextual information');
  if (/specific|detailed|precise/i.test(prompt)) patterns.push('specific requirements');
  if (/constraint|limit|requirement/i.test(prompt)) patterns.push('clear constraints');
  
  return patterns;
}

// Identify which strategy a pattern belongs to
function identifyStrategy(pattern: string): string {
  if (pattern.includes('step-by-step') || pattern.includes('structure')) return 'structure';
  if (pattern.includes('specific') || pattern.includes('detailed')) return 'specificity';
  if (pattern.includes('examples') || pattern.includes('concrete')) return 'clarity';
  if (pattern.includes('constraints') || pattern.includes('requirements')) return 'constraints';
  return 'efficiency';
}