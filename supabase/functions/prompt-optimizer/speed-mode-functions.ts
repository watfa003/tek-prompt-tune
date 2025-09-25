// Speed Mode: Use cached heuristics without API calls
export async function handleSpeedMode(supabase: any, { originalPrompt, taskDescription, outputType, userId, startTime, variants: requestedVariants = 3 }: any) {
  console.log('🚀 Running Speed Mode optimization...');
  
  try {
    // Load cached insights for speed optimization
    const { data: insights } = await supabase
      .from('optimization_insights')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Generate multiple variants using speed heuristics
    const variants = await generateSpeedVariants(originalPrompt, taskDescription, outputType, insights, requestedVariants);
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
async function generateSpeedVariants(originalPrompt: string, taskDescription: string, outputType: string, insights: any, requestedVariants: number = 3): Promise<any[]> {
  const variants = [];
  
  // Use the same strategies as deep mode
  const strategies = ['clarity', 'specificity', 'structure', 'efficiency', 'constraints'];
  
  // Generate the requested number of variants by cycling through strategies
  for (let i = 0; i < requestedVariants; i++) {
    const strategy = strategies[i % strategies.length];
    let optimizedPrompt = originalPrompt;
    
    // Apply deep mode style optimization strategies
    switch (strategy) {
      case 'clarity':
        optimizedPrompt = applyDeepModeClarityOptimization(originalPrompt, taskDescription, outputType);
        break;
      case 'specificity':
        optimizedPrompt = applyDeepModeSpecificityOptimization(originalPrompt, taskDescription, outputType, insights);
        break;
      case 'structure':
        optimizedPrompt = applyDeepModeStructureOptimization(originalPrompt, taskDescription, outputType);
        break;
      case 'efficiency':
        optimizedPrompt = applyDeepModeEfficiencyOptimization(originalPrompt, taskDescription, outputType);
        break;
      case 'constraints':
        optimizedPrompt = applyDeepModeConstraintsOptimization(originalPrompt, taskDescription, outputType);
        break;
    }
    
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
  let optimizationPrompt = `Make this prompt clearer and more specific:\n\nOriginal: ${prompt}`;
  
  if (outputType && outputType !== 'text') {
    optimizationPrompt += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format.`;
  }
  
  if (taskDescription) {
    optimizationPrompt += `\n\nContext: ${taskDescription}`;
  }
  
  optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Do NOT generate meta-prompts (e.g., 'create a prompt', 'write code that generates a prompt').\n- Return ONLY the improved prompt text with no extra commentary or markdown fences.\n- Do not change the task into writing code unless the original prompt explicitly requested code.`;
  
  return optimizationPrompt;
}

function applyDeepModeSpecificityOptimization(prompt: string, taskDescription: string, outputType: string, insights: any): string {
  let optimizationPrompt = `Add specific details and examples to this prompt:\n\nOriginal: ${prompt}`;
  
  // Add cached insights if available
  if (insights?.successful_strategies?.specificity?.patterns?.length > 0) {
    optimizationPrompt += `\n\nSuccessful patterns for this strategy: ${insights.successful_strategies.specificity.patterns.slice(0, 3).join(', ')}`;
  }
  
  if (outputType && outputType !== 'text') {
    optimizationPrompt += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format.`;
  }
  
  if (taskDescription) {
    optimizationPrompt += `\n\nContext: ${taskDescription}`;
  }
  
  optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Do NOT generate meta-prompts.\n- Return ONLY the improved prompt text with no extra commentary.\n- Add specific examples and concrete details.`;
  
  return optimizationPrompt;
}

function applyDeepModeStructureOptimization(prompt: string, taskDescription: string, outputType: string): string {
  let optimizationPrompt = `Improve the logical structure with step-by-step instructions and sections:\n\nOriginal: ${prompt}`;
  
  if (outputType && outputType !== 'text') {
    optimizationPrompt += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format.`;
  }
  
  if (taskDescription) {
    optimizationPrompt += `\n\nContext: ${taskDescription}`;
  }
  
  optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Add clear structure and step-by-step instructions.\n- Return ONLY the improved prompt text.\n- Use numbered lists or bullet points for clarity.`;
  
  return optimizationPrompt;
}

function applyDeepModeEfficiencyOptimization(prompt: string, taskDescription: string, outputType: string): string {
  let optimizationPrompt = `Optimize this prompt for better AI performance:\n\nOriginal: ${prompt}`;
  
  if (outputType && outputType !== 'text') {
    optimizationPrompt += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format.`;
  }
  
  if (taskDescription) {
    optimizationPrompt += `\n\nContext: ${taskDescription}`;
  }
  
  optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Make the prompt more efficient and direct.\n- Remove unnecessary words while maintaining clarity.\n- Return ONLY the improved prompt text.`;
  
  return optimizationPrompt;
}

function applyDeepModeConstraintsOptimization(prompt: string, taskDescription: string, outputType: string): string {
  let optimizationPrompt = `Add constraints, acceptance criteria, and a precise output format:\n\nOriginal: ${prompt}`;
  
  if (outputType && outputType !== 'text') {
    optimizationPrompt += `\n\nEnsure the improved prompt clearly instructs the AI to RESPOND in ${outputType} format.`;
  }
  
  if (taskDescription) {
    optimizationPrompt += `\n\nContext: ${taskDescription}`;
  }
  
  optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent.\n- Add specific constraints and acceptance criteria.\n- Define clear output format requirements.\n- Return ONLY the improved prompt text.`;
  
  return optimizationPrompt;
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