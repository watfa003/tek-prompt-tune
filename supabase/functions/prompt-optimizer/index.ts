import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { handleSpeedMode } from './speed-mode-functions.ts';
import { getOutputTypeSystemPrompt, getOutputTypeGuidance, OUTPUT_TYPE_STRATEGIES, type OutputType } from './output-type-strategies.ts';
import { 
  scorePromptTested,
  scorePromptAndOutput,
  calculateTotalScore,
  detectPromptType,
  type CategoryScores,
  type PromptType
} from '../shared/master-grader.ts';
import { scoreCombined, calculatePromptScore } from '../shared/combined-grader.ts';
import { COMPILED_MASTER_PROMPT, COMPILED_STRATEGIES, type StrategyKey } from './schema-compiler.ts';

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

// Network safety: time out external AI calls so variants don't hang forever
// Increased to 45s to handle slower OpenAI responses
const REQUEST_TIMEOUT_MS = 45000;

// PrompTek V5 Elite - Now compiled from JSON schema for better maintainability
// See optimization-schema.ts for the source of truth
const PROMPTEK_MASTER_SYSTEM = COMPILED_MASTER_PROMPT;


// Optimization Strategies - Now compiled from JSON schema
// See optimization-schema.ts for the source of truth
const OPTIMIZATION_STRATEGIES = COMPILED_STRATEGIES;

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
      autoSave = true,
      speedMode = false, // NEW: Speed mode skips testing for 30% speedup
      attachedImages = [], // NEW: Array of base64 image data URLs for multimodal testing
      // New template functionality
      isTemplate = false,
      templateId = null,
      saveAsTemplate = false,
      templateTitle = '',
      templateDescription = '',
      templateCategory = 'custom',
      // Progress tracking
      sessionKey = null
    } = await req.json();

    console.log('prompt-optimizer received:', { maxTokens, modelName, aiProvider, temperature, variants, outputType, mode, isTemplate, influenceWeight, speedMode, attachedImagesCount: attachedImages?.length || 0 });
    
    // Log taskDescription to verify document content is being received
    console.log('📥 taskDescription received:', {
      length: taskDescription?.length || 0,
      hasDocumentContent: taskDescription?.includes('[Attached document:') || taskDescription?.includes('[Attached file:'),
      hasDocumentInstructions: taskDescription?.includes('[DOCUMENT CONTEXT INSTRUCTIONS'),
      preview: taskDescription?.substring(0, 800)
    });

    if (!originalPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Original prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze prompt to determine if it's procedural/instructional
    const analyzePromptType = (prompt: string): boolean => {
      // Keywords that indicate procedural/instructional content
      const proceduralKeywords = [
        'how to', 'step', 'steps', 'tutorial', 'guide', 'process', 'procedure', 
        'instructions', 'explain', 'teach', 'demonstrate', 'walkthrough',
        'first', 'then', 'next', 'finally', 'follow', 'method', 'approach',
        'setup', 'configure', 'install', 'implement', 'create a', 'build a',
        'sequence', 'order', 'stage', 'phase', 'workflow'
      ];
      
      const promptLower = prompt.toLowerCase();
      
      // Check if prompt contains procedural keywords
      const hasProceduralKeywords = proceduralKeywords.some(keyword => 
        promptLower.includes(keyword)
      );
      
      // Check for numbered lists or bullet point patterns
      const hasNumberedList = /\d+\.|step \d+|\d+\)/i.test(prompt);
      
      // Check for imperative verbs that suggest instructions
      const imperativePattern = /\b(create|build|make|develop|design|setup|configure|install|write|explain|describe|outline|list)\b/i;
      const hasImperativeVerbs = imperativePattern.test(prompt);
      
      // Not procedural if it's clearly creative/conversational
      const creativeKeywords = ['story', 'poem', 'creative', 'imagine', 'pretend', 'greeting', 'hello', 'opinion', 'feel', 'think about'];
      const isCreative = creativeKeywords.some(keyword => promptLower.includes(keyword));
      
      return (hasProceduralKeywords || hasNumberedList || hasImperativeVerbs) && !isCreative;
    };

    // Enhance prompt if it's procedural/instructional
    let enhancedPrompt = originalPrompt;
    const isProcedural = analyzePromptType(originalPrompt);
    
    if (isProcedural) {
      enhancedPrompt = `${originalPrompt}\n\nEnsure the optimized prompt includes clear step-by-step or bullet-point guidance, and instructs the model to verify completeness and clarity for each step.`;
      console.log('📋 Detected procedural prompt - adding structural guidance');
    } else {
      console.log('💭 Detected creative/conversational prompt - no structural guidance needed');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const startTime = Date.now();

    // Handle Speed Mode
    if (mode === 'speed') {
      return await handleSpeedMode(supabase, { 
        originalPrompt: enhancedPrompt, 
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
        influenceWeight,
        autoSave,
        sessionKey // pass through for progress tracking
      });
    }

    // Create initial prompt record in background
    let promptRecord: any = { id: null };
    const createPromptRecord = async () => {
      if (!autoSave) return { id: null };
      return await supabase
        .from('prompts')
        .insert({
          user_id: userId,
          original_prompt: enhancedPrompt,
          task_description: taskDescription,
          ai_provider: aiProvider,
          model_name: modelName,
          output_type: outputType,
          status: 'processing'
        })
        .select()
        .single();
    };

    // Generate session key for progress tracking (use provided or create new)
    const progressSessionKey = sessionKey || `${userId}_${Date.now()}`;
    
    // Helper function to update progress in database
    // Uses UPSERT for reliability - one row per session, updated in place
    const updateProgress = async (progress: number, step: number, message: string) => {
      try {
        const { error } = await supabase
          .from('optimization_progress')
          .upsert({
            user_id: userId,
            session_key: progressSessionKey,
            progress,
            step,
            message,
            updated_at: new Date().toISOString()
          }, { onConflict: 'session_key,user_id' });
        
        if (error) {
          console.error(`❌ Progress update error: ${error.message}`);
        } else {
          console.log(`📊 Progress: ${progress}% - ${message}`);
        }
      } catch (error) {
        console.error('Progress update failed:', error);
      }
    };

    // Initialize progress immediately - Step 1: Creating variants
    await updateProgress(0, 1, 'Starting optimization...');
    
    // Small delay to ensure initial progress is written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await updateProgress(5, 1, 'Creating variants...');
    
    // Start prompt record creation
    const promptRecordPromise = createPromptRecord();

    // Load cached optimization insights instead of checking all history
    const cachedInsights = await loadOptimizationInsights(supabase, userId, aiProvider, modelName);
    
    // Detect prompt type to determine optimization approach
    const promptType = detectPromptType(enhancedPrompt);
    console.log(`🔍 Detected prompt type: ${promptType}`);
    
    // Generate optimized variants in parallel for maximum speed
    // Filter strategies based on their conditional logic AND prompt type
    const allAvailableStrategies = Object.keys(OPTIMIZATION_STRATEGIES).filter(key => {
      const strategy = OPTIMIZATION_STRATEGIES[key as keyof typeof OPTIMIZATION_STRATEGIES];
      
      // Check if strategy has a condition function, and if so, test it
      if (strategy.condition && typeof strategy.condition === 'function') {
        if (!strategy.condition(originalPrompt)) return false;
      }
      
      // Filter strategies based on prompt type to avoid bloat
      if (promptType === 'creative') {
        // For creative prompts: Focus on intent, adaptability, clarity - avoid rigid structure/constraints
        const creativeStrategies = ['clarity', 'intent', 'adaptability', 'specificity'];
        return creativeStrategies.includes(key);
      }
      // For complex prompts: Use ALL strategies to maximize score
      return true;
    });
    
    console.log(`📋 Available strategies for ${promptType} prompt: [${allAvailableStrategies.join(', ')}]`);
    
    // Get ALL strategies sorted by performance for this specific LLM
    const allStrategiesSorted = selectBestStrategies(allAvailableStrategies, 0, cachedInsights, aiProvider, modelName);
    const variantCount = Math.min(Math.max(Number(variants) || 1, 1), allStrategiesSorted.length);
    
    // CRITICAL: Always include top 2 best performers for this specific LLM, then rotate through others for testing
    const top2BestForLLM = allStrategiesSorted.slice(0, 2);
    const remainingStrategies = allStrategiesSorted.slice(2);
    
    // Rotate through remaining strategies using a per-request deterministic offset
    const rotationOffset = (() => {
      const key = `${userId}:${aiProvider}:${modelName}:${Date.now()}`;
      let h = 0;
      for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i);
      return Math.abs(h) % Math.max(1, remainingStrategies.length);
    })();
    const rotatedRemaining = [...remainingStrategies.slice(rotationOffset), ...remainingStrategies.slice(0, rotationOffset)];
    
    // Combine: always top 2 + rotated remaining, up to variant count
    const selectedStrategies = [
      ...top2BestForLLM,
      ...rotatedRemaining
    ].slice(0, variantCount);
    
    console.log(`🎯 Strategy selection for ${aiProvider}/${modelName}:`);
    console.log(`   ✅ Top 2 best: [${top2BestForLLM.join(', ')}]`);
    console.log(`   🔄 Testing rotation: [${rotatedRemaining.slice(0, Math.max(0, variantCount - 2)).join(', ')}]`);
    console.log(`   📊 Final selection (${selectedStrategies.length}): [${selectedStrategies.join(', ')}]`);
    
    // Test only the requested number of strategies, prioritized by performance
    // Track completed variants for monotonic progress (prevents backwards progress)
    // Use arrays to track which specific variants have started/completed to maintain order
    const variantStartOrder: number[] = [];
    const variantCompletionStatus: boolean[] = new Array(selectedStrategies.length).fill(false);
    let totalCompleted = 0;
    const totalVariants = selectedStrategies.length;
    
    const variantPromises = selectedStrategies.map(async (strategyKey, variantIndex) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey as keyof typeof OPTIMIZATION_STRATEGIES];
      
      try {
        // Track START order immediately
        variantStartOrder.push(variantIndex);
        const startPosition = variantStartOrder.length;
        const strategyName = strategy.name;
        
        // Update progress based on START position (5-35%)
        const creationProgress = 5 + Math.floor((startPosition / totalVariants) * 30);
        await updateProgress(creationProgress, 1, `Creating variant ${startPosition} of ${totalVariants} (${strategyName})...`);
        // Get model-friendly name for the target model
        const targetModelName = getModelFriendlyName(aiProvider, modelName);
        const outputStrategy = OUTPUT_TYPE_STRATEGIES[outputType as OutputType];
        
        // Build compact JSON-based optimization prompt
        // The strategy.systemPrompt is now pure JSON - wrap with minimal instructions
        const meta: any = {
          model: targetModelName,
          outputType,
          outputHint: outputStrategy.description
        };
        
        if (taskDescription) {
          meta.context = taskDescription;
          
          // Check if document content is attached and add special handling instructions
          if (taskDescription.includes('[Attached document:') || taskDescription.includes('[Attached file:')) {
            meta.documentInstructions = 'IMPORTANT: Attached document content should be incorporated into the optimized prompt. Instruct the AI to reference, analyze, summarize, or use the document content as source material for the response. The document provides context that should inform the output even if not explicitly requested.';
          }
        }
        // Only add maxTokens to meta if user explicitly set it (not null/undefined/0)
        if (maxTokens && maxTokens > 0) {
          meta.maxTokens = maxTokens;
        }
        
        // Add influence if set
        if (influence?.trim() && influenceWeight > 0) {
          meta.influence = { template: influence, weight: influenceWeight };
        }
        
        // Add creativity guidance based on temperature
        const temp = typeof temperature === 'number' ? temperature : 0.7;
        meta.creativity = temp <= 0.3 ? 'deterministic' : temp < 0.7 ? 'balanced' : 'creative';
        
        // Add cached insights if available
        const strategyInsights = cachedInsights.strategies[strategyKey];
        if (strategyInsights?.patterns?.length > 0) {
          meta.patterns = strategyInsights.patterns.slice(0, 3);
        }
        
        // Compact prompt format: JSON config + minimal wrapper
        // Build TASK instruction with maxTokens guidance ONLY if user explicitly set it
        const maxTokensTask = (maxTokens && maxTokens > 0)
          ? ` CRITICAL: The user has specified a max token limit of ${maxTokens}. You MUST add an explicit instruction in the optimized prompt telling the target AI to keep its response under approximately ${maxTokens} tokens (e.g., "Keep your response under ${maxTokens} tokens" or "Limit output to approximately ${maxTokens} tokens").`
          : '';
        
        let optimizationPrompt = `CONFIG:${strategy.systemPrompt}

META:${JSON.stringify(meta)}

INPUT:"${enhancedPrompt}"

TASK:Optimize INPUT using CONFIG. Apply strategy "${strategy.name}". Preserve intent. Output ${outputType}.${maxTokensTask}
OUTPUT:<optimized_prompt>RESULT</optimized_prompt>`;
        const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || modelName;
        // Ensure higher token budget for Google to avoid MAX_TOKENS errors with long prompts
        const optimizationTokens = aiProvider === 'google' 
          ? (maxTokens ? Math.max(2048, Math.min(maxTokens, 8192)) : 4096)
          : (maxTokens ? Math.max(1024, Math.min(maxTokens, 4096)) : 2048);
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
        
        // Validate and repair if the AI returned an answer instead of a prompt
        if (optimizedPrompt && looksLikeAnswer(optimizedPrompt, enhancedPrompt)) {
          console.log(`[${strategyKey}] ⚠️ Validator failed - looks like answer, triggering repair...`);
          console.log(`[${strategyKey}] Preview:`, optimizedPrompt.slice(0, 180));
          
          try {
            const repairPrompt = `You produced OUTPUT, not a PROMPT. Rewrite as an instruction prompt that preserves the original intent. Do not include JSON, code fences, sample output, or example payloads. Return only the prompt text that tells an AI what to do.

Fix this - it should be a prompt instruction, not an answer:

${optimizedPrompt}`;

            const repairedRaw = await callAIProvider(
              aiProvider,
              optimizationModel,
              repairPrompt,
              1500,
              0.3
            );
            
            if (repairedRaw) {
              const repairedPrompt = repairedRaw.toString().trim();
              console.log(`[${strategyKey}] ✅ Repair successful`);
              console.log(`[${strategyKey}] Repaired preview:`, repairedPrompt.slice(0, 180));
              optimizedPrompt = repairedPrompt;
            }
          } catch (repairError) {
            console.error(`[${strategyKey}] Repair failed:`, repairError);
          }
        }
        
        if (!optimizedPrompt || optimizedPrompt.trim().length === 0) {
          console.error(`[${strategyKey}] ⚠️ Optimization failed - using enhanced prompt as fallback`);
          // Don't return null - use the enhanced prompt with a penalty instead
          optimizedPrompt = enhancedPrompt;
        }

        // Test the optimized prompt with user's selected model (ONLY if not in speed mode)
        let actualResponse = '';
        let actualScore = 0;
        
        if (!speedMode) {
          // Mark this variant as completed and count total
          variantCompletionStatus[variantIndex] = true;
          totalCompleted++;
          
          // Update to testing phase with DETAILED messages using START position
          const testProgressPercent = 35 + Math.floor((totalCompleted / totalVariants) * 35);
          await updateProgress(testProgressPercent, 2, `Testing variant ${startPosition} of ${totalVariants} (${strategyName})...`);
          
          try {
            console.log(`Testing optimized prompt with user's selected model: ${modelName}${attachedImages?.length ? ` with ${attachedImages.length} image(s)` : ''}`);
            // Use 1024 tokens for testing when no limit is set (faster responses), otherwise respect user's limit
            const testTokens = maxTokens ? Math.max(512, Math.min(maxTokens, 4096)) : 1024;
            const testResponse = await callAIProvider(
              aiProvider,
              modelName,
              optimizedPrompt,
              testTokens,
              temperature,
              attachedImages // Pass images for multimodal testing
            );
          
            if (testResponse) {
              actualResponse = testResponse;
              // Add progress update BEFORE grading
              const gradingProgressPercent = 70 + Math.floor((totalCompleted / totalVariants) * 15);
              await updateProgress(gradingProgressPercent, 2, `Grading variant ${startPosition} of ${totalVariants} (${strategyName})...`);
              
              // Score based on the actual response from the user's selected model
              // Use fast evaluation for very long responses (over 2 pages)
              const responseWords = testResponse.split(' ').length;
              if (responseWords > 1500) { // Roughly 2 pages
                console.log(`Using fast skim evaluation for long response (${responseWords} words)`);
                actualScore = fastSkimEvaluation(testResponse, strategy.weight);
              } else {
                const evalResult = await evaluateOutput(optimizedPrompt, testResponse, openAIApiKey);
                actualScore = evalResult.score; // Already on 0-10 scale
               }
               console.log(`Actual response scored: ${actualScore} for strategy: ${strategyKey}`);
            } else {
              // If no response, re-score the optimized prompt but ensure it's actually optimized
              if (optimizedPrompt.length > originalPrompt.length * 0.8) {
                try {
                  const evalResult = await evaluateOutput(optimizedPrompt, `Optimized using ${strategy.name} strategy`, openAIApiKey);
                  actualScore = evalResult.score; // Already on 0-10 scale
                  actualResponse = `Successfully optimized using ${strategy.name} strategy`;
                } catch (evalError) {
                  console.error('Evaluation error, using fallback:', evalError);
                  actualScore = strategy.weight * 0.7;
                  actualResponse = `Successfully optimized using ${strategy.name} strategy`;
                }
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
              try {
                const evalResult = await evaluateOutput(optimizedPrompt, `Optimization completed (fallback)`, openAIApiKey);
                actualScore = evalResult.score / 10;
                actualResponse = `Optimization completed using ${strategy.name} strategy (fallback)`;
              } catch (evalError) {
                console.error('Evaluation error in catch block:', evalError);
                actualScore = strategy.weight * 0.6;
                actualResponse = `Optimization completed using ${strategy.name} strategy (fallback)`;
              }
            } else {
              // If optimization failed completely, return a lower score
              actualScore = strategy.weight * 0.2;
              actualResponse = `Limited optimization using ${strategy.name} strategy`;
            }
         }
        } else {
          // Speed mode: Use static evaluation based on actual prompt quality
          console.log(`[Speed Mode] Skipping testing for ${strategyKey}, using static analysis`);
          
          // Track completion for progress
          variantCompletionStatus[variantIndex] = true;
          totalCompleted++;
          
          // Update progress in speed mode (35-85%)
          const speedProgressPercent = 35 + Math.floor((totalCompleted / totalVariants) * 50);
          await updateProgress(speedProgressPercent, 2, `Evaluating variants... (${totalCompleted}/${totalVariants})`);
          
          try {
            const staticEval = scorePromptAndOutput(optimizedPrompt, "");
            const normalizedScore = staticEval.finalScore / 10; // Convert 0-10 to 0-1
            actualScore = strategy.weight * normalizedScore;
            actualResponse = `Optimized using ${strategy.name} strategy (static score: ${staticEval.finalScore.toFixed(1)})`;
            console.log(`[Speed Mode Static] ${strategyKey}: ${staticEval.finalScore.toFixed(1)} → weighted: ${actualScore}`);
          } catch (staticError) {
            console.error(`Static evaluation failed for ${strategyKey}:`, staticError);
            actualScore = strategy.weight * 0.65; // Conservative fallback
            actualResponse = `Optimized using ${strategy.name} strategy (fallback)`;
          }
        }

        return {
          prompt: optimizedPrompt,
          strategy: strategy.name,
          strategyKey: strategyKey,
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

    // Get prompt record (respect autoSave)
    if (autoSave) {
      promptRecord = promptRecordResult.status === 'fulfilled' ? promptRecordResult.value?.data : null;
      if (!promptRecord) {
        throw new Error('Failed to create prompt record');
      }
    } else {
      // When autoSave is off, we intentionally skip creating a DB record
      promptRecord = { id: null };
    }

    // Update progress - finalizing (90%)
    await updateProgress(90, 3, 'Selecting best variant...');
    
    // Filter successful variants
    let optimizedVariants = variantResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (optimizedVariants.length === 0) {
      console.warn('No optimized variants generated; using baseline fallback');
      optimizedVariants = [{
        prompt: enhancedPrompt,
        strategy: 'Baseline',
        strategyKey: 'baseline',
        score: 0.4,
        response: 'Using original prompt as fallback due to optimization failure',
        metrics: {
          tokens_used: enhancedPrompt.length,
          response_length: 0,
          prompt_length: originalPrompt.length,
          strategy_weight: 0,
          tested_with_target_model: false
        }
      }];
    }

    // Find best variant
    let bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    // Update progress - self-refinement pass (92%)
    await updateProgress(92, 3, 'Self-refining best variant...');
    
    // Self-refinement pass: critique and improve the best variant
    try {
      const refinedVariant = await selfRefineOptimizedPrompt(
        bestVariant.prompt,
        originalPrompt,
        aiProvider,
        modelName,
        outputType,
        maxTokens,
        temperature
      );
      
      if (refinedVariant && refinedVariant.score > bestVariant.score) {
        console.log(`🔄 Self-refinement improved score: ${bestVariant.score.toFixed(3)} → ${refinedVariant.score.toFixed(3)}`);
        bestVariant = {
          ...bestVariant,
          prompt: refinedVariant.prompt,
          score: refinedVariant.score,
          strategy: `${bestVariant.strategy} + Self-Refined`,
          metrics: {
            ...bestVariant.metrics,
            self_refined: true,
            original_score: bestVariant.score,
            refinement_improvement: refinedVariant.score - bestVariant.score
          }
        };
      } else {
        console.log(`✅ Best variant already optimal, no refinement needed`);
      }
    } catch (refineError) {
      console.error('Self-refinement failed, keeping original best variant:', refineError);
    }

    const processingTime = Date.now() - startTime;
    
    // Update progress to 95% - best variant selected
    await updateProgress(95, 3, 'Finalizing results...');
    
    // CRITICAL: Update progress to 100% BEFORE background tasks
    // This ensures the UI always shows completion even if background tasks fail
    await updateProgress(100, 3, 'Done!');
    console.log('✅ Progress updated to 100% - optimization complete');
    
    // Background task for database updates and optimization insights (don't block response)
    const backgroundUpdates = async () => {
      try {
        // Store optimization history (only when autoSave is enabled and we have a prompt id)
        let historyPromises: Promise<any>[] = [];
        if (autoSave && promptRecord?.id) {
          historyPromises = optimizedVariants.map(variant => 
            supabase.from('optimization_history').insert({
              user_id: userId,
              prompt_id: promptRecord.id,
              variant_prompt: variant.prompt,
              ai_response: variant.response,
              score: variant.score,
              metrics: { ...variant.metrics, strategy: variant.strategy, optimization_strategy: variant.strategy },
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
                bestStrategy: bestVariant.strategy,
                total_variants: optimizedVariants.length,
                processing_time_ms: processingTime,
                processingTimeMs: processingTime,
                average_score: optimizedVariants.reduce((sum, v) => sum + v.score, 0) / optimizedVariants.length
              },
              variants_generated: optimizedVariants.length,
              status: 'completed'
            })
            .eq('id', promptRecord.id);
        }


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
          rating: Math.max(1, Math.min(Math.round(bestVariant.score * 5), 5)), // Convert 0-1 score to 1-5 rating
          tags: [aiProvider, modelName, bestVariant.strategy.toLowerCase().replace(/\s+/g, '-')]
        });
        console.log('✅ Template saved successfully');
      } catch (templateError) {
        console.error('❌ Error saving template:', templateError);
      }
    }
    
    // Note: Progress already updated to 100% before background tasks
    // Return immediate response with sessionKey for progress tracking
    const response = {
      promptId: autoSave && promptRecord?.id ? promptRecord.id : null,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      bestScore: bestVariant.score,
      variants: optimizedVariants,
      templateSaved: saveAsTemplate && templateTitle,
      sessionKey: progressSessionKey, // Include session key for progress tracking
      summary: {
        improvementScore: Math.round(bestVariant.score * 10), // Already 0-10, just round to whole number
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


// Helper function to get model-friendly name
function getModelFriendlyName(provider: string, model: string): string {
  const modelMap: Record<string, Record<string, string>> = {
    openai: {
      'gpt-5-2025-08-07': 'GPT-5',
      'gpt-5-mini-2025-08-07': 'GPT-5 Mini',
      'gpt-5-nano-2025-08-07': 'GPT-5 Nano',
      'gpt-4.1-2025-04-14': 'GPT-4.1',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini'
    },
    anthropic: {
      'claude-opus-4-1-20250805': 'Claude Opus 4.1',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku'
    },
    mistral: {
      'mistral-large': 'Mistral Large',
      'mistral-medium': 'Mistral Medium'
    },
    groq: {
      'llama-3.1-8b': 'Llama 3.1 8B'
    },
    google: {
      'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro'
    }
  };

  return modelMap[provider]?.[model] || model;
}


// Self-refinement function: critique and improve the best variant
async function selfRefineOptimizedPrompt(
  optimizedPrompt: string,
  originalPrompt: string,
  aiProvider: string,
  modelName: string,
  outputType: string,
  maxTokens: number | null,
  temperature: number
): Promise<{ prompt: string; score: number } | null> {
  try {
    const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || modelName;
    
    // Import self_refine config from schema
    const selfRefineConfig = {
      instruction: "Critique the optimized prompt against all 8 pillars (clarity, specificity, efficiency, structure, constraints, elaboration, intent, adaptability). Identify the 1-3 weakest areas. Rewrite to address ONLY those weaknesses while preserving all strengths.",
      focus: ["lowest scoring pillar", "vague language", "missing constraints", "unclear success criteria", "weak role assignment"],
      rules: [
        "NEVER remove existing strengths",
        "Focus on 1-3 targeted fixes, not wholesale rewrite",
        "If already exceptional, return unchanged",
        "Preserve the role assignment ('You are a [role]')",
        "Maintain same output type and structure"
      ]
    };
    
    const selfRefinePrompt = `TASK: Self-critique and refine this optimized prompt.

ORIGINAL USER REQUEST:
"${originalPrompt}"

CURRENT OPTIMIZED PROMPT:
"${optimizedPrompt}"

SELF-REFINE INSTRUCTIONS:
${JSON.stringify(selfRefineConfig)}

ANALYSIS STEPS:
1. Score each of the 8 pillars (clarity, specificity, efficiency, structure, constraints, elaboration, intent, adaptability) from 1-10
2. Identify the 1-3 WEAKEST pillars (score < 9)
3. For each weak pillar, identify the SPECIFIC text causing the weakness
4. Rewrite ONLY the weak sections to address those specific issues
5. Preserve ALL existing strengths - do not remove or weaken anything that works

OUTPUT TYPE: ${outputType}

CRITICAL RULES:
- If ALL pillars are already ≥9, return the prompt UNCHANGED
- Never remove the "You are a [role]" opening
- Focus on targeted surgical fixes, NOT wholesale rewrites
- The refined prompt should be equal or shorter in length (more efficient)

Return ONLY the refined prompt wrapped in: <refined_prompt>RESULT</refined_prompt>`;

    const refinedRaw = await callAIProvider(
      aiProvider,
      optimizationModel,
      selfRefinePrompt,
      maxTokens ? Math.max(1024, Math.min(maxTokens, 4096)) : 2048,
      Math.max(0.2, temperature * 0.5) // Lower temperature for refinement (more deterministic)
    );
    
    if (!refinedRaw) {
      console.log('Self-refinement returned null, keeping original');
      return null;
    }
    
    // Extract refined prompt from response
    const refinedMatch = refinedRaw.match(/<refined_prompt>([\s\S]*?)<\/refined_prompt>/i);
    const refinedPrompt = refinedMatch ? refinedMatch[1].trim() : refinedRaw.trim();
    
    // Validate: refined prompt should still have role assignment
    if (!refinedPrompt.toLowerCase().includes('you are')) {
      console.log('Refined prompt missing role assignment, keeping original');
      return null;
    }
    
    // Validate: refined prompt shouldn't be drastically different in length (within 50%)
    const lengthRatio = refinedPrompt.length / optimizedPrompt.length;
    if (lengthRatio < 0.5 || lengthRatio > 1.5) {
      console.log(`Refined prompt length ratio ${lengthRatio.toFixed(2)} out of bounds, keeping original`);
      return null;
    }
    
    // Quick score the refined prompt using static evaluation
    const { scorePromptAndOutput } = await import('../shared/master-grader.ts');
    const refinedEval = scorePromptAndOutput(refinedPrompt, "");
    const refinedScore = refinedEval.finalScore / 10; // Normalize to 0-1
    
    console.log(`🔍 Self-refinement evaluation: ${refinedEval.finalScore.toFixed(1)}/10`);
    
    return {
      prompt: refinedPrompt,
      score: refinedScore
    };
  } catch (error) {
    console.error('Self-refinement error:', error);
    return null;
  }
}


// Optimized AI provider calls
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number, images: string[] = []): Promise<string | null> {
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
        return await callOpenAICompatible(providerConfig, modelConfig.name, prompt, maxTokens, temperature, images);
      
      case 'anthropic':
        return await callAnthropic(providerConfig, modelConfig.name, prompt, maxTokens, images);
      
      case 'google':
        return await callGoogle(providerConfig, modelConfig.name, prompt, maxTokens, images);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    // Return null to allow other variants to continue
    return null;
  }
}

async function callOpenAICompatible(providerConfig: any, model: string, prompt: string, maxTokens: number, temperature: number, images: string[] = []): Promise<string> {
  console.log(`🟢 OpenAI-compatible API call: ${model} with maxTokens: ${maxTokens}${images.length ? `, ${images.length} image(s)` : ''}`);
  
  const isNewerModel = /^(gpt-5|gpt-4\.1|o3|o4)/i.test(model);
  
  // Build message content - multimodal if images are provided
  let messageContent: any;
  if (images.length > 0) {
    messageContent = [
      { type: 'text', text: prompt },
      ...images.map(img => ({
        type: 'image_url',
        image_url: { url: img.startsWith('data:') ? img : `data:image/png;base64,${img}` }
      }))
    ];
    console.log(`📷 Including ${images.length} image(s) in OpenAI request`);
  } else {
    messageContent = prompt;
  }
  
  const payload: any = {
    model: model,
    messages: [{ role: 'user', content: messageContent }],
  };
  
  if (isNewerModel) {
    payload.max_completion_tokens = maxTokens;
    // Newer models don't support temperature parameter - defaults to 1.0
  } else {
    payload.max_tokens = maxTokens;
    // Ignore temperature; style is enforced via prompt wording
  }

  console.log('📦 OpenAI Payload:', { model, isNewerModel, maxTokens, hasImages: images.length > 0 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeout);

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

async function callAnthropic(providerConfig: any, model: string, prompt: string, maxTokens: number, images: string[] = []): Promise<string> {
  console.log(`🟣 Anthropic API call: ${model} with maxTokens: ${maxTokens}${images.length ? `, ${images.length} image(s)` : ''}`);
  
  // Build message content - multimodal if images are provided
  let messageContent: any;
  if (images.length > 0) {
    messageContent = [
      { type: 'text', text: prompt },
      ...images.map(img => {
        // Extract base64 data and media type from data URL
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        const mediaType = match ? match[1] : 'image/png';
        const base64Data = match ? match[2] : img;
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        };
      })
    ];
    console.log(`📷 Including ${images.length} image(s) in Anthropic request`);
  } else {
    messageContent = prompt;
  }
  
  console.log('📦 Anthropic Payload:', { model, maxTokens, hasImages: images.length > 0 });
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
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
      messages: [{ role: 'user', content: messageContent }],
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  console.log(`📡 Response status: ${response.status} for model: ${model}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Anthropic API error (${response.status}):`, errorText);
    throw new Error(`Anthropic API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Anthropic API success: ${model}`);
  return data.content[0].text;
}

async function callGoogle(providerConfig: any, model: string, prompt: string, maxTokens: number, images: string[] = []): Promise<string> {
  console.log(`🔵 Google API call: ${model} with maxTokens: ${maxTokens}${images.length ? `, ${images.length} image(s)` : ''}`);
  
  // Build parts array - multimodal if images are provided
  const parts: any[] = [{ text: prompt }];
  
  if (images.length > 0) {
    for (const img of images) {
      // Extract base64 data and media type from data URL
      const match = img.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/png';
      const base64Data = match ? match[2] : img;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }
    console.log(`📷 Including ${images.length} image(s) in Google request`);
  }
  
  console.log('📦 Google Payload:', { model, maxOutputTokens: maxTokens, hasImages: images.length > 0 });
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const response = await fetch(`${providerConfig.baseUrl}/${model}:generateContent?key=${providerConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: parts
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
      }
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  console.log(`📡 Response status: ${response.status} for model: ${model}`);

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
  
  // Handle MAX_TOKENS gracefully - retry with shorter prompt or higher token limit
  if (data.candidates[0].finishReason === 'MAX_TOKENS' && 
      (!data.candidates[0].content?.parts || data.candidates[0].content.parts.length === 0)) {
    console.error('❌ Google API hit MAX_TOKENS before generating output. Prompt too long or maxTokens too low.');
    console.error('Candidate:', JSON.stringify(data.candidates[0]));
    throw new Error('Google API exhausted token budget - prompt may be too long or output limit too low');
  }
  
  if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('❌ Google API response has no content parts:', JSON.stringify(data.candidates[0]));
    throw new Error('Google API returned no content parts');
  }
  
  console.log(`✅ Google API success: ${model}`);
  return data.candidates[0].content.parts[0].text;
}

// AI-powered evaluation for optimizer - uses combined grading for speed
async function evaluateOutput(
  prompt: string,
  output: string,
  openAIKey?: string
): Promise<{ score: number; categoryScores: CategoryScores }> {
  
  try {
    // Use combined grader for single API call instead of 2 separate calls
    const result = await scoreCombined(prompt, output, openAIKey);
    
    // Calculate prompt score using combined grader's scoring
    const promptScore = calculatePromptScore(result.promptScores);
    
    // Use the combined output score (average of quality and intent alignment)
    const outputScore = (result.outputQuality + result.outputIntentAlignment) / 2;
    
    // 50/50 weighted average
    const overallScore = Math.round(((promptScore * 0.5) + (outputScore * 0.5)) * 10) / 10;
    
    console.log('✅ Combined grading complete:', {
      promptScore: promptScore.toFixed(1),
      outputQuality: result.outputQuality.toFixed(1),
      outputAlignment: result.outputIntentAlignment.toFixed(1),
      overallScore: overallScore.toFixed(1)
    });

    return {
      score: overallScore,
      categoryScores: result.promptScores
    };
  } catch (error) {
    console.error('Combined grading failed, using fallback:', error);
    const result = scorePromptAndOutput(prompt, output);
    const promptScore = calculateTotalScore(result.scores);
    console.log('⚠️ Using fallback rule-based scoring in optimizer');
    
    return {
      score: promptScore,
      categoryScores: result.scores
    };
  }
}

// Removed old evaluation functions - now using master-grader.ts unified scoring

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

    // Extract successful strategies from this batch WITH PER-LLM TRACKING
    const llmKey = `${aiProvider}_${modelName}`;
    const successfulStrategies: any = {};
    
    optimizedVariants.forEach(variant => {
      if (variant.score > 0.7) {
        const patterns = extractSuccessfulPatterns(variant.prompt);
        const strategyKey = (variant.strategyKey ?? identifyStrategy(variant.strategy));
        
        if (!successfulStrategies[strategyKey]) {
          successfulStrategies[strategyKey] = { 
            patterns: [], 
            scores: [], 
            count: 0,
            byLLM: {} // Track performance per LLM
          };
        }
        
        successfulStrategies[strategyKey].patterns.push(...patterns);
        successfulStrategies[strategyKey].scores.push(variant.score);
        successfulStrategies[strategyKey].count++;
        
        // Track LLM-specific performance
        if (!successfulStrategies[strategyKey].byLLM[llmKey]) {
          successfulStrategies[strategyKey].byLLM[llmKey] = { scores: [], count: 0 };
        }
        successfulStrategies[strategyKey].byLLM[llmKey].scores.push(variant.score);
        successfulStrategies[strategyKey].byLLM[llmKey].count++;
      }
    });

    
    // Calculate averages for successful strategies (overall and per-LLM)
    Object.keys(successfulStrategies).forEach(key => {
      const strategy = successfulStrategies[key];
      strategy.avgScore = strategy.scores.reduce((sum: number, s: number) => sum + s, 0) / strategy.scores.length;
      strategy.patterns = [...new Set(strategy.patterns)]; // Remove duplicates
      
      // Calculate per-LLM averages
      Object.keys(strategy.byLLM).forEach(llm => {
        const llmData = strategy.byLLM[llm];
        llmData.avgScore = llmData.scores.reduce((sum: number, s: number) => sum + s, 0) / llmData.scores.length;
        delete llmData.scores; // Clean up
      });
      
      delete strategy.scores; // Clean up overall scores
    });

    // Merge with previous insights, preserving per-LLM data
    const mergedStrategies = { ...previousInsights.strategies };
    Object.keys(successfulStrategies).forEach(key => {
      if (mergedStrategies[key]) {
        // Update existing strategy data
        mergedStrategies[key].patterns = [...new Set([...mergedStrategies[key].patterns, ...successfulStrategies[key].patterns])];
        mergedStrategies[key].avgScore = (mergedStrategies[key].avgScore + successfulStrategies[key].avgScore) / 2;
        mergedStrategies[key].count += successfulStrategies[key].count;
        
        // Merge per-LLM data
        if (!mergedStrategies[key].byLLM) {
          mergedStrategies[key].byLLM = {};
        }
        Object.keys(successfulStrategies[key].byLLM).forEach(llm => {
          if (mergedStrategies[key].byLLM[llm]) {
            // Average with existing LLM data
            const existing = mergedStrategies[key].byLLM[llm];
            const newData = successfulStrategies[key].byLLM[llm];
            existing.avgScore = (existing.avgScore + newData.avgScore) / 2;
            existing.count += newData.count;
          } else {
            // Add new LLM data
            mergedStrategies[key].byLLM[llm] = successfulStrategies[key].byLLM[llm];
          }
        });
      } else {
        // Add new strategy data
        mergedStrategies[key] = successfulStrategies[key];
      }
    });

    // Performance patterns from this batch
    const performancePatterns = {
      topPerformingPromptLength: optimizedVariants
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Tiebreaker: prefer fewer tokens
          return (a.metrics?.tokens_used || 0) - (b.metrics?.tokens_used || 0);
        })[0]?.prompt.length || 0,
      averageResponseTime: optimizedVariants
        .reduce((sum, v) => sum + (v.metrics.response_time || 0), 0) / optimizedVariants.length,
      mostSuccessfulStrategy: optimizedVariants
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Tiebreaker: prefer fewer tokens
          return (a.metrics?.tokens_used || 0) - (b.metrics?.tokens_used || 0);
        })[0]?.strategy || 'unknown'
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

// Select and prioritize strategies based on cached insights
// Returns ALL strategies but sorted by performance (best first)
function selectBestStrategies(
  allStrategies: string[], 
  variantCount: number, 
  cachedInsights: any, 
  aiProvider?: string, 
  modelName?: string
): string[] {
  if (!cachedInsights.hasCachedData || cachedInsights.totalOptimizations < 3) {
    // Not enough cached data, return all strategies in default order
    console.log('Using all strategies in default order - insufficient cached data');
    return allStrategies;
  }

  const llmKey = aiProvider && modelName ? `${aiProvider}_${modelName}` : null;

  // Sort ALL strategies by cached performance (best first)
  const strategyScores = allStrategies.map(strategy => {
    let score = 0.5;
    let count = 0;
    
    const strategyData = cachedInsights.strategies[strategy];
    if (strategyData) {
      // Check for LLM-specific performance data first with legacy fallbacks
      const byLLM = strategyData.byLLM ?? strategyData.by_llm;
      if (llmKey && byLLM && byLLM[llmKey]) {
        const llmData = byLLM[llmKey];
        score = (llmData.avgScore ?? llmData.avg_score ?? 0.5);
        count = llmData.count ?? 0;
      } else {
        score = (strategyData.avgScore ?? strategyData.avg_score ?? 0.5);
        count = strategyData.count ?? 0;
      }
    }
    
    return { strategy, score, count };
  });

  strategyScores.sort((a, b) => {
    // Prioritize strategies with both high scores and sufficient data
    const scoreA = a.score * Math.min(1, a.count / 3); // Confidence factor
    const scoreB = b.score * Math.min(1, b.count / 3);
    return scoreB - scoreA;
  });
  
  // Return ALL strategies, sorted by performance
  const sorted = strategyScores.map(s => s.strategy);
  console.log(`Testing all ${sorted.length} strategies, prioritized by performance for ${llmKey || 'general'}: ${sorted.join(', ')}`);
  return sorted;
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

// Validator: Detect if the AI returned an answer instead of a prompt
function looksLikeAnswer(text: string, original: string): boolean {
  const trimmed = text.trim();

  // JSON payload detection - starts with { or [ and parses as JSON
  if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try { 
      JSON.parse(trimmed); 
      return true; 
    } catch {}
  }

  // Fenced code blocks introduced that weren't in original
  const hasFences = /```[\s\S]*?```/.test(trimmed);
  const originalHadFences = /```[\s\S]*?```/.test(original);
  if (hasFences && !originalHadFences) return true;

  // Heuristic: no imperative prompt verbs and looks like declarative content
  const imperativeVerbs = /(write|generate|produce|return|provide|compose|summarize|create|draft|respond|explain|describe|list|analyze|identify|compare|outline|develop|design|build|make|construct|formulate|assemble)/i;
  const hasImperative = imperativeVerbs.test(trimmed);
  
  // If no imperative verbs and it's either long or multi-line, likely an answer
  const lines = trimmed.split('\n').length;
  if (!hasImperative && (lines > 3 || trimmed.length > 280)) {
    return true;
  }

  return false;
}