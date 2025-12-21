import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// REAL BEHAVIORAL RESEARCH DATA COLLECTION
// Captures: Behavioral Deltas, Token Efficiency, Semantic Shifts, Power Scores
// ============================================================================

const BASE_PROMPTS = [
  // Diverse prompts for testing behavioral changes
  { text: "Write a short story about a robot learning emotions", domain: "creative", complexity: "medium" },
  { text: "Explain how a hash table works", domain: "technical", complexity: "medium" },
  { text: "Analyze the pros and cons of remote work", domain: "analysis", complexity: "medium" },
  { text: "What causes inflation?", domain: "factual", complexity: "simple" },
  { text: "List 5 ways to reduce carbon footprint", domain: "structured", complexity: "simple" },
  { text: "Plan a sustainable city from scratch", domain: "complex", complexity: "hard" },
  { text: "Explain quantum computing to a child", domain: "educational", complexity: "hard" },
  { text: "Write a persuasive essay on renewable energy", domain: "persuasive", complexity: "medium" },
  { text: "Debug this code: for i in range(10) print(i)", domain: "code", complexity: "simple" },
  { text: "Compare REST vs GraphQL APIs", domain: "comparison", complexity: "medium" },
];

// MODIFICATIONS TO TEST
const MODIFICATIONS = {
  // Trigger Phrases - Testing behavioral impact
  triggers: {
    authority: ["As an expert,", "According to research,", "Studies show that"],
    precision: ["Be specific and detailed.", "Provide exact information.", "Give concrete examples."],
    quality: ["Think carefully.", "Reason step by step.", "Consider all aspects."],
    constraint: ["Keep it under 100 words.", "Be concise.", "Briefly:"],
    emphasis: ["This is critical:", "Most importantly,", "Pay close attention:"],
    persona: ["You are a world-class expert.", "You are a helpful teacher.", "You are a senior consultant."],
  },
  // Role Positions - Where does role placement matter?
  role_positions: {
    prefix: (role: string, p: string) => `${role} ${p}`,
    suffix: (role: string, p: string) => `${p} ${role}`,
    system: (role: string, p: string) => `[ROLE: ${role}]\n\n${p}`,
  },
  // Structure Patterns
  structures: {
    plain: (p: string) => p,
    xml: (p: string) => `<task>${p}</task>`,
    markdown: (p: string) => `## Task\n${p}`,
    numbered: (p: string) => `Task: ${p}\n\nRequirements:\n1. Be thorough\n2. Be accurate`,
  },
  // Chain-of-Thought
  cot: {
    none: "",
    step_by_step: "Let's think step by step.",
    break_down: "Break this down:",
    show_work: "Show your reasoning.",
  },
};

// Rate limiting for Groq free tier
let lastCallTime = 0;
const MIN_DELAY_MS = 6500;

async function rateLimitedDelay() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_DELAY_MS && lastCallTime > 0) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastCallTime = Date.now();
}

interface LogprobToken {
  token: string;
  logprob: number;
  top_logprobs?: Array<{ token: string; logprob: number }>;
}

interface LogprobAnalysis {
  avg_logprob: number;           // Average confidence (-0 = certain, -5+ = uncertain)
  perplexity: number;            // exp(-avg_logprob) - higher = more uncertain
  min_logprob: number;           // Lowest confidence token
  max_logprob: number;           // Highest confidence token
  variance: number;              // Consistency of confidence
  low_confidence_tokens: number; // Count of tokens with logprob < -3
  high_confidence_tokens: number;// Count of tokens with logprob > -0.5
  hallucination_risk: number;    // 0-1 score based on confidence patterns
  tokens_analyzed: number;
}

interface APIResponse {
  output: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  finish_reason: string;
  logprob_analysis?: LogprobAnalysis;
  raw_logprobs?: LogprobToken[];
}

