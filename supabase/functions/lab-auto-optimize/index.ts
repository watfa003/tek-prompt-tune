import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
      promptType
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
      promptType
    });

    // Build comprehensive optimization instructions
    const optimizationInstructions = buildOptimizationInstructions(scores, aiRecommendations, outputType, promptType);

    const systemPrompt = `You are PrompTek Auto-Optimizer, an advanced prompt engineering AI specialized in the 8-Pillar Framework.

Your mission: Transform the provided prompt into an optimized version that scores ≥8.5/10 on ALL 8 pillars while preserving the exact user intent.

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
- Never include fenced code blocks (``` ```) unless they were in the original prompt
- If your draft looks like an answer or data payload, discard it and produce a prompt instruction instead
- The result must be an instruction that tells an AI what to do, not the AI's response
- Consider the output type for optimization strategy only, don't embed format requirements
- Ensure every pillar ≥8.5/10 and overall average ≥9.0/10
- Use professional, natural language; avoid filler
- Function over form — readability and performance matter most

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

    return new Response(
      JSON.stringify({
        success: true,
        optimizedPrompt,
        originalPrompt: prompt,
        improvementAreas: extractImprovementAreas(scores),
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

    const weakPillars = pillars.filter(p => scores[p.key] && scores[p.key] < 8.5);
    
    if (weakPillars.length > 0) {
      instructions += '\nFocus on improving these pillars (currently below 8.5):\n';
      weakPillars.forEach(p => {
        instructions += `- ${p.name}: Current score ${scores[p.key]}/10 → Target ≥8.5/10\n`;
      });
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
    .filter(p => scores[p.key] && scores[p.key] < 8.5)
    .map(p => `${p.name} (${scores[p.key]}/10)`);
}
