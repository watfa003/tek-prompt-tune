// Speed Mode: Optimizes via API calls (like deep mode) but skips testing responses
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const AI_PROVIDERS = {
  openai: { baseUrl: 'https://api.openai.com/v1/chat/completions', apiKey: openAIApiKey },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1/messages', apiKey: anthropicApiKey },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models', apiKey: googleApiKey },
  groq: { baseUrl: 'https://api.groq.com/openai/v1/chat/completions', apiKey: groqApiKey },
  mistral: { baseUrl: 'https://api.mistral.ai/v1/chat/completions', apiKey: mistralApiKey },
} as const;

const OPTIMIZATION_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  google: 'gemini-1.5-pro',
  groq: 'llama3-8b-8192',
  mistral: 'mistral-small-latest',
};

export async function handleSpeedMode(
  supabase: any,
  { originalPrompt, taskDescription, outputType, userId, startTime, variants: requestedVariants = 3, aiProvider = 'openai', modelName = 'gpt-4o-mini', maxTokens = 1024, temperature = 0.7 }: any
) {
  console.log('🚀 Running Speed Mode optimization...');
  
  // 12-second timeout for all operations
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Speed mode timeout: 12 seconds exceeded')), 12000);
  });
  
  try {
    // Load cached insights for speed optimization
    const { data: insights } = await supabase
      .from('optimization_insights')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`✅ Speed mode loaded cached insights: ${insights ? 'Found' : 'None'}`);
    if (insights) {
      console.log(`📈 Insights: ${insights.batch_count} batches, ${insights.total_optimizations} total opts, avg score: ${insights.avg_improvement_score}`);
    }

    // Generate multiple variants using API optimization (no testing) with timeout
    const speedPromise = generateSpeedVariants(
      originalPrompt,
      taskDescription,
      outputType,
      insights,
      requestedVariants,
      aiProvider,
      modelName,
      maxTokens,
      temperature
    );
    
    const variants = await Promise.race([speedPromise, timeoutPromise]) as any[];
    const bestVariant = selectBestVariant(variants);
    const processingTime = Date.now() - startTime;

    console.log(`✨ Speed optimization completed in ${processingTime}ms with ${variants.length} variants. Best variant score: ${bestVariant.score}`);
    console.log(`🎯 Best prompt preview: ${bestVariant.prompt.substring(0, 100)}...`);

    // Store speed optimization result
    const { data: speedResult, error } = await supabase
      .from('speed_optimizations')
      .insert({
        user_id: userId,
        original_prompt: originalPrompt,
        optimized_prompt: bestVariant.prompt,
        mode: 'speed',
        optimization_strategy: bestVariant.strategy,
        processing_time_ms: processingTime
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving speed optimization:', error);
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    return new Response(JSON.stringify({
      promptId: speedResult?.id,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      optimizedPrompt: bestVariant.prompt, // Ensure both fields are set for compatibility
      bestScore: bestVariant.score,
      variants: variants,
      mode: 'speed',
      strategy: bestVariant.strategy,
      processingTimeMs: processingTime,
      speedResultId: speedResult?.id,
      requiresRating: true,
      improvement: calculateSpeedImprovement(originalPrompt, bestVariant.prompt),
      summary: {
        improvementScore: bestVariant.score - 0.5,
        bestStrategy: bestVariant.strategy,
        totalVariants: variants.length,
        processingTimeMs: processingTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Speed mode error:', error);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    return new Response(JSON.stringify({ 
      error: 'Speed mode optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Generate multiple variants using speed heuristics (same strategies as deep mode)
async function generateSpeedVariants(originalPrompt: string, taskDescription: string, outputType: string, insights: any, requestedVariants: number = 3, aiProvider: string, modelName: string, maxTokens: number, temperature: number): Promise<any[]> {
  const variants = [];
  
  // Use the same strategy selection logic as deep mode - ensure we get exactly the number requested
  const allStrategies = ['clarity', 'specificity', 'structure', 'efficiency', 'constraints'];
  const numVariants = Math.min(Math.max(requestedVariants || 1, 1), allStrategies.length);
  
  // Duplicate strategies if we need more variants than available strategies
  let selectedStrategies = [];
  if (numVariants <= allStrategies.length) {
    selectedStrategies = selectBestStrategiesFromInsights(allStrategies, numVariants, insights);
  } else {
    // If user wants more variants than strategies, repeat best strategies with variation
    const baseStrategies = selectBestStrategiesFromInsights(allStrategies, allStrategies.length, insights);
    selectedStrategies = [...baseStrategies];
    // Add variations of the best strategies
    while (selectedStrategies.length < numVariants) {
      selectedStrategies.push(baseStrategies[selectedStrategies.length % baseStrategies.length]);
    }
  }
  
  console.log(`📊 Speed mode generating ${numVariants} variants using strategies: ${selectedStrategies.join(', ')}`);
  
  // Track uniqueness
  const seen = new Set<string>();
  
  // Generate variants using selected strategies
  for (let i = 0; i < selectedStrategies.length && variants.length < numVariants; i++) {
    const strategy = selectedStrategies[i];

    // Build an instruction for the LLM just like deep mode
    const instruction = buildInstructionForStrategy(strategy, originalPrompt, taskDescription, outputType, insights);

    // Choose a cheaper optimization model (deep mode style)
    const optimizationModel = OPTIMIZATION_MODELS[aiProvider] || modelName;

    let optimizedPrompt = '';
    try {
      optimizedPrompt = await callAIProvider(
        aiProvider,
        optimizationModel,
        instruction,
        Math.min(maxTokens || 1024, 4096),
        temperature ?? 0.7
      ) || '';
    } catch (e) {
      console.error('Optimization API call failed for strategy', strategy, e);
    }

    // Fallback if provider returns nothing
    if (!optimizedPrompt.trim()) {
      optimizedPrompt = applyDeepModeClarityOptimization(originalPrompt, taskDescription, outputType);
    }

    // Ensure uniqueness with up to 2 retries
    let attempts = 0;
    const baseInstruction = instruction;
    while (seen.has(normalizeText(optimizedPrompt)) && attempts < 2) {
      const variationHint = getVariationHint(attempts);
      const altInstruction = `${baseInstruction}\n\nGenerate a different version that approaches from a different angle. ${variationHint}`;
      const alt = await callAIProvider(
        aiProvider,
        optimizationModel,
        altInstruction,
        Math.min(maxTokens || 1024, 4096),
        Math.min(1, (temperature ?? 0.7) + 0.2)
      );
      if (alt && alt.trim()) optimizedPrompt = alt.trim();
      attempts++;
    }

    seen.add(normalizeText(optimizedPrompt));

    const score = calculateDeepModeStyleScore(optimizedPrompt, originalPrompt, strategy);

    variants.push({
      prompt: optimizedPrompt,
      strategy: getStrategyDisplayName(strategy),
      score,
      response: `Optimization completed using ${getStrategyDisplayName(strategy)} strategy`,
      metrics: {
        tokens_used: optimizedPrompt.length,
        response_length: optimizedPrompt.length,
        prompt_length: originalPrompt.length,
        strategy_weight: getStrategyWeight(strategy) * 100
      }
    });
  }
  
  // Sort by score (highest first) and log the results
  const sortedVariants = variants.sort((a, b) => b.score - a.score);
  console.log(`📊 Generated ${sortedVariants.length} variants. Scores: ${sortedVariants.map(v => v.score.toFixed(3)).join(', ')}`);
  
  return sortedVariants;
}

function selectBestVariant(variants: any[]): any {
  // Return the highest scoring variant (already sorted by score in generateSpeedVariants)
  if (variants.length === 0) {
    throw new Error('No variants available to select from');
  }
  console.log(`🏆 Selected best variant with score: ${variants[0].score} and strategy: ${variants[0].strategy}`);
  return variants[0];
}

// Deep mode style optimization functions
function applyDeepModeClarityOptimization(prompt: string, taskDescription: string, outputType: string): string {
  let improved = '';
  if (outputType === 'code') {
    improved = `Write clean, well-documented ${prompt}. Include:\n- Clear variable names and function structure\n- Inline comments explaining complex logic\n- Error handling for edge cases\n- Example usage demonstrating key features`;
  } else if (outputType === 'list') {
    improved = `Create a comprehensive, well-organized ${prompt}. Ensure:\n- Each item is clearly defined and actionable\n- Logical grouping and ordering of related items\n- Specific details rather than vague descriptions\n- Consistent formatting throughout`;
  } else if (outputType === 'json') {
    improved = `Respond in valid JSON to: ${prompt}\n\nRequired keys:\n- "summary"\n- "steps"\n- "notes"\nReturn only JSON.`;
  } else {
    improved = `Provide a clear, detailed response to: ${prompt}. Include:\n- Specific examples and concrete details\n- Well-structured explanations with logical flow\n- Practical applications where relevant\n- Clear conclusions or next steps`;
  }
  if (taskDescription) {
    improved += `\n\nContext: ${taskDescription}`;
  }
  return improved;
}

function applyDeepModeSpecificityOptimization(prompt: string, taskDescription: string, outputType: string, insights: any): string {
  let enhanced = prompt;
  
  if (outputType === 'code') {
    enhanced += '\n\nSpecific requirements:\n- Include proper error handling\n- Add meaningful variable names\n- Provide working examples\n- Include necessary imports/dependencies';
  } else if (outputType === 'list') {
    enhanced += '\n\nEnsure specificity:\n- Include specific quantities or numbers where applicable\n- Provide concrete examples for each point\n- Add context or reasoning for important items';
  } else if (outputType === 'json') {
    enhanced += '\n\nBe specific about the JSON structure and required fields. Return only JSON.';
  } else {
    enhanced += '\n\nBe specific about:\n- Exact steps or processes involved\n- Measurable outcomes or criteria\n- Real-world examples and applications\n- Timeframes and expectations';
  }
  
  if (insights?.successful_strategies?.specificity?.patterns?.length > 0) {
    const patterns = insights.successful_strategies.specificity.patterns.slice(0, 2);
    enhanced += `\n\nIncorporate these proven patterns: ${patterns.join(', ')}`;
  }
  
  if (taskDescription) {
    enhanced += `\n\nContext: ${taskDescription}`;
  }
  
  return enhanced;
}

function applyDeepModeStructureOptimization(prompt: string, taskDescription: string, outputType: string): string {
  if (hasGoodStructure(prompt)) return prompt;
  
  let structured = '';
  if (outputType === 'code') {
    structured = `${prompt}\n\nStructure your response as follows:\n1. **Setup & Dependencies**: List required imports and setup\n2. **Core Implementation**: Main code with clear comments\n3. **Error Handling**: Include try-catch blocks and validation\n4. **Usage Example**: Demonstrate how to use the code\n5. **Testing**: Basic test cases or validation steps`;
  } else if (outputType === 'list') {
    structured = `${prompt}\n\nOrganize your response with this structure:\n1. **Overview**: Brief introduction to the topic\n2. **Main Categories**: Group related items together\n3. **Detailed Items**: Specific, actionable points for each category\n4. **Priority Ranking**: Order by importance or urgency\n5. **Implementation Notes**: Additional context or considerations`;
  } else {
    structured = `${prompt}\n\nStructure your response as follows:\n1. **Introduction**: Brief overview of the topic\n2. **Main Content**: Detailed explanation with examples\n3. **Key Points**: Important takeaways or considerations\n4. **Practical Applications**: How to apply this information\n5. **Conclusion**: Summary and next steps`;
  }
  
  if (taskDescription) {
    structured += `\n\nContext: ${taskDescription}`;
  }
  
  return structured;
}

function applyDeepModeEfficiencyOptimization(prompt: string, taskDescription: string, outputType: string): string {
  // Remove redundant words/phrases
  let optimized = prompt
    .replace(/\b(please|kindly|if possible|if you would|if you could)\b/gi, '')
    .replace(/\b(very|really|quite|rather|somewhat)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (outputType === 'code') {
    optimized += '\n\nFocus on efficiency: Use optimal algorithms, minimize memory usage, and include performance considerations.';
  } else if (outputType === 'list') {
    optimized += '\n\nPrioritize high-impact items and organize by effectiveness.';
  } else if (outputType === 'json') {
    optimized += '\n\nReturn only the essential fields in compact, valid JSON.';
  } else {
    optimized += '\n\nProvide concise, actionable information with maximum value.';
  }
  
  if (taskDescription) {
    optimized += `\n\nContext: ${taskDescription}`;
  }
  
  return optimized;
}

function applyDeepModeConstraintsOptimization(prompt: string, taskDescription: string, outputType: string): string {
  let constrained = `${prompt}`;
  
  const outputHint = outputType === 'json' 
    ? 'Respond strictly with valid JSON only.' 
    : outputType === 'code' 
      ? 'Return complete, runnable code with necessary imports.' 
      : 'Use a clear, consistent format.';
  
  constrained += `\n\nConstraints and format:\n- Define acceptance criteria and edge cases\n- Specify any limits (time, tokens, complexity)\n- ${outputHint}`;
  
  if (taskDescription) {
    constrained += `\n\nContext: ${taskDescription}`;
  }
  
  return constrained;
}

function calculateDeepModeStyleScore(optimized: string, original: string, strategy: string): number {
  let score = 0.7; // Base score
  
  // Length improvement
  const lengthRatio = optimized.length / original.length;
  if (lengthRatio > 1.5 && lengthRatio < 4) score += 0.2; // Good expansion
  else if (lengthRatio < 1.5 && lengthRatio > 1.0) score += 0.15; // Reasonable length
  
  // Structure bonus
  if (hasGoodStructure(optimized) && !hasGoodStructure(original)) score += 0.1;
  
  // Strategy-specific bonuses (matching deep mode evaluation)
  switch (strategy) {
    case 'clarity':
      if (optimized.includes('clear') || optimized.includes('specific')) score += 0.05;
      break;
    case 'specificity':
      if (optimized.includes('example') || optimized.includes('detailed')) score += 0.05;
      break;
    case 'structure':
      if ((optimized.match(/\d+\./g)?.length || 0) > 2) score += 0.05;
      break;
    case 'efficiency':
      if (optimized.length < original.length * 2) score += 0.05;
      break;
    case 'constraints':
      if (optimized.includes('must') || optimized.includes('should')) score += 0.05;
      break;
  }
  
  return Math.min(1.0, Math.max(0.6, score));
}

function getStrategyDisplayName(strategy: string): string {
  const names = {
    'clarity': 'Clarity Enhancement',
    'specificity': 'Specificity Improvement',
    'structure': 'Structure and Steps',
    'efficiency': 'Efficiency Optimization',
    'constraints': 'Constraints and Format'
  };
  return names[strategy as keyof typeof names] || strategy;
}

function getStrategyWeight(strategy: string): number {
  const weights = {
    'clarity': 0.3,
    'specificity': 0.25,
    'structure': 0.15,
    'efficiency': 0.2,
    'constraints': 0.1
  };
  return weights[strategy as keyof typeof weights] || 0.2;
}

function hasGoodStructure(prompt: string): boolean {
  const structureIndicators = [
    /\d+\./g,  // numbered lists
    /[-*]\s/g, // bullet points
    /:\s*$/gm, // colons at end of lines
    /#{1,6}\s/g, // headers
    /\*\*.*\*\*/g // bold headers
  ];
  
  return structureIndicators.some(pattern => pattern.test(prompt));
}

function calculateSpeedImprovement(original: string, optimized: string): any {
  return {
    lengthImprovement: optimized.length > original.length ? 'expanded' : 'condensed',
    structureAdded: hasGoodStructure(optimized) && !hasGoodStructure(original),
    specificityBoost: optimized.length > original.length * 1.2,
    estimatedScoreImprovement: 0.25
  };
}

// Build deep-mode style instruction for the LLM
function buildInstructionForStrategy(strategy: string, originalPrompt: string, taskDescription: string, outputType: string, insights: any): string {
  let instruction = '';
  switch (strategy) {
    case 'clarity':
      instruction = `Make this prompt clearer and more specific:\n\nOriginal: ${originalPrompt}`;
      break;
    case 'specificity':
      instruction = `Add specific details and examples to this prompt:\n\nOriginal: ${originalPrompt}`;
      if (insights?.successful_strategies?.specificity?.patterns?.length > 0) {
        instruction += `\n\nSuccessful patterns for this strategy: ${insights.successful_strategies.specificity.patterns.slice(0, 3).join(', ')}`;
      }
      break;
    case 'structure':
      instruction = `Improve the logical structure with step-by-step instructions and sections:\n\nOriginal: ${originalPrompt}`;
      break;
    case 'efficiency':
      instruction = `Optimize this prompt for better AI performance:\n\nOriginal: ${originalPrompt}`;
      break;
    case 'constraints':
      instruction = `Add constraints, acceptance criteria, and a precise output format:\n\nOriginal: ${originalPrompt}`;
      break;
  }
  if (outputType && outputType !== 'text') {
    instruction += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format (this affects the AI's response format only, not the prompt itself).`;
  }
  if (taskDescription) {
    instruction += `\n\nContext: ${taskDescription}`;
  }
  instruction += `\n\nRules:\n- Preserve the user's original task and intent.\n- Do NOT generate meta-prompts (e.g., 'create a prompt', 'write code that generates a prompt').\n- Return ONLY the improved prompt text with no extra commentary or markdown fences.\n- Do not change the task into writing code unless the original prompt explicitly requested code.`;
  return instruction;
}

// Provider calls (subset matching index.ts behavior)
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  try {
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
        return await callOpenAICompatible(provider, model, prompt, maxTokens, temperature);
      case 'anthropic':
        return await callAnthropic(model, prompt, maxTokens);
      case 'google':
        return await callGoogle(model, prompt, maxTokens);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (e) {
    console.error('callAIProvider error', e);
    return null;
  }
}

async function callOpenAICompatible(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  const cfg = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
  if (!cfg?.apiKey) throw new Error(`${provider} API key missing`);
  
  const isNewerModel = /^(gpt-5|gpt-4\.1|o3|o4)/i.test(model);
  const payload: any = { model, messages: [{ role: 'user', content: prompt }] };
  
  if (isNewerModel) {
    payload.max_completion_tokens = maxTokens;
  } else {
    payload.max_tokens = maxTokens;
    payload.temperature = Math.min(temperature, 1.0);
  }
  
  // Add 8-second timeout for API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const res = await fetch(cfg.baseUrl, { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) { 
      const errorText = await res.text();
      console.error(`${provider} failed:`, errorText); 
      return null; 
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`${provider} API call failed:`, (error as Error).message);
    return null;
  }
}

async function callAnthropic(model: string, prompt: string, maxTokens: number): Promise<string | null> {
  const cfg = AI_PROVIDERS.anthropic;
  if (!cfg.apiKey) throw new Error('Anthropic API key missing');
  
  // Add 8-second timeout for API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const res = await fetch(cfg.baseUrl, { 
      method: 'POST', 
      headers: { 
        'x-api-key': cfg.apiKey, 
        'content-type': 'application/json', 
        'anthropic-version': '2023-06-01' 
      }, 
      body: JSON.stringify({ 
        model, 
        max_tokens: maxTokens, 
        messages: [{ role: 'user', content: prompt }] 
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) { 
      const errorText = await res.text();
      console.error('anthropic failed:', errorText); 
      return null; 
    }
    const data = await res.json();
    // data.content can be array segments; join text
    const txt = Array.isArray(data?.content) ? data.content.map((c: any) => c.text).join('\n').trim() : data?.content?.[0]?.text?.trim();
    return txt || null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Anthropic API call failed:', (error as Error).message);
    return null;
  }
}

async function callGoogle(model: string, prompt: string, maxTokens: number): Promise<string | null> {
  const cfg = AI_PROVIDERS.google;
  if (!cfg.apiKey) throw new Error('Google API key missing');
  
  // Add 8-second timeout for API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const url = `${cfg.baseUrl}/${model}:generateContent?key=${cfg.apiKey}`;
    const res = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { maxOutputTokens: maxTokens } 
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) { 
      const errorText = await res.text();
      console.error('google failed:', errorText); 
      return null; 
    }
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n').trim();
    return txt || null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Google API call failed:', (error as Error).message);
    return null;
  }
}

// Strategy selection logic matching deep mode
function selectBestStrategiesFromInsights(allStrategies: string[], count: number, insights: any): string[] {
  if (!insights?.successful_strategies) {
    console.log('No cached insights found, using default strategy order');
    return allStrategies.slice(0, count);
  }

  console.log(`📊 Available strategies from insights: ${Object.keys(insights.successful_strategies).length}, patterns available`);

  // Sort strategies by their success scores from insights (same logic as deep mode)
  const strategyScores = new Map();
  
  for (const [strategyKey, strategyData] of Object.entries(insights.successful_strategies)) {
    if (typeof strategyData === 'object' && strategyData && 'avg_score' in strategyData) {
      strategyScores.set(strategyKey, (strategyData as any).avg_score || 0);
    }
  }

  // Sort available strategies by their historical performance
  const sortedStrategies = allStrategies.sort((a, b) => {
    const scoreA = strategyScores.get(a) || 0.5; // Default score for unknown strategies
    const scoreB = strategyScores.get(b) || 0.5;
    return scoreB - scoreA; // Higher scores first
  });

  const selectedStrategies = sortedStrategies.slice(0, count);
  console.log(`Selected strategies based on cached insights: ${selectedStrategies.join(', ')}`);
  
  return selectedStrategies;
}

// Helpers for uniqueness
function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getVariationHint(i: number): string {
  const hints = [
    'Use a different structure and vary the wording.',
    'Focus on constraints/acceptance criteria and rephrase sections.',
    'Change the ordering and emphasize different key points.'
  ];
  return hints[i % hints.length];
}