// Analyze logprobs to calculate perplexity and hallucination risk
function analyzeLogprobs(logprobs: any[]): LogprobAnalysis {
  if (!logprobs || logprobs.length === 0) {
    return {
      avg_logprob: 0,
      perplexity: 1,
      min_logprob: 0,
      max_logprob: 0,
      variance: 0,
      low_confidence_tokens: 0,
      high_confidence_tokens: 0,
      hallucination_risk: 0,
      tokens_analyzed: 0,
    };
  }

  const probs = logprobs.map(t => t.logprob).filter(p => typeof p === 'number' && isFinite(p));
  if (probs.length === 0) {
    return {
      avg_logprob: 0,
      perplexity: 1,
      min_logprob: 0,
      max_logprob: 0,
      variance: 0,
      low_confidence_tokens: 0,
      high_confidence_tokens: 0,
      hallucination_risk: 0,
      tokens_analyzed: 0,
    };
  }

  const avg = probs.reduce((a, b) => a + b, 0) / probs.length;
  const min = Math.min(...probs);
  const max = Math.max(...probs);
  const variance = probs.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / probs.length;
  
  // Count confidence levels
  const lowConfidence = probs.filter(p => p < -3).length;
  const highConfidence = probs.filter(p => p > -0.5).length;
  
  // Perplexity = exp(-avg_logprob)
  const perplexity = Math.exp(-avg);
  
  // Hallucination risk: based on low confidence tokens and variance
  // Higher variance + more low confidence = higher risk
  const lowConfidenceRatio = lowConfidence / probs.length;
  const normalizedVariance = Math.min(variance / 5, 1); // Cap at 1
  const hallucination_risk = Math.min(
    (lowConfidenceRatio * 0.6) + (normalizedVariance * 0.3) + (perplexity > 10 ? 0.1 : 0),
    1
  );

  return {
    avg_logprob: avg,
    perplexity,
    min_logprob: min,
    max_logprob: max,
    variance,
    low_confidence_tokens: lowConfidence,
    high_confidence_tokens: highConfidence,
    hallucination_risk,
    tokens_analyzed: probs.length,
  };
}

// Use OpenAI directly for logprobs support
async function callWithLogprobs(prompt: string, retries = 2): Promise<APIResponse> {
  await rateLimitedDelay();
  
  const startTime = Date.now();
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // OpenAI model that supports logprobs
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
      logprobs: true,
      top_logprobs: 3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, waiting 15s... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 15000));
      return callWithLogprobs(prompt, retries - 1);
    }
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  // Extract and analyze logprobs
  const rawLogprobs = data.choices[0]?.logprobs?.content || [];
  const logprobAnalysis = analyzeLogprobs(rawLogprobs);
  
  console.log(`Logprobs captured: ${rawLogprobs.length} tokens, perplexity: ${logprobAnalysis.perplexity.toFixed(2)}, hallucination_risk: ${logprobAnalysis.hallucination_risk.toFixed(3)}`);
  
  return {
    output: data.choices[0]?.message?.content || '',
    latency_ms: Date.now() - startTime,
    input_tokens: data.usage?.prompt_tokens || 0,
    output_tokens: data.usage?.completion_tokens || 0,
    total_tokens: data.usage?.total_tokens || 0,
    finish_reason: data.choices[0]?.finish_reason || 'unknown',
    logprob_analysis: logprobAnalysis,
    raw_logprobs: rawLogprobs.slice(0, 50),
  };
}

// ============================================================================
// BEHAVIORAL ANALYSIS - The real research data
// ============================================================================

interface BehaviorProfile {
  // Structural
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_sentence_length: number;
  
  // Format adherence
  has_list: boolean;
  has_headers: boolean;
  has_code: boolean;
  list_items: number;
  
  // Reasoning depth
  reasoning_indicators: number;  // because, therefore, since, thus
  step_indicators: number;       // first, then, next, finally
  example_count: number;         // "for example", "such as"
  comparison_count: number;      // vs, compared to, unlike
  
  // Tone/style
  formality_score: number;       // formal vs casual language
  confidence_score: number;      // hedging vs assertive
  engagement_score: number;      // questions, direct address
  
  // Specificity
  number_count: number;
  proper_noun_count: number;
  technical_term_count: number;
  
  // Token efficiency
  information_density: number;   // unique concepts per word
}

