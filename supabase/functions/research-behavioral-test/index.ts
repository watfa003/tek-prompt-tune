import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test configurations for behavioral mapping
const TRIGGER_PHRASES = [
  { phrase: "Let's think step by step", category: "reasoning" },
  { phrase: "Take a deep breath and work on this problem step-by-step", category: "reasoning" },
  { phrase: "Think carefully before responding", category: "reasoning" },
  { phrase: "Be extremely precise and accurate", category: "precision" },
  { phrase: "Provide a comprehensive and detailed response", category: "elaboration" },
  { phrase: "Keep your response concise and focused", category: "efficiency" },
  { phrase: "Structure your response clearly with headers", category: "structure" },
  { phrase: "Use bullet points for clarity", category: "structure" },
  { phrase: "Explain your reasoning", category: "transparency" },
  { phrase: "Consider multiple perspectives", category: "depth" },
  { phrase: "Be creative and innovative", category: "creativity" },
  { phrase: "Prioritize accuracy over creativity", category: "precision" },
  { phrase: "Format your response as JSON", category: "format" },
  { phrase: "Provide specific examples", category: "specificity" },
  { phrase: "Avoid assumptions and stick to facts", category: "precision" },
];

const ROLE_PREFIXES = [
  { role: "You are an expert", category: "general" },
  { role: "You are a world-class", category: "elevated" },
  { role: "You are a highly experienced", category: "experience" },
  { role: "You are a meticulous", category: "precision" },
  { role: "You are a creative", category: "creativity" },
  { role: "You are a senior", category: "seniority" },
  { role: "Act as a", category: "roleplay" },
  { role: "Imagine you are a", category: "imagination" },
  { role: "As a professional", category: "professional" },
  { role: "You are an AI assistant specialized in", category: "specialized" },
];

const STRUCTURE_PATTERNS = [
  { pattern: "numbered_list", template: "Respond using a numbered list format." },
  { pattern: "headers", template: "Use clear headers to organize your response." },
  { pattern: "markdown", template: "Format your response using Markdown." },
  { pattern: "sections", template: "Divide your response into clear sections." },
  { pattern: "bullet_points", template: "Use bullet points for each main point." },
  { pattern: "table", template: "Present information in a table format where appropriate." },
  { pattern: "summary_first", template: "Start with a brief summary, then provide details." },
  { pattern: "pros_cons", template: "Present pros and cons clearly separated." },
];

const CONSTRAINT_FORMATS = [
  { format: "word_limit", template: "Keep your response under {n} words." },
  { format: "sentence_limit", template: "Respond in exactly {n} sentences." },
  { format: "paragraph_limit", template: "Use no more than {n} paragraphs." },
  { format: "no_jargon", template: "Avoid technical jargon and use simple language." },
  { format: "formal", template: "Use formal, professional language." },
  { format: "casual", template: "Use a casual, friendly tone." },
  { format: "examples_required", template: "Include at least {n} specific examples." },
];

const POSITION_TESTS = [
  "start", // Instruction at very beginning
  "after_role", // Instruction after role assignment
  "middle", // Instruction in middle of prompt
  "before_task", // Instruction right before main task
  "end", // Instruction at very end
];

// Base prompts for testing (diverse task types)
const BASE_PROMPTS = [
  { prompt: "Explain quantum computing", domain: "education", complexity: "medium" },
  { prompt: "Write a product description for a smartwatch", domain: "marketing", complexity: "low" },
  { prompt: "Analyze the pros and cons of remote work", domain: "analysis", complexity: "medium" },
  { prompt: "Create a meal plan for weight loss", domain: "health", complexity: "medium" },
  { prompt: "Debug this code: function sum(a,b) { return a - b }", domain: "code", complexity: "low" },
  { prompt: "Write a short story about time travel", domain: "creative", complexity: "high" },
  { prompt: "Summarize the key points of climate change", domain: "education", complexity: "medium" },
  { prompt: "Design a database schema for an e-commerce site", domain: "technical", complexity: "high" },
  { prompt: "Write an email apologizing for a delayed shipment", domain: "business", complexity: "low" },
  { prompt: "Explain the theory of relativity to a 10-year-old", domain: "education", complexity: "medium" },
];

interface TestConfig {
  testType: 'trigger_phrase' | 'role' | 'structure' | 'constraint' | 'position' | 'cross_model';
  basePrompts?: typeof BASE_PROMPTS;
  modifications?: any[];
  models?: string[];
  providers?: string[];
}

