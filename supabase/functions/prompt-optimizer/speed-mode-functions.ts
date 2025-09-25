// Speed Mode: Use cached heuristics without API calls
export async function handleSpeedMode(supabase: any, { originalPrompt, taskDescription, outputType, userId, startTime }: any) {
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

    // Apply cached heuristics to optimize prompt
    const optimizedPrompt = await applySpeedHeuristics(originalPrompt, taskDescription, outputType, insights);
    const strategy = determineOptimizationStrategy(originalPrompt, outputType);
    const processingTime = Date.now() - startTime;

    console.log(`✨ Speed optimization completed in ${processingTime}ms`);

    // Store speed optimization result
    const { data: speedResult, error } = await supabase
      .from('speed_optimizations')
      .insert({
        user_id: userId,
        original_prompt: originalPrompt,
        optimized_prompt: optimizedPrompt,
        mode: 'speed',
        optimization_strategy: strategy,
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
      optimizedPrompt,
      mode: 'speed',
      strategy,
      processingTimeMs: processingTime,
      speedResultId: speedResult?.id,
      requiresRating: true,
      improvement: calculateSpeedImprovement(originalPrompt, optimizedPrompt)
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

// Apply speed heuristics based on cached insights
async function applySpeedHeuristics(originalPrompt: string, taskDescription: string, outputType: string, insights: any): Promise<string> {
  let optimizedPrompt = originalPrompt;
  
  // Apply length optimization
  if (originalPrompt.length < 50) {
    optimizedPrompt = expandShortPrompt(optimizedPrompt, outputType);
  } else if (originalPrompt.length > 1000) {
    optimizedPrompt = condensePrompt(optimizedPrompt);
  }
  
  // Apply structure improvements
  if (!hasGoodStructure(optimizedPrompt)) {
    optimizedPrompt = addStructure(optimizedPrompt, outputType);
  }
  
  // Apply specificity based on cached patterns
  if (insights?.successful_strategies?.specificity) {
    optimizedPrompt = addSpecificity(optimizedPrompt, insights.successful_strategies.specificity);
  }
  
  // Apply format constraints
  optimizedPrompt = addFormatConstraints(optimizedPrompt, outputType);
  
  return optimizedPrompt;
}

// Speed heuristic functions
function expandShortPrompt(prompt: string, outputType: string): string {
  const expansions: Record<string, string> = {
    code: `Please provide a detailed ${prompt}. Include:
- Clear implementation with proper syntax
- Comments explaining key logic
- Error handling where appropriate
- Example usage if relevant`,
    
    list: `Create a comprehensive ${prompt}. Requirements:
- Well-organized list format
- Relevant and actionable items
- Clear descriptions for each point
- Logical ordering or categorization`,
    
    essay: `Write a well-structured ${prompt}. Include:
- Clear introduction with thesis
- Supporting arguments with evidence
- Logical flow between ideas
- Conclusion that reinforces main points`,
    
    default: `Please provide a detailed and comprehensive response to: ${prompt}. Include relevant context, clear explanations, and specific examples where helpful.`
  };
  
  return expansions[outputType] || expansions.default;
}

function condensePrompt(prompt: string): string {
  // Remove redundant phrases and excessive details while keeping core requirements
  return prompt
    .replace(/\b(please|kindly|if possible|if you can|if you would)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*\1+/g, '$1')
    .trim()
    .substring(0, 800) + (prompt.length > 800 ? '...' : '');
}

function hasGoodStructure(prompt: string): boolean {
  const structureIndicators = [
    /\d+\./g,  // numbered lists
    /[-*]\s/g, // bullet points
    /:\s*$/gm, // colons at end of lines
    /#{1,6}\s/g // headers
  ];
  
  return structureIndicators.some(pattern => pattern.test(prompt));
}

function addStructure(prompt: string, outputType: string): string {
  if (outputType === 'code') {
    return `Create ${prompt} following this structure:
1. Core functionality implementation
2. Error handling and edge cases
3. Documentation and examples
4. Testing considerations`;
  } else if (outputType === 'list') {
    return `Generate ${prompt} in this format:
- Main category/theme
  - Specific items with brief descriptions
  - Organized by priority or relevance
- Include actionable details for each item`;
  } else {
    return `Respond to "${prompt}" using this structure:
1. Overview/Introduction
2. Main content with specific details
3. Key takeaways or next steps`;
  }
}

function addSpecificity(prompt: string, specificityPatterns: any): string {
  if (!specificityPatterns?.patterns) return prompt;
  
  const commonPatterns = specificityPatterns.patterns.slice(0, 3);
  const enhancement = commonPatterns.length > 0 
    ? `\n\nBe sure to include: ${commonPatterns.join(', ')}`
    : '';
    
  return prompt + enhancement;
}

function addFormatConstraints(prompt: string, outputType: string): string {
  const constraints: Record<string, string> = {
    code: '\n\nProvide clean, readable code with proper formatting and comments.',
    list: '\n\nFormat as a clear, organized list with consistent structure.',
    essay: '\n\nUse proper paragraphs with clear topic sentences and transitions.',
    default: '\n\nProvide a well-formatted, professional response.'
  };
  
  return prompt + (constraints[outputType] || constraints.default);
}

function determineOptimizationStrategy(prompt: string, outputType: string): string {
  if (prompt.length < 50) return 'expansion';
  if (prompt.length > 1000) return 'condensation';
  if (!hasGoodStructure(prompt)) return 'structure';
  if (outputType === 'code' && !prompt.includes('example')) return 'specificity';
  return 'clarity';
}

function calculateSpeedImprovement(original: string, optimized: string): any {
  return {
    lengthImprovement: optimized.length > original.length ? 'expanded' : 'condensed',
    structureAdded: hasGoodStructure(optimized) && !hasGoodStructure(original),
    specificityBoost: optimized.length > original.length * 1.2,
    estimatedScoreImprovement: 0.15 // Conservative estimate for speed mode
  };
}
