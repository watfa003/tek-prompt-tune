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