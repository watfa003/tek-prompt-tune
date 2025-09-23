import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

// AI Provider configurations
const AI_PROVIDERS = {
  openai: {
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    })
  }
};

// Prompt optimization strategies
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Clarity Enhancement",
    prompt: "Rewrite this prompt to be more clear and specific, removing ambiguity:",
    weight: 0.3
  },
  specificity: {
    name: "Specificity Boost", 
    prompt: "Make this prompt more specific and detailed with concrete examples:",
    weight: 0.25
  },
  context: {
    name: "Context Addition",
    prompt: "Add relevant context and background information to this prompt:",
    weight: 0.2
  },
  format: {
    name: "Format Structure",
    prompt: "Restructure this prompt with clear formatting and sections:",
    weight: 0.15
  },
  efficiency: {
    name: "Efficiency Optimization",
    prompt: "Optimize this prompt for better AI model performance and token efficiency:",
    weight: 0.1
  }
};

// Scoring criteria
const SCORING_CRITERIA = {
  clarity: { weight: 0.25, description: "How clear and unambiguous the prompt is" },
  specificity: { weight: 0.25, description: "How specific and detailed the instructions are" },
  context: { weight: 0.2, description: "How well context is provided" },
  structure: { weight: 0.15, description: "How well-structured and organized" },
  efficiency: { weight: 0.15, description: "How token-efficient and concise" }
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
      modelName = 'gpt-4', 
      outputType = 'text',
      variants = 3,
      userId 
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
    const strategies = Object.entries(OPTIMIZATION_STRATEGIES).slice(0, variants);

    for (const [strategyKey, strategy] of strategies) {
      try {
        const optimizationPrompt = `${strategy.prompt}

Original prompt: "${originalPrompt}"
Task context: ${taskDescription || 'General purpose'}
Target output: ${outputType}

Return only the optimized prompt, nothing else.`;

        const response = await fetch(AI_PROVIDERS.openai.endpoint, {
          method: 'POST',
          headers: AI_PROVIDERS.openai.headers(openaiApiKey),
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert prompt engineer. Your job is to optimize prompts for better AI performance and results.'
              },
              {
                role: 'user',
                content: optimizationPrompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          console.error('OpenAI API error for variant generation');
          continue;
        }

        const data = await response.json();
        const optimizedPrompt = data.choices[0].message.content.trim();

        // Test the optimized prompt with a sample query
        const testPrompt = `${optimizedPrompt}\n\nTest this with: "Explain quantum computing briefly"`;
        
        const testResponse = await fetch(AI_PROVIDERS.openai.endpoint, {
          method: 'POST',
          headers: AI_PROVIDERS.openai.headers(openaiApiKey),
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 500,
            temperature: 0.7
          })
        });

        let testResult = '';
        let tokensUsed = 0;
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          testResult = testData.choices[0].message.content;
          tokensUsed = testData.usage?.total_tokens || 0;
        }

        // Score the variant
        const score = await scorePrompt(optimizedPrompt, testResult, strategy.weight);

        // Save optimization history
        await supabase
          .from('optimization_history')
          .insert({
            user_id: userId,
            prompt_id: promptRecord.id,
            variant_prompt: optimizedPrompt,
            ai_response: testResult,
            score: score,
            metrics: {
              strategy: strategy.name,
              strategy_key: strategyKey,
              tokens_used: tokensUsed,
              response_length: testResult.length,
              prompt_length: optimizedPrompt.length
            },
            generation_time_ms: Date.now() - startTime,
            tokens_used: tokensUsed
          });

        optimizedVariants.push({
          prompt: optimizedPrompt,
          strategy: strategy.name,
          score: score,
          response: testResult,
          metrics: {
            tokens_used: tokensUsed,
            response_length: testResult.length,
            prompt_length: optimizedPrompt.length,
            strategy_weight: strategy.weight
          }
        });

      } catch (error) {
        console.error(`Error generating variant for strategy ${strategyKey}:`, error);
      }
    }

    // Find best variant
    const bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    // Update prompt record with results
    await supabase
      .from('prompts')
      .update({
        optimized_prompt: bestVariant.prompt,
        score: bestVariant.score,
        performance_metrics: {
          total_variants: optimizedVariants.length,
          best_strategy: bestVariant.strategy,
          improvement_score: bestVariant.score - 0.5, // baseline score
          processing_time_ms: Date.now() - startTime,
          strategies_used: strategies.map(([key, strategy]) => strategy.name)
        },
        variants_generated: optimizedVariants.length,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', promptRecord.id);

    return new Response(
      JSON.stringify({
        promptId: promptRecord.id,
        originalPrompt,
        bestOptimizedPrompt: bestVariant.prompt,
        bestScore: bestVariant.score,
        variants: optimizedVariants,
        summary: {
          improvementScore: bestVariant.score - 0.5,
          bestStrategy: bestVariant.strategy,
          totalVariants: optimizedVariants.length,
          processingTimeMs: Date.now() - startTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in prompt-optimizer function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Score prompt based on multiple criteria
async function scorePrompt(prompt: string, response: string, strategyWeight: number): Promise<number> {
  let totalScore = 0;
  
  // Basic scoring algorithm
  const scores = {
    clarity: scoreClarity(prompt),
    specificity: scoreSpecificity(prompt),
    context: scoreContext(prompt),
    structure: scoreStructure(prompt),
    efficiency: scoreEfficiency(prompt, response)
  };

  // Calculate weighted score
  for (const [criterion, criterionData] of Object.entries(SCORING_CRITERIA)) {
    totalScore += scores[criterion as keyof typeof scores] * criterionData.weight;
  }

  // Apply strategy weight bonus
  totalScore += strategyWeight * 0.1;

  // Normalize to 0-1 range
  return Math.min(Math.max(totalScore, 0), 1);
}

function scoreClarity(prompt: string): number {
  const words = prompt.split(' ').length;
  const sentences = prompt.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Optimal range: 10-20 words per sentence
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) return 0.9;
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) return 0.7;
  return 0.5;
}

function scoreSpecificity(prompt: string): number {
  const specificWords = ['specific', 'detailed', 'example', 'format', 'exactly', 'must', 'should'];
  const specificCount = specificWords.filter(word => 
    prompt.toLowerCase().includes(word)
  ).length;
  
  return Math.min(specificCount * 0.15, 0.9);
}

function scoreContext(prompt: string): number {
  const contextWords = ['context', 'background', 'purpose', 'goal', 'audience', 'use case'];
  const contextCount = contextWords.filter(word => 
    prompt.toLowerCase().includes(word)
  ).length;
  
  return Math.min(contextCount * 0.2, 0.9);
}

function scoreStructure(prompt: string): number {
  const hasNumbering = /\d+\./.test(prompt);
  const hasBullets = /[-*]/.test(prompt);
  const hasHeaders = /#+/.test(prompt) || /[A-Z][a-z]+:/.test(prompt);
  
  let score = 0.3; // Base score
  if (hasNumbering) score += 0.3;
  if (hasBullets) score += 0.2;
  if (hasHeaders) score += 0.2;
  
  return Math.min(score, 0.9);
}

function scoreEfficiency(prompt: string, response: string): number {
  const promptTokens = prompt.split(' ').length;
  const responseTokens = response.split(' ').length;
  
  // Efficiency ratio: response quality vs prompt length
  if (promptTokens === 0) return 0.5;
  
  const efficiency = responseTokens / promptTokens;
  
  // Optimal range: 2-8 response tokens per prompt token
  if (efficiency >= 2 && efficiency <= 8) return 0.9;
  if (efficiency >= 1 && efficiency <= 12) return 0.7;
  return 0.5;
}