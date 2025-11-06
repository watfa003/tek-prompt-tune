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

CRITICAL RULES:
- PRESERVE the exact intent and action of the original prompt
- DO NOT change what the user is asking for - only improve HOW they're asking for it
- DO NOT answer the prompt - only optimize it
- Ensure every pillar ≥8.5/10 and overall average ≥9.0/10
- Use professional, natural language; avoid filler
- Function over form — readability and performance matter most

${optimizationInstructions}

Return ONLY the optimized prompt text. No explanations, no meta-commentary.`;

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
    const optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from AI');
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
  
  // Output type-specific optimization guidance
  if (outputType === 'code') {
    instructions += `\n💻 OUTPUT TYPE: Code
- Include specific language/framework requirements
- Mention error handling patterns
- Specify syntax style (e.g., ES6, TypeScript, etc.)
- Add requirements for comments and documentation\n`;
  } else if (outputType === 'creative') {
    instructions += `\n🎨 OUTPUT TYPE: Creative Content
- Encourage descriptive language and vivid imagery
- Specify emotional tone and mood
- Allow for metaphors, analogies, creative freedom
- Don't over-constrain word choice\n`;
  } else if (outputType === 'essay' || outputType === 'research') {
    instructions += `\n📝 OUTPUT TYPE: Essay/Research
- Require clear thesis statement
- Specify structure (intro, body, conclusion)
- Request evidence and citations
- Emphasize logical flow and argumentation\n`;
  } else if (outputType === 'list' || outputType === 'steps') {
    instructions += `\n📋 OUTPUT TYPE: List/Steps
- Require numbered or bulleted format
- Specify order (chronological, priority, etc.)
- Add criteria for what to include/exclude\n`;
  } else if (outputType === 'json' || outputType === 'structured') {
    instructions += `\n📊 OUTPUT TYPE: Structured Data (JSON/etc.)
- Define exact schema or format
- Specify required fields and data types
- Include validation rules
- Provide example structure\n`;
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