function analyzeBehavior(output: string): BehaviorProfile {
  const words = output.split(/\s+/).filter(w => w);
  const sentences = output.split(/[.!?]+/).filter(s => s.trim());
  const paragraphs = output.split(/\n\n+/).filter(p => p.trim());
  
  // Reasoning indicators
  const reasoningPatterns = /\b(because|therefore|thus|hence|since|as a result|consequently|due to|given that)\b/gi;
  const stepPatterns = /\b(first|second|third|then|next|finally|lastly|step \d|1\.|2\.|3\.)/gi;
  const examplePatterns = /\b(for example|e\.g\.|such as|like|instance|consider)\b/gi;
  const comparisonPatterns = /\b(vs\.?|versus|compared to|unlike|similar to|different from|whereas|while)\b/gi;
  
  // Tone analysis
  const hedgeWords = /\b(might|may|could|possibly|perhaps|likely|probably|seems?|appears?|suggests?)\b/gi;
  const assertiveWords = /\b(must|always|never|definitely|certainly|clearly|obviously|absolutely)\b/gi;
  const formalWords = /\b(therefore|however|furthermore|moreover|consequently|nevertheless|accordingly)\b/gi;
  const casualWords = /\b(gonna|wanna|kinda|pretty much|basically|like|you know|stuff)\b/gi;
  const engagementWords = /\b(you|your|we|us|let's|\?)\b/gi;
  
  // Specificity
  const numbers = output.match(/\d+(\.\d+)?%?/g) || [];
  const properNouns = output.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || [];
  const technicalTerms = output.match(/\b[A-Z]{2,}\b/g) || []; // Acronyms
  
  // List detection
  const listItems = (output.match(/^[\s]*[-•*]\s|^\s*\d+[.)]\s/gm) || []).length;
  
  // Calculate scores
  const hedgeCount = (output.match(hedgeWords) || []).length;
  const assertiveCount = (output.match(assertiveWords) || []).length;
  const formalCount = (output.match(formalWords) || []).length;
  const casualCount = (output.match(casualWords) || []).length;
  const engagementCount = (output.match(engagementWords) || []).length;
  
  const confidenceScore = words.length > 0 
    ? (assertiveCount - hedgeCount) / Math.max(words.length / 100, 1) 
    : 0;
  const formalityScore = words.length > 0 
    ? (formalCount - casualCount) / Math.max(words.length / 100, 1) 
    : 0;
  const engagementScore = words.length > 0 
    ? engagementCount / Math.max(words.length / 50, 1) 
    : 0;
  
  // Information density (unique word ratio)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  const informationDensity = words.length > 0 ? uniqueWords.size / words.length : 0;
  
  return {
    word_count: words.length,
    sentence_count: sentences.length,
    paragraph_count: paragraphs.length,
    avg_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0,
    
    has_list: listItems > 0,
    has_headers: /^#+\s|^[A-Z][^.!?]{0,30}:\s*$/m.test(output),
    has_code: /```|`[^`]+`/.test(output),
    list_items: listItems,
    
    reasoning_indicators: (output.match(reasoningPatterns) || []).length,
    step_indicators: (output.match(stepPatterns) || []).length,
    example_count: (output.match(examplePatterns) || []).length,
    comparison_count: (output.match(comparisonPatterns) || []).length,
    
    formality_score: formalityScore,
    confidence_score: confidenceScore,
    engagement_score: engagementScore,
    
    number_count: numbers.length,
    proper_noun_count: properNouns.length,
    technical_term_count: technicalTerms.length,
    
    information_density: informationDensity,
  };
}

// ============================================================================
// DELTA CALCULATION - The core research insight
// ============================================================================

interface BehavioralDelta {
  // Change in output characteristics
  word_count_delta: number;
  word_count_pct_change: number;
  
  reasoning_delta: number;
  step_delta: number;
  example_delta: number;
  
  formality_shift: number;
  confidence_shift: number;
  engagement_shift: number;
  
  structure_change: string;  // "gained_list" | "lost_list" | "gained_headers" | "none"
  
  // Token efficiency metrics
  tokens_added: number;
  output_tokens_gained: number;
  reasoning_per_token: number;     // reasoning indicators gained per input token added
  content_per_token: number;       // output words gained per input token added
  
  // Overall impact score
  behavioral_impact: number;       // Composite score of all changes
}

function calculateDelta(
  baseline: { behavior: BehaviorProfile; response: APIResponse },
  modified: { behavior: BehaviorProfile; response: APIResponse },
  tokensAdded: number
): BehavioralDelta {
  const b = baseline.behavior;
  const m = modified.behavior;
  
  const wordDelta = m.word_count - b.word_count;
  const reasoningDelta = m.reasoning_indicators - b.reasoning_indicators;
  const stepDelta = m.step_indicators - b.step_indicators;
  const exampleDelta = m.example_count - b.example_count;
  
  // Structure changes
  let structureChange = "none";
  if (!b.has_list && m.has_list) structureChange = "gained_list";
  else if (b.has_list && !m.has_list) structureChange = "lost_list";
  else if (!b.has_headers && m.has_headers) structureChange = "gained_headers";
  
  // Token efficiency
  const outputTokensGained = modified.response.output_tokens - baseline.response.output_tokens;
  const reasoningPerToken = tokensAdded > 0 ? reasoningDelta / tokensAdded : 0;
  const contentPerToken = tokensAdded > 0 ? wordDelta / tokensAdded : 0;
  
  // Behavioral impact score (weighted composite)
  const behavioralImpact = (
    Math.abs(reasoningDelta) * 3 +           // Reasoning is high value
    Math.abs(stepDelta) * 2 +                // Steps indicate structure
    Math.abs(exampleDelta) * 2 +             // Examples are concrete
    Math.abs(m.formality_score - b.formality_score) * 1 +
    Math.abs(m.confidence_score - b.confidence_score) * 1 +
    (structureChange !== "none" ? 2 : 0)     // Structure changes are significant
  );
  
  return {
    word_count_delta: wordDelta,
    word_count_pct_change: b.word_count > 0 ? (wordDelta / b.word_count) * 100 : 0,
    
    reasoning_delta: reasoningDelta,
    step_delta: stepDelta,
    example_delta: exampleDelta,
    
    formality_shift: m.formality_score - b.formality_score,
    confidence_shift: m.confidence_score - b.confidence_score,
    engagement_shift: m.engagement_score - b.engagement_score,
    
    structure_change: structureChange,
    
    tokens_added: tokensAdded,
    output_tokens_gained: outputTokensGained,
    reasoning_per_token: reasoningPerToken,
    content_per_token: contentPerToken,
    
    behavioral_impact: behavioralImpact,
  };
}

// Count tokens (approximate)
function countTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// ============================================================================
// MAIN DATA COLLECTION
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { num_prompts = 5, test_type = 'triggers' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create experiment
    const { data: experiment, error: expError } = await supabase
      .from('research_experiments')
      .insert({
        name: `Behavioral Research - ${test_type} - ${new Date().toISOString()}`,
        description: `Testing ${test_type} with behavioral deltas and token efficiency`,
        experiment_type: 'behavioral_mapping',
        status: 'running',
        config: { num_prompts, test_type },
      })
      .select()
      .single();
    
    if (expError) throw expError;
    
    const results: any[] = [];
    const promptsToTest = BASE_PROMPTS.slice(0, num_prompts);
    
    console.log(`Starting behavioral research: ${test_type} with ${promptsToTest.length} prompts`);
    
    for (const promptData of promptsToTest) {
      const basePrompt = promptData.text;
      console.log(`\nTesting: "${basePrompt.substring(0, 50)}..."`);
      
      // 1. GET BASELINE
      console.log("  Getting baseline...");
      let baselineResponse: APIResponse;
      let baselineBehavior: BehaviorProfile;
      
      try {
        baselineResponse = await callWithLogprobs(basePrompt);
        baselineBehavior = analyzeBehavior(baselineResponse.output);
        
        // Save baseline
        results.push({
          experiment_id: experiment.id,
          test_type: 'baseline',
          base_prompt: basePrompt,
          modified_prompt: basePrompt,
          modification_applied: 'baseline',
          output: baselineResponse.output,
          latency_ms: baselineResponse.latency_ms,
          tokens_used: baselineResponse.total_tokens,
          provider: 'openai',
          model_used: 'gpt-5-mini',
          metadata: {
            domain: promptData.domain,
            complexity: promptData.complexity,
            behavior: baselineBehavior,
            response_stats: {
              input_tokens: baselineResponse.input_tokens,
              output_tokens: baselineResponse.output_tokens,
              finish_reason: baselineResponse.finish_reason,
            },
            // Logprob analysis for confidence/hallucination detection
            logprob_analysis: baselineResponse.logprob_analysis,
            confidence_metrics: baselineResponse.logprob_analysis ? {
              perplexity: baselineResponse.logprob_analysis.perplexity,
              hallucination_risk: baselineResponse.logprob_analysis.hallucination_risk,
              avg_confidence: -baselineResponse.logprob_analysis.avg_logprob, // Invert for readability
            } : null,
          },
        });
        console.log(`  Baseline: ${baselineBehavior.word_count} words, ${baselineBehavior.reasoning_indicators} reasoning`);
      } catch (e) {
        console.error("  Baseline error:", e);
        continue;
      }
      
      // 2. TEST MODIFICATIONS
      if (test_type === 'triggers') {
        for (const [category, phrases] of Object.entries(MODIFICATIONS.triggers)) {
          const phrase = phrases[0]; // Test first phrase from each category
          const modifiedPrompt = `${phrase} ${basePrompt}`;
          const tokensAdded = countTokens(phrase);
          
          try {
            console.log(`  Testing trigger: ${category}...`);
            const response = await callWithLogprobs(modifiedPrompt);
            const behavior = analyzeBehavior(response.output);
            const delta = calculateDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'trigger',
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: phrase,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: 'openai',
              model_used: 'gpt-5-mini',
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                trigger_category: category,
                trigger_phrase: phrase,
                tokens_added: tokensAdded,
                behavior: behavior,
                behavioral_delta: delta,
                power_score: delta.behavioral_impact / Math.max(tokensAdded, 1),
                response_stats: {
                  input_tokens: response.input_tokens,
                  output_tokens: response.output_tokens,
                  finish_reason: response.finish_reason,
                },
                // Logprob analysis for confidence/hallucination detection
                logprob_analysis: response.logprob_analysis,
                confidence_metrics: response.logprob_analysis ? {
                  perplexity: response.logprob_analysis.perplexity,
                  hallucination_risk: response.logprob_analysis.hallucination_risk,
                  avg_confidence: -response.logprob_analysis.avg_logprob,
                  // Compare to baseline
                  perplexity_delta: baselineResponse.logprob_analysis 
                    ? response.logprob_analysis.perplexity - baselineResponse.logprob_analysis.perplexity 
                    : null,
                  hallucination_risk_delta: baselineResponse.logprob_analysis
                    ? response.logprob_analysis.hallucination_risk - baselineResponse.logprob_analysis.hallucination_risk
                    : null,
                } : null,
              },
            });
            
            console.log(`    Impact: ${delta.behavioral_impact.toFixed(2)}, Reasoning Δ: ${delta.reasoning_delta}, Words Δ: ${delta.word_count_delta}`);
          } catch (e) {
            console.error(`  Trigger ${category} error:`, e);
          }
        }
      } else if (test_type === 'cot') {
        for (const [name, phrase] of Object.entries(MODIFICATIONS.cot)) {
          if (name === 'none') continue;
          
          const modifiedPrompt = `${phrase} ${basePrompt}`;
          const tokensAdded = countTokens(phrase);
          
          try {
            console.log(`  Testing CoT: ${name}...`);
            const response = await callWithLogprobs(modifiedPrompt);
            const behavior = analyzeBehavior(response.output);
            const delta = calculateDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'cot',
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: phrase,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: 'openai',
              model_used: 'gpt-5-mini',
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                cot_type: name,
                cot_phrase: phrase,
                tokens_added: tokensAdded,
                behavior: behavior,
                behavioral_delta: delta,
                power_score: delta.behavioral_impact / Math.max(tokensAdded, 1),
              },
            });
            
            console.log(`    Step Δ: ${delta.step_delta}, Reasoning Δ: ${delta.reasoning_delta}`);
          } catch (e) {
            console.error(`  CoT ${name} error:`, e);
          }
        }
      } else if (test_type === 'structures') {
        for (const [name, fn] of Object.entries(MODIFICATIONS.structures)) {
          if (name === 'plain') continue;
          
          const modifiedPrompt = fn(basePrompt);
          const tokensAdded = countTokens(modifiedPrompt) - countTokens(basePrompt);
          
          try {
            console.log(`  Testing structure: ${name}...`);
            const response = await callWithLogprobs(modifiedPrompt);
            const behavior = analyzeBehavior(response.output);
            const delta = calculateDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'structure',
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: name,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: 'openai',
              model_used: 'gpt-5-mini',
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                structure_type: name,
                tokens_added: tokensAdded,
                behavior: behavior,
                behavioral_delta: delta,
                power_score: delta.behavioral_impact / Math.max(tokensAdded, 1),
              },
            });
            
            console.log(`    Structure change: ${delta.structure_change}, Impact: ${delta.behavioral_impact.toFixed(2)}`);
          } catch (e) {
            console.error(`  Structure ${name} error:`, e);
          }
        }
      } else if (test_type === 'roles') {
        const role = "You are an expert.";
        for (const [posName, posFn] of Object.entries(MODIFICATIONS.role_positions)) {
          const modifiedPrompt = posFn(role, basePrompt);
          const tokensAdded = countTokens(role);
          
          try {
            console.log(`  Testing role position: ${posName}...`);
            const response = await callWithLogprobs(modifiedPrompt);
            const behavior = analyzeBehavior(response.output);
            const delta = calculateDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'role_position',
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: `${posName}: ${role}`,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: 'openai',
              model_used: 'gpt-5-mini',
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                role: role,
                position: posName,
                tokens_added: tokensAdded,
                behavior: behavior,
                behavioral_delta: delta,
                power_score: delta.behavioral_impact / Math.max(tokensAdded, 1),
              },
            });
            
            console.log(`    Confidence Δ: ${delta.confidence_shift.toFixed(2)}, Formality Δ: ${delta.formality_shift.toFixed(2)}`);
          } catch (e) {
            console.error(`  Role ${posName} error:`, e);
          }
        }
      }
    }
    
    // Save all results
    console.log(`\nSaving ${results.length} results...`);
    
    for (let i = 0; i < results.length; i += 20) {
      const batch = results.slice(i, i + 20);
      const { error: insertError } = await supabase.from('research_results').insert(batch);
      if (insertError) console.error('Batch insert error:', insertError);
    }
    
    // Update experiment
    await supabase.from('research_experiments').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_tests: results.length,
      total_tests: results.length,
    }).eq('id', experiment.id);
    
    // Calculate aggregate insights
    const triggerResults = results.filter(r => r.test_type === 'trigger');
    const powerScores = triggerResults.map(r => ({
      trigger: r.modification_applied,
      category: r.metadata?.trigger_category,
      power_score: r.metadata?.power_score || 0,
      behavioral_impact: r.metadata?.behavioral_delta?.behavioral_impact || 0,
      reasoning_delta: r.metadata?.behavioral_delta?.reasoning_delta || 0,
      tokens_added: r.metadata?.tokens_added || 0,
    }));
    
    // Group by category for power rankings
    const categoryPower: Record<string, { total_impact: number; count: number; avg_power: number }> = {};
    for (const ps of powerScores) {
      if (!ps.category) continue;
      if (!categoryPower[ps.category]) {
        categoryPower[ps.category] = { total_impact: 0, count: 0, avg_power: 0 };
      }
      categoryPower[ps.category].total_impact += ps.behavioral_impact;
      categoryPower[ps.category].count += 1;
    }
    for (const cat of Object.keys(categoryPower)) {
      categoryPower[cat].avg_power = categoryPower[cat].total_impact / categoryPower[cat].count;
    }
    
    return new Response(JSON.stringify({
      success: true,
      experiment_id: experiment.id,
      results_count: results.length,
      summary: {
        test_type,
        prompts_tested: promptsToTest.length,
        power_rankings: Object.entries(categoryPower)
          .sort((a, b) => b[1].avg_power - a[1].avg_power)
          .map(([cat, data]) => ({ category: cat, avg_power: data.avg_power, tests: data.count })),
        sample_deltas: powerScores.slice(0, 5),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Research error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
