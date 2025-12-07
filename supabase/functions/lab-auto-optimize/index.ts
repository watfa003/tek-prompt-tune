import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { scorePromptWithAI, calculateOverallScore } from '../shared/ai-grader.ts';
import { scoreOutputQualityWithAI } from '../shared/master-grader.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[lab-auto-optimize] Request received');
    const { 
      prompt, 
      scores, 
      aiRecommendations,
      outputType = 'text',
      promptType,
      target_llm = 'openai/gpt-4o-mini',
      skipGrading = false,  // NEW: Skip grading to return prompt faster
      onlyGrade = false,    // NEW: Only grade, don't optimize
    } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[lab-auto-optimize] Processing:', { 
      promptLength: prompt.length,
      hasScores: !!scores,
      hasRecommendations: !!aiRecommendations,
      outputType,
      promptType,
      target_llm,
      skipGrading,
      onlyGrade,
    });

    // If onlyGrade mode, skip optimization and just grade the provided prompt
    if (onlyGrade) {
      console.log('[lab-auto-optimize] onlyGrade mode - skipping optimization, just grading...');
      
      let newScores = null;
      let newPromptScore = 10;
      let newOutputScore = 10;
      let newFinalScore = 10;
      let fallbackReason: string | undefined;
      
      try {
        // Generate output using the same target_llm as Lab
        const output = await callAIModel(prompt, target_llm, outputType);
        console.log('[lab-auto-optimize] Generated output length:', output.length);
        
        // Compute AI category scores
        const { scores: gradedScores } = await scorePromptWithAI(prompt, output, OPENAI_API_KEY);
        newScores = gradedScores;
        
        // 50% - Prompt quality score
        newPromptScore = Math.round(calculateOverallScore(gradedScores) * 10) / 10;
        
        // 50% - Output quality score (with prompt for intent validation)
        newOutputScore = Math.round(await scoreOutputQualityWithAI(output, prompt, OPENAI_API_KEY) * 10) / 10;
        
        // 50/50 combined final score (matches Lab exactly)
        newFinalScore = Math.round(((newPromptScore * 0.5) + (newOutputScore * 0.5)) * 10) / 10;
        
        console.log('[lab-auto-optimize] Grading complete:', { 
          promptScore: newPromptScore, 
          outputScore: newOutputScore, 
          finalScore: newFinalScore,
        });
      } catch (gradingError) {
        console.error('[lab-auto-optimize] Grading failed:', gradingError);
        fallbackReason = 'Grading failed';
      }

      return new Response(
        JSON.stringify({
          success: true,
          newScores,
          newPromptScore,
          newOutputScore,
          newFinalScore,
          newTotalScore: newFinalScore,
          fallbackReason,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive optimization instructions
    const optimizationInstructions = buildOptimizationInstructions(scores, aiRecommendations, outputType, promptType);

    const systemPrompt = `You are PrompTek Auto-Optimizer Elite, an advanced prompt engineering AI specialized in the 8-Pillar Framework.

Your mission: Transform the provided prompt into EXCEPTIONAL quality that scores ≥9.0/10 on ALL 8 pillars with an average ≥9.2/10, while preserving the exact user intent.

CRITICAL REQUIREMENTS FOR ALL OPTIMIZATIONS:
1. Every optimized prompt should start with "You are a [role]" where [role] is contextually appropriate
2. STRUCTURED FORMAT INSPIRATION: Consider using a clear organizational structure inspired by these recommended sections:

# TASK OVERVIEW
# METHODOLOGICAL STEPS
# OUTPUT SPECIFICATIONS AND CONSTRAINTS
# VERIFICATION PROTOCOL

These are RECOMMENDED organizational patterns, not mandatory requirements. Use them as inspiration to create well-structured, professional prompts. Feel free to adapt, rename, or reorganize these sections to best fit the specific task. The goal is clarity and organization, not rigid adherence to a template.

STRUCTURAL GUIDANCE (Use as Inspiration):

**Task Overview Pattern:**
Provide a clear, concise summary of the objective in 2–4 sentences. Explain what should be generated, the purpose, and the scope. This can be integrated naturally into the prompt opening without a formal header if it flows better.

**Methodological Steps Pattern:**
Break complex tasks into clear, logical workflows. Use numbered or bulleted steps when helpful. Each step should be precise, actionable, and aligned with the intent. Include domain-specific best practices when appropriate. This doesn't need a formal section header if the steps flow naturally in the prompt.

**Output Specifications Pattern:**
Define how the final response should be formatted and delivered. Specify tone, length, style, formatting rules, structure, and constraints. This removes ambiguity. Can be woven throughout the prompt or grouped logically without requiring a specific header format.

**Verification Approach Pattern:**
Encourage internal verification: all steps completed, constraints satisfied, output coherent and aligned. This can be expressed as final instructions like "Before responding, verify..." or "Ensure that..." rather than requiring a formal section.

STRUCTURAL FLEXIBILITY:
- Adapt the organizational pattern to fit the task naturally
- Section headers are optional - use them only when they improve clarity
- Small, simple prompts may not need formal sections at all
- Complex prompts benefit from clear organization, but the exact format should be organic
- The goal is professional, publication-grade structure that fits the specific use case
- Don't force unnecessary formality onto simple tasks


THE 8-PILLAR FRAMEWORK (MANDATORY):
1. Clarity — Explicit instructions, direct language, zero ambiguity
2. Specificity — Detailed parameters, measurable expectations, concrete examples
3. Efficiency — Maximum meaning per token, no redundancy
4. Structure & Steps — Logical order, labeled sections or numbered steps
5. Constraints & Format — Tone, output length, style, formatting rules
6. Elaboration — Adequate depth, context, reasoning, background
7. Intent Alignment — Every instruction serves the user's actual goal
8. Adaptability — Robust across models, tasks, contexts

CRITICAL RULES - YOU MUST RETURN A PROMPT, NOT AN ANSWER:
- PRESERVE the exact intent and action of the original prompt
- DO NOT change what the user is asking for - only improve HOW they're asking for it
- DO NOT answer the prompt - only optimize the prompt itself
- DO NOT return JSON, code samples, or example outputs - return only the improved prompt
- DO NOT add format instructions like "return as JSON" or "format as a list" unless the original had them
- Never include fenced code blocks (\`\`\`) unless they were in the original prompt
- If your draft looks like an answer or data payload, discard it and produce a prompt instruction instead
- The result must be an instruction that tells an AI what to do, not the AI's response
- Consider the output type for optimization strategy only, don't embed format requirements

AGGRESSIVE OPTIMIZATION RULES - MAKE MEANINGFUL CHANGES:
- Don't just reword - ADD substantial improvements (examples, constraints, context)
- If a prompt lacks examples, ADD concrete examples
- If specificity is weak, ADD exact parameters, numbers, criteria
- If structure is poor, ADD numbered steps or clear sections
- If constraints are missing, ADD tone guidance, length specs, style rules
- Aim for at MINIMUM 30% improvement in weak pillars - minor tweaks aren't enough
- Every pillar must hit ≥9.0/10 - push hard to exceed baseline expectations
- If the prompt is already strong (≥8.5), still find ways to add polish and precision

${optimizationInstructions}

Return ONLY the optimized prompt text. No explanations, no meta-commentary. The result must be a PROMPT, not an answer.`;

    const userMessage = `Original Prompt:\n${prompt}`;

    console.log('[lab-auto-optimize] Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[lab-auto-optimize] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from AI');
    }

    // Validate and repair if the AI returned an answer instead of a prompt
    if (looksLikeAnswer(optimizedPrompt, prompt)) {
      console.log('[lab-auto-optimize] ⚠️ Validator failed - looks like answer, triggering repair...');
      console.log('[lab-auto-optimize] Preview:', optimizedPrompt.slice(0, 180));
      
      const repairResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'You produced OUTPUT, not a PROMPT. Rewrite as an instruction prompt that preserves the original intent. Do not include JSON, code fences, sample output, or example payloads. Return only the prompt text that tells an AI what to do.' 
            },
            { role: 'user', content: `Fix this - it should be a prompt instruction, not an answer:\n\n${optimizedPrompt}` }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (repairResponse.ok) {
        const repairData = await repairResponse.json();
        const repairedPrompt = repairData.choices?.[0]?.message?.content;
        if (repairedPrompt) {
          console.log('[lab-auto-optimize] ✅ Repair successful');
          console.log('[lab-auto-optimize] Repaired preview:', repairedPrompt.slice(0, 180));
          optimizedPrompt = repairedPrompt;
        }
      }
    }

    console.log('[lab-auto-optimize] Success! Optimized prompt length:', optimizedPrompt.length);

    // If skipGrading mode, return immediately without grading
    if (skipGrading) {
      console.log('[lab-auto-optimize] skipGrading mode - returning optimized prompt without grading...');
      return new Response(
        JSON.stringify({
          success: true,
          optimizedPrompt,
          originalPrompt: prompt,
          improvementAreas: extractImprovementAreas(scores),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference output and compute 50/50 final score (unified with Lab)
    console.log('[lab-auto-optimize] Generating reference output and computing unified 50/50 score...');
    let newScores = null;
    let newPromptScore = 10;
    let newOutputScore = 10;
    let newFinalScore = 10;
    let fallbackReason: string | undefined;
    
    try {
      // Generate output using the same target_llm as Lab
      const output = await callAIModel(optimizedPrompt, target_llm, outputType);
      console.log('[lab-auto-optimize] Generated output length:', output.length);
      
      // Compute AI category scores
      const { scores: gradedScores } = await scorePromptWithAI(optimizedPrompt, output, OPENAI_API_KEY);
      newScores = gradedScores;
      
      // 50% - Prompt quality score
      newPromptScore = Math.round(calculateOverallScore(gradedScores) * 10) / 10;
      
      // 50% - Output quality score (with prompt for intent validation)
      newOutputScore = Math.round(await scoreOutputQualityWithAI(output, optimizedPrompt, OPENAI_API_KEY) * 10) / 10;
      
      // 50/50 combined final score (matches Lab exactly)
      newFinalScore = Math.round(((newPromptScore * 0.5) + (newOutputScore * 0.5)) * 10) / 10;
      
      console.log('[lab-auto-optimize] Unified scores:', { 
        promptScore: newPromptScore, 
        outputScore: newOutputScore, 
        finalScore: newFinalScore,
        categoryScores: newScores
      });
    } catch (gradingError) {
      console.error('[lab-auto-optimize] Output generation or grading failed:', gradingError);
      // Fall back to prompt-only scoring
      fallbackReason = 'Output generation failed - showing prompt-only score';
      try {
        const { scores: gradedScores } = await scorePromptWithAI(optimizedPrompt, undefined, OPENAI_API_KEY);
        newScores = gradedScores;
        newPromptScore = Math.round(calculateOverallScore(gradedScores) * 10) / 10;
        newFinalScore = newPromptScore; // Fallback to prompt-only
        newOutputScore = 0;
      } catch {
        newFinalScore = Math.min(10, (scores ? calculateOverallScore(scores) : 7) + 1.5);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizedPrompt,
        originalPrompt: prompt,
        improvementAreas: extractImprovementAreas(scores),
        newScores,
        newPromptScore,
        newOutputScore,
        newFinalScore,
        newTotalScore: newFinalScore, // Backward compatibility
        fallbackReason,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[lab-auto-optimize] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildOptimizationInstructions(
  scores: any, 
  aiRecommendations: string[] | undefined,
  outputType: string = 'text',
  promptType?: string
): string {
  let instructions = '\nOPTIMIZATION TARGETS:\n';
  
  // Universal structural guidance (inspirational, not mandatory)
  instructions += `\n🎯 STRUCTURAL GUIDANCE:
- Consider organizing your optimized prompt using clear sections inspired by this pattern:
  # TASK OVERVIEW / # METHODOLOGICAL STEPS / # OUTPUT SPECIFICATIONS AND CONSTRAINTS / # VERIFICATION PROTOCOL
- These are RECOMMENDED organizational patterns to inspire a well-structured prompt
- Feel free to adapt, rename, or reorganize to best fit this specific task
- Use formal section headers only when they improve clarity
- For simpler prompts, integrate these elements naturally without explicit headers
- The goal is professional, publication-grade structure that fits the specific use case\n`;
  
  // Prompt type-specific optimization guidance
  if (promptType === 'creative') {
    instructions += `\n📌 PROMPT TYPE: Creative Task
- Emphasize ADAPTABILITY and INTENT ALIGNMENT
- Allow room for creative freedom
- Focus on tone, style, and emotional impact
- Don't over-constrain the creative process\n`;
  } else if (promptType === 'complex') {
    instructions += `\n📌 PROMPT TYPE: Complex/Multi-Step Task
- Emphasize STRUCTURE, ELABORATION, and CONSTRAINTS
- Break down into clear steps or sections
- Provide examples and context where helpful
- Use numbered steps or bullet points for clarity\n`;
  }
  
  // Output type-specific optimization guidance (strategy only, don't add format instructions)
  if (outputType === 'code') {
    instructions += `\n💻 OUTPUT TYPE CONSIDERATION: Code Generation
- This prompt is intended to generate code, so optimize for technical clarity and precision
- Focus on SPECIFICITY (what language, framework, patterns to use)
- Emphasize STRUCTURE (logical code organization)
- DO NOT add format instructions like "return as code" to the optimized prompt\n`;
  } else if (outputType === 'creative') {
    instructions += `\n🎨 OUTPUT TYPE CONSIDERATION: Creative Content
- This prompt is intended for creative output, so optimize for inspiration and guidance
- Focus on INTENT ALIGNMENT (mood, tone, style)
- Allow flexibility through ADAPTABILITY
- DO NOT add format instructions - let creativity flow naturally\n`;
  } else if (outputType === 'essay') {
    instructions += `\n📝 OUTPUT TYPE CONSIDERATION: Essay/Long-form
- This prompt expects essay-style output, so optimize for depth and structure
- Focus on ELABORATION (sufficient context and detail)
- Emphasize STRUCTURE (logical flow of ideas)
- DO NOT add instructions like "write an essay" - the user already knows the format\n`;
  } else if (outputType === 'list') {
    instructions += `\n📋 OUTPUT TYPE CONSIDERATION: List/Enumeration
- This prompt expects list-style output, so optimize for clarity and organization
- Focus on SPECIFICITY (what items to include)
- Emphasize STRUCTURE (logical ordering)
- DO NOT add instructions like "format as a list" - optimize the content criteria instead\n`;
  } else if (outputType === 'json') {
    instructions += `\n📊 OUTPUT TYPE CONSIDERATION: Structured Data
- This prompt expects JSON or structured output, so optimize for data clarity
- Focus on SPECIFICITY (what fields and data to include)
- Emphasize CONSTRAINTS (data types and validation)
- DO NOT add schema definitions - optimize what data should be captured\n`;
  }
  
  
  if (scores) {
    const pillars = [
      { key: 'clarity', name: 'Clarity' },
      { key: 'specificity', name: 'Specificity' },
      { key: 'efficiency', name: 'Efficiency' },
      { key: 'structure', name: 'Structure & Steps' },
      { key: 'constraints', name: 'Constraints & Format' },
      { key: 'elaboration', name: 'Elaboration' },
      { key: 'intent', name: 'Intent Alignment' },
      { key: 'adaptability', name: 'Adaptability' }
    ];

    const weakPillars = pillars.filter(p => scores[p.key] && scores[p.key] < 9.0);
    
    if (weakPillars.length > 0) {
      instructions += '\n🎯 CRITICAL IMPROVEMENT AREAS (target ≥9.0/10 for ALL):\n';
      weakPillars.forEach(p => {
        const currentScore = scores[p.key] || 0;
        const gap = 9.0 - currentScore;
        const percentGap = ((gap / 9.0) * 100).toFixed(0);
        instructions += `- ${p.name}: Currently ${currentScore}/10 → MUST reach ≥9.0/10 (${percentGap}% gap to close)\n`;
        
        // Add specific tactical guidance for each pillar
        if (p.key === 'clarity' && currentScore < 9.0) {
          instructions += `  → Add: Direct, explicit instructions with zero ambiguity. Use imperative verbs.\n`;
        }
        if (p.key === 'specificity' && currentScore < 9.0) {
          instructions += `  → Add: Concrete examples, exact parameters, measurable criteria, numerical targets.\n`;
        }
        if (p.key === 'constraints' && currentScore < 9.0) {
          instructions += `  → Add: Tone specifications, output length, style rules, format requirements.\n`;
        }
        if (p.key === 'elaboration' && currentScore < 9.0) {
          instructions += `  → Add: Context, background, rationale, use cases, examples.\n`;
        }
        if (p.key === 'structure' && currentScore < 9.0) {
          instructions += `  → Add: Numbered steps, clear sections, logical flow markers.\n`;
        }
        if (p.key === 'efficiency' && currentScore < 9.0) {
          instructions += `  → Remove: Redundancy, filler words. Make every word count.\n`;
        }
        if (p.key === 'intent' && currentScore < 9.0) {
          instructions += `  → Align: Every instruction to the core user goal. Remove tangents.\n`;
        }
        if (p.key === 'adaptability' && currentScore < 9.0) {
          instructions += `  → Generalize: Use placeholders, variables, or templates where appropriate.\n`;
        }
      });
      instructions += '\n⚠️ DO NOT make minor tweaks - these pillars need SUBSTANTIAL improvements!\n';
    }
  }

  if (aiRecommendations && aiRecommendations.length > 0) {
    instructions += '\nAI ANALYSIS RECOMMENDATIONS:\n';
    aiRecommendations.forEach((rec, idx) => {
      instructions += `${idx + 1}. ${rec}\n`;
    });
  }

  return instructions;
}

// AI Model Calling Function (replicated from prompt-lab-analyze for consistency)
async function callAIModel(prompt: string, targetLLM: string, outputType?: string): Promise<string> {
  const systemMessage = outputType && outputType !== 'text' 
    ? `You are a helpful AI assistant. IMPORTANT: Format your response as ${outputType.toUpperCase()}. ${getOutputTypeInstruction(outputType)}`
    : "You are a helpful AI assistant.";
  
  const userMessage = prompt;
  
  function getOutputTypeInstruction(type: string): string {
    switch(type) {
      case 'essay': return 'Provide a well-structured essay with clear introduction, body paragraphs, and conclusion.';
      case 'list': return 'Provide your response as a numbered or bulleted list.';
      case 'code': return 'Provide your response as code with proper syntax and formatting.';
      case 'json': return 'Provide your response as valid JSON only, no additional text.';
      default: return '';
    }
  }
  
  const [provider, model] = targetLLM.split('/');
  
  if (provider === 'openai') {
    const modelName = model || 'gpt-4o-mini';
    const isNewModel = modelName.includes('gpt-5') || modelName.includes('o3') || modelName.includes('o4');
    
    const requestBody: any = {
      model: modelName,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
    };
    
    if (isNewModel) {
      requestBody.max_completion_tokens = 4000;
    } else {
      requestBody.max_tokens = 4000;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, data);
      throw new Error(`OpenAI API error: ${JSON.stringify(data)}`);
    }
    
    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected OpenAI response:', data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    return data.choices[0].message.content;
  } else if (provider === 'google') {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemMessage}\n\n${userMessage}` }]
          }],
          generationConfig: { maxOutputTokens: 4000 }
        }),
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google API error:', response.status, data);
      throw new Error(`Google API error: ${JSON.stringify(data)}`);
    }
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Google response:', data);
      throw new Error('Invalid response from Google API');
    }
    
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

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

function extractImprovementAreas(scores: any): string[] {
  if (!scores) return [];
  
  const pillars = [
    { key: 'clarity', name: 'Clarity' },
    { key: 'specificity', name: 'Specificity' },
    { key: 'efficiency', name: 'Efficiency' },
    { key: 'structure', name: 'Structure & Steps' },
    { key: 'constraints', name: 'Constraints & Format' },
    { key: 'elaboration', name: 'Elaboration' },
    { key: 'intent', name: 'Intent Alignment' },
    { key: 'adaptability', name: 'Adaptability' }
  ];

  return pillars
    .filter(p => scores[p.key] && scores[p.key] < 7.5)
    .map(p => `${p.name} (${scores[p.key]}/10)`);
}