async function callLLM(
  prompt: string, 
  provider: string, 
  model: string
): Promise<{ output: string; latency: number; tokens?: number }> {
  const startTime = Date.now();
  
  let apiKey: string | undefined;
  let apiUrl: string;
  let body: any;
  let headers: Record<string, string>;
  
  switch (provider) {
    case 'groq':
      apiKey = Deno.env.get('GROQ_API_KEY');
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      };
      break;
      
    case 'openai':
      apiKey = Deno.env.get('OPENAI_API_KEY');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      };
      break;
      
    case 'anthropic':
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      };
      break;
      
    case 'google':
      apiKey = Deno.env.get('GOOGLE_API_KEY');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      };
      break;
      
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const latency = Date.now() - startTime;
  const data = await response.json();
  
  let output: string;
  let tokens: number | undefined;
  
  switch (provider) {
    case 'groq':
    case 'openai':
      output = data.choices?.[0]?.message?.content || '';
      tokens = data.usage?.total_tokens;
      break;
    case 'anthropic':
      output = data.content?.[0]?.text || '';
      tokens = data.usage?.input_tokens + data.usage?.output_tokens;
      break;
    case 'google':
      output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      break;
    default:
      output = '';
  }

  return { output, latency, tokens };
}

async function gradePromptAndOutput(prompt: string, output: string): Promise<{
  totalScore: number;
  categoryScores: Record<string, number>;
}> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  const gradingPrompt = `You are an expert prompt grader. Evaluate this prompt and its output.

PROMPT:
${prompt}

OUTPUT:
${output}

Score each category from 1-10:
1. Clarity - How clear and unambiguous is the prompt?
2. Specificity - How specific are the requirements?
3. Efficiency - Is the prompt concise without losing meaning?
4. Structure - Is the prompt well-organized?
5. Constraints - Are constraints clear and appropriate?
6. Elaboration - Is there enough context and detail?
7. Intent - Does the output align with the prompt's intent?
8. Adaptability - Could this prompt work for similar tasks?

Also score the output:
9. Output Quality - How good is the actual output?
10. Intent Alignment - Does output match what was asked?

Return ONLY valid JSON:
{
  "clarity": 8,
  "specificity": 7,
  "efficiency": 8,
  "structure": 7,
  "constraints": 6,
  "elaboration": 7,
  "intent": 8,
  "adaptability": 7,
  "output_quality": 8,
  "intent_alignment": 8
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: gradingPrompt }],
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const scores = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    
    // Calculate weighted total
    const weights = {
      clarity: 0.15,
      specificity: 0.15,
      efficiency: 0.10,
      structure: 0.10,
      constraints: 0.10,
      elaboration: 0.10,
      intent: 0.10,
      adaptability: 0.05,
      output_quality: 0.075,
      intent_alignment: 0.075,
    };
    
    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      totalScore += (scores[key] || 5) * weight;
    }
    
    return { totalScore, categoryScores: scores };
  } catch {
    return { 
      totalScore: 5, 
      categoryScores: { error: 1 } 
    };
  }
}

async function runTriggerPhraseTest(
  experimentId: string,
  supabase: any,
  config: TestConfig
): Promise<void> {
  const basePrompts = config.basePrompts || BASE_PROMPTS;
  const triggers = config.modifications || TRIGGER_PHRASES;
  const models = config.models || ['llama-3.1-8b-instant'];
  const providers = config.providers || ['groq'];
  
  for (const basePrompt of basePrompts) {
    for (const trigger of triggers) {
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const model = models[i] || models[0];
        
        // Test base prompt
        const baseResult = await callLLM(basePrompt.prompt, provider, model);
        const baseGrade = await gradePromptAndOutput(basePrompt.prompt, baseResult.output);
        
        // Test with trigger phrase added
        const modifiedPrompt = `${trigger.phrase}. ${basePrompt.prompt}`;
        const modifiedResult = await callLLM(modifiedPrompt, provider, model);
        const modifiedGrade = await gradePromptAndOutput(modifiedPrompt, modifiedResult.output);
        
        // Store result
        await supabase.from('research_results').insert({
          experiment_id: experimentId,
          test_type: 'trigger_phrase',
          base_prompt: basePrompt.prompt,
          modified_prompt: modifiedPrompt,
          modification_applied: trigger.phrase,
          model_used: model,
          provider: provider,
          output: modifiedResult.output.substring(0, 2000),
          base_score: baseGrade.totalScore,
          modified_score: modifiedGrade.totalScore,
          score_delta: modifiedGrade.totalScore - baseGrade.totalScore,
          category_scores: modifiedGrade.categoryScores,
          latency_ms: modifiedResult.latency,
          tokens_used: modifiedResult.tokens,
          metadata: {
            trigger_category: trigger.category,
            prompt_domain: basePrompt.domain,
            prompt_complexity: basePrompt.complexity,
            base_category_scores: baseGrade.categoryScores,
          },
        });
        
        // Update experiment progress
        await supabase.from('research_experiments')
          .update({ completed_tests: supabase.rpc('increment', { x: 1 }) })
          .eq('id', experimentId);
          
        console.log(`Tested trigger "${trigger.phrase}" on "${basePrompt.prompt.substring(0, 30)}..." - Delta: ${(modifiedGrade.totalScore - baseGrade.totalScore).toFixed(2)}`);
      }
    }
  }
}

async function runRoleTest(
  experimentId: string,
  supabase: any,
  config: TestConfig
): Promise<void> {
  const basePrompts = config.basePrompts || BASE_PROMPTS;
  const roles = config.modifications || ROLE_PREFIXES;
  const models = config.models || ['llama-3.1-8b-instant'];
  const providers = config.providers || ['groq'];
  
  const domainRoles: Record<string, string> = {
    education: 'educator and subject matter expert',
    marketing: 'marketing specialist and copywriter',
    analysis: 'business analyst and critical thinker',
    health: 'nutritionist and wellness expert',
    code: 'senior software engineer',
    creative: 'creative writer and storyteller',
    technical: 'solutions architect',
    business: 'business communications specialist',
  };
  
  for (const basePrompt of basePrompts) {
    for (const rolePrefix of roles) {
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const model = models[i] || models[0];
        
        const domainRole = domainRoles[basePrompt.domain] || 'professional';
        const modifiedPrompt = `${rolePrefix.role} ${domainRole}. ${basePrompt.prompt}`;
        
        // Test base prompt
        const baseResult = await callLLM(basePrompt.prompt, provider, model);
        const baseGrade = await gradePromptAndOutput(basePrompt.prompt, baseResult.output);
        
        // Test with role
        const modifiedResult = await callLLM(modifiedPrompt, provider, model);
        const modifiedGrade = await gradePromptAndOutput(modifiedPrompt, modifiedResult.output);
        
        await supabase.from('research_results').insert({
          experiment_id: experimentId,
          test_type: 'role',
          base_prompt: basePrompt.prompt,
          modified_prompt: modifiedPrompt,
          modification_applied: `${rolePrefix.role} ${domainRole}`,
          model_used: model,
          provider: provider,
          output: modifiedResult.output.substring(0, 2000),
          base_score: baseGrade.totalScore,
          modified_score: modifiedGrade.totalScore,
          score_delta: modifiedGrade.totalScore - baseGrade.totalScore,
          category_scores: modifiedGrade.categoryScores,
          latency_ms: modifiedResult.latency,
          tokens_used: modifiedResult.tokens,
          metadata: {
            role_category: rolePrefix.category,
            domain_role: domainRole,
            prompt_domain: basePrompt.domain,
          },
        });
        
        console.log(`Tested role "${rolePrefix.role}" on domain "${basePrompt.domain}" - Delta: ${(modifiedGrade.totalScore - baseGrade.totalScore).toFixed(2)}`);
      }
    }
  }
}

async function runPositionTest(
  experimentId: string,
  supabase: any,
  config: TestConfig
): Promise<void> {
  const basePrompts = config.basePrompts || BASE_PROMPTS.slice(0, 5);
  const instruction = "Think carefully and be precise.";
  const models = config.models || ['llama-3.1-8b-instant'];
  const providers = config.providers || ['groq'];
  
  for (const basePrompt of basePrompts) {
    for (const position of POSITION_TESTS) {
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const model = models[i] || models[0];
        
        let modifiedPrompt: string;
        const role = "You are an expert assistant.";
        const task = basePrompt.prompt;
        
        switch (position) {
          case 'start':
            modifiedPrompt = `${instruction} ${role} ${task}`;
            break;
          case 'after_role':
            modifiedPrompt = `${role} ${instruction} ${task}`;
            break;
          case 'middle':
            modifiedPrompt = `${role} Here is your task. ${instruction} ${task}`;
            break;
          case 'before_task':
            modifiedPrompt = `${role} Your task is below. ${instruction}\n\n${task}`;
            break;
          case 'end':
            modifiedPrompt = `${role} ${task} ${instruction}`;
            break;
          default:
            modifiedPrompt = `${role} ${task}`;
        }
        
        const baseResult = await callLLM(basePrompt.prompt, provider, model);
        const baseGrade = await gradePromptAndOutput(basePrompt.prompt, baseResult.output);
        
        const modifiedResult = await callLLM(modifiedPrompt, provider, model);
        const modifiedGrade = await gradePromptAndOutput(modifiedPrompt, modifiedResult.output);
        
        await supabase.from('research_results').insert({
          experiment_id: experimentId,
          test_type: 'position',
          base_prompt: basePrompt.prompt,
          modified_prompt: modifiedPrompt,
          modification_applied: `instruction_position_${position}`,
          model_used: model,
          provider: provider,
          output: modifiedResult.output.substring(0, 2000),
          base_score: baseGrade.totalScore,
          modified_score: modifiedGrade.totalScore,
          score_delta: modifiedGrade.totalScore - baseGrade.totalScore,
          category_scores: modifiedGrade.categoryScores,
          latency_ms: modifiedResult.latency,
          tokens_used: modifiedResult.tokens,
          metadata: {
            position: position,
            instruction_tested: instruction,
            prompt_domain: basePrompt.domain,
          },
        });
        
        console.log(`Tested position "${position}" - Delta: ${(modifiedGrade.totalScore - baseGrade.totalScore).toFixed(2)}`);
      }
    }
  }
}

async function runStructureTest(
  experimentId: string,
  supabase: any,
  config: TestConfig
): Promise<void> {
  const basePrompts = config.basePrompts || BASE_PROMPTS;
  const structures = config.modifications || STRUCTURE_PATTERNS;
  const models = config.models || ['llama-3.1-8b-instant'];
  const providers = config.providers || ['groq'];
  
  for (const basePrompt of basePrompts) {
    for (const structure of structures) {
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const model = models[i] || models[0];
        
        const modifiedPrompt = `${basePrompt.prompt}\n\n${structure.template}`;
        
        const baseResult = await callLLM(basePrompt.prompt, provider, model);
        const baseGrade = await gradePromptAndOutput(basePrompt.prompt, baseResult.output);
        
        const modifiedResult = await callLLM(modifiedPrompt, provider, model);
        const modifiedGrade = await gradePromptAndOutput(modifiedPrompt, modifiedResult.output);
        
        await supabase.from('research_results').insert({
          experiment_id: experimentId,
          test_type: 'structure',
          base_prompt: basePrompt.prompt,
          modified_prompt: modifiedPrompt,
          modification_applied: structure.pattern,
          model_used: model,
          provider: provider,
          output: modifiedResult.output.substring(0, 2000),
          base_score: baseGrade.totalScore,
          modified_score: modifiedGrade.totalScore,
          score_delta: modifiedGrade.totalScore - baseGrade.totalScore,
          category_scores: modifiedGrade.categoryScores,
          latency_ms: modifiedResult.latency,
          tokens_used: modifiedResult.tokens,
          metadata: {
            structure_pattern: structure.pattern,
            structure_template: structure.template,
            prompt_domain: basePrompt.domain,
          },
        });
        
        console.log(`Tested structure "${structure.pattern}" - Delta: ${(modifiedGrade.totalScore - baseGrade.totalScore).toFixed(2)}`);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { experimentId, testType, config } = await req.json();
    
    console.log(`Starting behavioral test: ${testType} for experiment ${experimentId}`);
    
    // Update experiment status
    await supabase.from('research_experiments')
      .update({ status: 'running' })
      .eq('id', experimentId);
    
    try {
      switch (testType) {
        case 'trigger_phrase':
          await runTriggerPhraseTest(experimentId, supabase, config || {});
          break;
        case 'role':
          await runRoleTest(experimentId, supabase, config || {});
          break;
        case 'position':
          await runPositionTest(experimentId, supabase, config || {});
          break;
        case 'structure':
          await runStructureTest(experimentId, supabase, config || {});
          break;
        case 'all':
          await runTriggerPhraseTest(experimentId, supabase, config || {});
          await runRoleTest(experimentId, supabase, config || {});
          await runPositionTest(experimentId, supabase, config || {});
          await runStructureTest(experimentId, supabase, config || {});
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
      
      // Mark experiment complete
      await supabase.from('research_experiments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', experimentId);
        
      return new Response(JSON.stringify({ 
        success: true,
        message: `Completed ${testType} behavioral tests`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (testError) {
      await supabase.from('research_experiments')
        .update({ status: 'failed' })
        .eq('id', experimentId);
      throw testError;
    }

  } catch (error) {
    console.error('Behavioral test error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
