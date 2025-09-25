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

// Generate multiple variants using speed heuristics
async function generateSpeedVariants(originalPrompt: string, taskDescription: string, outputType: string, insights: any, requestedVariants: number = 3): Promise<any[]> {
  const variants = [];
  const strategies = ['clarity', 'specificity', 'structure', 'efficiency', 'conciseness', 'examples'];
  
  // Generate the requested number of variants by cycling through strategies
  for (let i = 0; i < requestedVariants; i++) {
    const strategy = strategies[i % strategies.length];
    let optimizedPrompt = originalPrompt;
    
    // Apply different optimization strategies
    switch (strategy) {
      case 'clarity':
        optimizedPrompt = improveClarityHeuristic(originalPrompt, outputType);
        break;
      case 'specificity':
        optimizedPrompt = addSpecificityHeuristic(originalPrompt, outputType, insights);
        break;
      case 'structure':
        optimizedPrompt = improveStructureHeuristic(originalPrompt, outputType);
        break;
      case 'efficiency':
        optimizedPrompt = improveEfficiencyHeuristic(originalPrompt, outputType);
        break;
      case 'conciseness':
        optimizedPrompt = improveConciseness(originalPrompt, outputType);
        break;
      case 'examples':
        optimizedPrompt = addExamplesHeuristic(originalPrompt, outputType);
        break;
    }
    
    const score = calculateHeuristicScore(optimizedPrompt, originalPrompt, strategy);
    
    variants.push({
      prompt: optimizedPrompt,
      strategy,
      score,
      metrics: {
        length_improvement: optimizedPrompt.length - originalPrompt.length,
        structure_score: hasGoodStructure(optimizedPrompt) ? 0.8 : 0.4,
        clarity_score: score
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

// Improved heuristic functions
function improveClarityHeuristic(prompt: string, outputType: string): string {
  let improved = prompt;
  
  // Add specific instructions based on output type
  if (outputType === 'code') {
    improved = `Write clean, well-documented ${prompt}. Include:\n- Clear variable names and function structure\n- Inline comments explaining complex logic\n- Error handling for edge cases\n- Example usage demonstrating key features`;
  } else if (outputType === 'list') {
    improved = `Create a comprehensive, well-organized ${prompt}. Ensure:\n- Each item is clearly defined and actionable\n- Logical grouping and ordering of related items\n- Specific details rather than vague descriptions\n- Consistent formatting throughout`;
  } else {
    improved = `Provide a clear, detailed response to: ${prompt}. Include:\n- Specific examples and concrete details\n- Well-structured explanations with logical flow\n- Practical applications where relevant\n- Clear conclusions or next steps`;
  }
  
  return improved;
}

function addSpecificityHeuristic(prompt: string, outputType: string, insights: any): string {
  let enhanced = prompt;
  
  // Add specificity based on output type
  if (outputType === 'code') {
    enhanced += '\n\nSpecific requirements:\n- Include proper error handling\n- Add meaningful variable names\n- Provide working examples\n- Include necessary imports/dependencies';
  } else if (outputType === 'list') {
    enhanced += '\n\nEnsure specificity:\n- Include specific quantities or numbers where applicable\n- Provide concrete examples for each point\n- Add context or reasoning for important items';
  } else {
    enhanced += '\n\nBe specific about:\n- Exact steps or processes involved\n- Measurable outcomes or criteria\n- Real-world examples and applications\n- Timeframes and expectations';
  }
  
  // Add insights patterns if available
  if (insights?.successful_strategies?.specificity?.patterns) {
    const patterns = insights.successful_strategies.specificity.patterns.slice(0, 2);
    if (patterns.length > 0) {
      enhanced += `\n\nIncorporate these proven patterns: ${patterns.join(', ')}`;
    }
  }
  
  return enhanced;
}

function improveStructureHeuristic(prompt: string, outputType: string): string {
  if (hasGoodStructure(prompt)) return prompt;
  
  if (outputType === 'code') {
    return `${prompt}\n\nStructure your response as follows:\n1. **Setup & Dependencies**: List required imports and setup\n2. **Core Implementation**: Main code with clear comments\n3. **Error Handling**: Include try-catch blocks and validation\n4. **Usage Example**: Demonstrate how to use the code\n5. **Testing**: Basic test cases or validation steps`;
  } else if (outputType === 'list') {
    return `${prompt}\n\nOrganize your response with this structure:\n1. **Overview**: Brief introduction to the topic\n2. **Main Categories**: Group related items together\n3. **Detailed Items**: Specific, actionable points for each category\n4. **Priority Ranking**: Order by importance or urgency\n5. **Implementation Notes**: Additional context or considerations`;
  } else {
    return `${prompt}\n\nStructure your response as follows:\n1. **Introduction**: Brief overview of the topic\n2. **Main Content**: Detailed explanation with examples\n3. **Key Points**: Important takeaways or considerations\n4. **Practical Applications**: How to apply this information\n5. **Conclusion**: Summary and next steps`;
  }
}

function improveEfficiencyHeuristic(prompt: string, outputType: string): string {
  let optimized = prompt;
  
  // Remove redundant words and phrases
  optimized = optimized
    .replace(/\b(please|kindly|if possible|if you would|if you could)\b/gi, '')
    .replace(/\b(very|really|quite|rather|somewhat)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Add efficiency-focused instructions
  if (outputType === 'code') {
    optimized += '\n\nFocus on efficiency: Use optimal algorithms, minimize memory usage, and include performance considerations.';
  } else if (outputType === 'list') {
    optimized += '\n\nPrioritize high-impact items and organize by effectiveness.';
  } else {
    optimized += '\n\nProvide concise, actionable information with maximum value.';
  }
  
  return optimized;
}

function calculateHeuristicScore(optimized: string, original: string, strategy: string): number {
  let score = 0.6; // Base score
  
  // Length improvement
  const lengthRatio = optimized.length / original.length;
  if (lengthRatio > 1.2 && lengthRatio < 3) score += 0.15; // Good expansion
  else if (lengthRatio < 1.2 && lengthRatio > 0.8) score += 0.1; // Reasonable length
  
  // Structure bonus
  if (hasGoodStructure(optimized) && !hasGoodStructure(original)) score += 0.15;
  
  // Strategy-specific bonuses
  switch (strategy) {
    case 'clarity':
      if (optimized.includes('Include:') || optimized.includes('Ensure:')) score += 0.1;
      break;
    case 'specificity':
      if (optimized.includes('specific') || optimized.includes('example')) score += 0.1;
      break;
    case 'structure':
      if ((optimized.match(/\d+\./g)?.length || 0) > 3) score += 0.1;
      break;
    case 'efficiency':
      if (optimized.length < original.length * 1.5) score += 0.1;
      break;
  }
  
  return Math.min(1.0, Math.max(0.3, score));
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

function improveConciseness(prompt: string, outputType: string): string {
  let concise = prompt;
  
  // Remove redundant words and phrases
  concise = concise
    .replace(/\b(please|kindly|if possible|if you would|if you could|very|really|quite|rather|somewhat)\b/gi, '')
    .replace(/\b(in order to|for the purpose of)\b/gi, 'to')
    .replace(/\b(due to the fact that|because of the fact that)\b/gi, 'because')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Add concise instructions based on output type
  if (outputType === 'code') {
    concise += '\n\nBe concise: Provide clean, minimal code with essential comments only.';
  } else if (outputType === 'list') {
    concise += '\n\nKeep it brief: List key points without excessive detail.';
  } else {
    concise += '\n\nBe direct and concise while maintaining clarity.';
  }
  
  return concise;
}

function addExamplesHeuristic(prompt: string, outputType: string): string {
  let withExamples = prompt;
  
  // Add example-focused instructions
  if (outputType === 'code') {
    withExamples += '\n\nInclude practical examples:\n- Working code samples with different use cases\n- Input/output examples showing expected behavior\n- Real-world implementation scenarios';
  } else if (outputType === 'list') {
    withExamples += '\n\nProvide concrete examples:\n- Specific instances for each list item\n- Real-world applications or scenarios\n- Quantifiable examples where possible';
  } else {
    withExamples += '\n\nInclude clear examples:\n- Concrete illustrations of key concepts\n- Step-by-step examples showing the process\n- Before/after scenarios to demonstrate outcomes';
  }
  
  return withExamples;
}