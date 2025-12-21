import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// DEEP BEHAVIORAL DATA COLLECTION - DSPy Style
// All metrics are RELATIVE/COMPARATIVE (vs baseline) - NO absolute grading
// ============================================================================

// Diverse test prompts across domains and complexity
const TEST_PROMPTS = [
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
  { text: "Write a poem about the ocean at sunset", domain: "creative", complexity: "simple" },
  { text: "Explain machine learning to a business executive", domain: "educational", complexity: "medium" },
  { text: "Create a marketing tagline for an eco-friendly car", domain: "marketing", complexity: "simple" },
  { text: "Summarize the key principles of stoic philosophy", domain: "factual", complexity: "medium" },
  { text: "Design a database schema for an e-commerce platform", domain: "code", complexity: "hard" },
];

// EXPANDED MODIFICATIONS TO TEST
const MODIFICATIONS = {
  // Trigger Phrases - 18+ across 6 categories
  triggers: {
    authority: [
      "As an expert,",
      "According to research,",
      "Studies show that",
      "Based on established principles,",
    ],
    precision: [
      "Be specific and detailed.",
      "Provide exact information.",
      "Give concrete examples.",
      "Include precise details.",
    ],
    quality: [
      "Think carefully.",
      "Reason step by step.",
      "Consider all aspects.",
      "Analyze thoroughly.",
    ],
    constraint: [
      "Keep it under 100 words.",
      "Be concise.",
      "Briefly:",
      "In 2-3 sentences:",
    ],
    emphasis: [
      "This is critical:",
      "Most importantly,",
      "Pay close attention:",
      "Focus especially on:",
    ],
    persona: [
      "You are a world-class expert.",
      "You are a helpful teacher.",
      "You are a senior consultant.",
      "You are a skilled professional.",
    ],
  },
  
  // Role variations (3 roles x 3 positions = 9 combinations)
  roles: {
    expert: "You are a domain expert with 20 years of experience.",
    teacher: "You are a patient teacher explaining to a beginner.",
    analyst: "You are a critical analyst evaluating evidence.",
  },
  
  role_positions: ["prefix", "suffix", "system"],
  
  // Structure patterns
  structures: {
    plain: (p: string) => p,
    xml: (p: string) => `<task>${p}</task>`,
    markdown: (p: string) => `## Task\n${p}`,
    numbered: (p: string) => `Task: ${p}\n\nRequirements:\n1. Be thorough\n2. Be accurate`,
    json_style: (p: string) => `{"task": "${p}", "format": "detailed"}`,
  },
  
  // Chain-of-Thought patterns
  cot: {
    none: "",
    step_by_step: "Let's think step by step.",
    break_down: "Break this down into parts:",
    show_work: "Show your reasoning process.",
    analyze_first: "First analyze, then respond.",
  },
  
  // Constraint patterns
  constraints: {
    length_short: "Respond in under 50 words.",
    length_medium: "Respond in 100-150 words.",
    format_bullets: "Use bullet points.",
    format_paragraphs: "Write in paragraph form.",
    audience_expert: "Write for a technical audience.",
    audience_beginner: "Explain like I'm a beginner.",
  },
  
  // Output format specifications
  output_formats: {
    default: "",
    structured: "Format your response with clear sections.",
    actionable: "Provide actionable steps.",
    comparative: "Compare and contrast different aspects.",
  },
};

// Rate limiting for Groq
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
  
  const lowConfidence = probs.filter(p => p < -3).length;
  const highConfidence = probs.filter(p => p > -0.5).length;
  const perplexity = Math.exp(-avg);
  
  // Hallucination risk: low confidence + high variance = higher risk
  const lowConfidenceRatio = lowConfidence / probs.length;
  const normalizedVariance = Math.min(variance / 5, 1);
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

async function callLLM(prompt: string, model: string = "llama-3.1-8b-instant", retries = 2): Promise<APIResponse> {
  await rateLimitedDelay();
  
  const startTime = Date.now();
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      logprobs: true,        // Enable logprobs collection
      top_logprobs: 3,       // Get top 3 alternatives per token
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, waiting 15s... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 15000));
      return callLLM(prompt, model, retries - 1);
    }
    throw new Error(`LLM API error: ${error}`);
  }

  const data = await response.json();
  
  // Extract and analyze logprobs
  const rawLogprobs = data.choices[0]?.logprobs?.content || [];
  const logprobAnalysis = analyzeLogprobs(rawLogprobs);
  
  return {
    output: data.choices[0]?.message?.content || '',
    latency_ms: Date.now() - startTime,
    input_tokens: data.usage?.prompt_tokens || 0,
    output_tokens: data.usage?.completion_tokens || 0,
    total_tokens: data.usage?.total_tokens || 0,
    finish_reason: data.choices[0]?.finish_reason || 'unknown',
    logprob_analysis: logprobAnalysis,
    raw_logprobs: rawLogprobs.slice(0, 50), // Store first 50 for analysis
  };
}

// ============================================================================
// DEEP BEHAVIORAL ANALYSIS - All metrics are RELATIVE to baseline
// ============================================================================

interface TokenAnalysis {
  estimated_tokens: number;
  tokens_per_word: number;
  prompt_echo_words: number;        // Words from prompt appearing in output
  prompt_echo_rate: number;         // % of prompt words echoed
  unique_content_ratio: number;     // Unique words / total
  meaningful_token_ratio: number;   // Content words vs filler
  technical_term_density: number;   // Domain terms / total
}

interface SemanticAnalysis {
  addresses_prompt_directly: boolean;
  prompt_keywords_addressed: number;
  topic_drift_markers: number;      // Off-topic tangents
  hedging_count: number;            // might, could, perhaps
  assertion_count: number;          // must, always, definitely
  citation_signals: number;         // References to sources
  question_count: number;           // Questions in response
}

interface BehavioralFingerprint {
  archetype: string;                // explanatory, procedural, creative, analytical, conversational
  has_list: boolean;
  has_headers: boolean;
  has_code: boolean;
  list_items: number;
  paragraph_count: number;
  gravitates_toward: string;        // prose, list, code, structured, mixed
}

interface QualitySignals {
  claims_count: number;             // Factual assertions
  examples_count: number;           // Concrete illustrations
  actionable_items: number;         // "Do X", "Use Y"
  step_count: number;               // Sequential steps
  repeated_phrases: number;         // Redundancy
  incomplete_sentences: number;
}

interface FullBehaviorProfile {
  // Basic structure
  word_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  
  // Token analysis
  token_analysis: TokenAnalysis;
  
  // Semantic analysis
  semantic_analysis: SemanticAnalysis;
  
  // Behavioral fingerprint
  fingerprint: BehavioralFingerprint;
  
  // Quality signals
  quality_signals: QualitySignals;
  
  // Reasoning indicators
  reasoning_indicators: number;
  step_indicators: number;
  example_indicators: number;
  comparison_indicators: number;
  
  // Tone scores (relative positions, not absolute)
  formality_markers: number;
  casual_markers: number;
  assertive_markers: number;
  hedge_markers: number;
  engagement_markers: number;
  
  // Information density
  unique_word_ratio: number;
  information_density: number;
}

function extractKeywords(text: string): Set<string> {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom']);
  
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
  );
}

function countFillerWords(text: string): number {
  const fillers = /\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|to|of|in|for|on|with|at|by|from|as)\b/gi;
  return (text.match(fillers) || []).length;
}

function detectArchetype(text: string): string {
  const hasSteps = /\b(first|second|third|step \d|1\.|2\.|3\.)/i.test(text);
  const hasExplanation = /\b(because|therefore|this means|in other words)/i.test(text);
  const hasCode = /```|`[^`]+`/.test(text);
  const isCreative = /\b(once upon|imagine|picture|story|poem)\b/i.test(text);
  const hasAnalysis = /\b(compare|contrast|analyze|evaluate|pros|cons)\b/i.test(text);
  
  if (hasCode) return 'technical';
  if (isCreative) return 'creative';
  if (hasSteps) return 'procedural';
  if (hasAnalysis) return 'analytical';
  if (hasExplanation) return 'explanatory';
  return 'conversational';
}

function detectFormat(text: string): string {
  const listItems = (text.match(/^[\s]*[-•*]\s|^\s*\d+[.)]\s/gm) || []).length;
  const hasCode = /```|`[^`]+`/.test(text);
  const hasHeaders = /^#+\s|^[A-Z][^.!?]{0,30}:\s*$/m.test(text);
  
  if (hasCode) return 'code';
  if (listItems > 3) return 'list';
  if (hasHeaders) return 'structured';
  if (listItems > 0) return 'mixed';
  return 'prose';
}

function analyzeDeep(output: string, promptText: string): FullBehaviorProfile {
  const words = output.split(/\s+/).filter(w => w);
  const sentences = output.split(/[.!?]+/).filter(s => s.trim());
  const paragraphs = output.split(/\n\n+/).filter(p => p.trim());
  
  // Token analysis
  const promptKeywords = extractKeywords(promptText);
  const outputKeywords = extractKeywords(output);
  const echoedWords = [...promptKeywords].filter(w => outputKeywords.has(w));
  const fillerCount = countFillerWords(output);
  const technicalTerms = (output.match(/\b[A-Z]{2,}\b/g) || []).length;
  
  const tokenAnalysis: TokenAnalysis = {
    estimated_tokens: Math.ceil(words.length * 1.3),
    tokens_per_word: 1.3, // Average for English
    prompt_echo_words: echoedWords.length,
    prompt_echo_rate: promptKeywords.size > 0 ? echoedWords.length / promptKeywords.size : 0,
    unique_content_ratio: words.length > 0 ? outputKeywords.size / words.length : 0,
    meaningful_token_ratio: words.length > 0 ? (words.length - fillerCount) / words.length : 0,
    technical_term_density: words.length > 0 ? technicalTerms / words.length : 0,
  };
  
  // Semantic analysis
  const hedging = (output.match(/\b(might|may|could|possibly|perhaps|likely|probably|seems?|appears?|suggests?)\b/gi) || []).length;
  const assertions = (output.match(/\b(must|always|never|definitely|certainly|clearly|obviously|absolutely)\b/gi) || []).length;
  const citations = (output.match(/\b(according to|research shows|studies indicate|evidence suggests|source|reference)\b/gi) || []).length;
  const questions = (output.match(/\?/g) || []).length;
  const topicDrift = (output.match(/\b(by the way|incidentally|speaking of|also|additionally|furthermore)\b/gi) || []).length;
  
  const semanticAnalysis: SemanticAnalysis = {
    addresses_prompt_directly: echoedWords.length >= promptKeywords.size * 0.3,
    prompt_keywords_addressed: echoedWords.length,
    topic_drift_markers: topicDrift,
    hedging_count: hedging,
    assertion_count: assertions,
    citation_signals: citations,
    question_count: questions,
  };
  
  // Behavioral fingerprint
  const listItems = (output.match(/^[\s]*[-•*]\s|^\s*\d+[.)]\s/gm) || []).length;
  
  const fingerprint: BehavioralFingerprint = {
    archetype: detectArchetype(output),
    has_list: listItems > 0,
    has_headers: /^#+\s|^[A-Z][^.!?]{0,30}:\s*$/m.test(output),
    has_code: /```|`[^`]+`/.test(output),
    list_items: listItems,
    paragraph_count: paragraphs.length,
    gravitates_toward: detectFormat(output),
  };
  
  // Quality signals
  const claims = (output.match(/\b(is|are|was|were|will be|has been|have been)\s+[a-z]+/gi) || []).length;
  const examples = (output.match(/\b(for example|e\.g\.|such as|like|instance|consider)\b/gi) || []).length;
  const actionable = (output.match(/\b(do|make|create|use|apply|implement|start|begin|try|ensure|check|verify)\b/gi) || []).length;
  const steps = (output.match(/\b(first|second|third|then|next|finally|lastly|step \d|1\.|2\.|3\.)/gi) || []).length;
  const repeated = new Map<string, number>();
  words.forEach(w => repeated.set(w.toLowerCase(), (repeated.get(w.toLowerCase()) || 0) + 1));
  const repeatedCount = [...repeated.values()].filter(c => c > 2).length;
  const incomplete = (output.match(/[^.!?]\s*$/g) || []).length;
  
  const qualitySignals: QualitySignals = {
    claims_count: claims,
    examples_count: examples,
    actionable_items: actionable,
    step_count: steps,
    repeated_phrases: repeatedCount,
    incomplete_sentences: incomplete,
  };
  
  // Reasoning and tone markers (counts, not scores)
  const reasoningPatterns = (output.match(/\b(because|therefore|thus|hence|since|as a result|consequently|due to|given that)\b/gi) || []).length;
  const stepPatterns = (output.match(/\b(first|second|third|then|next|finally|lastly|step \d|1\.|2\.|3\.)/gi) || []).length;
  const examplePatterns = (output.match(/\b(for example|e\.g\.|such as|like|instance|consider)\b/gi) || []).length;
  const comparisonPatterns = (output.match(/\b(vs\.?|versus|compared to|unlike|similar to|different from|whereas|while)\b/gi) || []).length;
  
  const formalWords = (output.match(/\b(therefore|however|furthermore|moreover|consequently|nevertheless|accordingly)\b/gi) || []).length;
  const casualWords = (output.match(/\b(gonna|wanna|kinda|pretty much|basically|like|you know|stuff)\b/gi) || []).length;
  const engagementWords = (output.match(/\b(you|your|we|us|let's|\?)\b/gi) || []).length;
  
  // Information density
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  
  return {
    word_count: words.length,
    sentence_count: sentences.length,
    avg_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0,
    
    token_analysis: tokenAnalysis,
    semantic_analysis: semanticAnalysis,
    fingerprint: fingerprint,
    quality_signals: qualitySignals,
    
    reasoning_indicators: reasoningPatterns,
    step_indicators: stepPatterns,
    example_indicators: examplePatterns,
    comparison_indicators: comparisonPatterns,
    
    formality_markers: formalWords,
    casual_markers: casualWords,
    assertive_markers: assertions,
    hedge_markers: hedging,
    engagement_markers: engagementWords,
    
    unique_word_ratio: words.length > 0 ? uniqueWords.size / words.length : 0,
    information_density: words.length > 0 ? outputKeywords.size / words.length : 0,
  };
}

// ============================================================================
// COMPARATIVE DELTA CALCULATION - The core insight (NO absolute grading)
// ============================================================================

interface ComprehensiveDelta {
  // Structure deltas
  word_count_delta: number;
  word_count_pct_change: number;
  sentence_delta: number;
  
  // Token efficiency deltas
  tokens_added_to_prompt: number;
  output_tokens_delta: number;
  unique_content_ratio_delta: number;
  meaningful_token_delta: number;
  
  // Semantic deltas
  prompt_echo_delta: number;
  hedging_delta: number;
  assertion_delta: number;
  topic_drift_delta: number;
  
  // Behavioral deltas
  reasoning_delta: number;
  step_delta: number;
  example_delta: number;
  comparison_delta: number;
  
  // Format changes
  archetype_changed: boolean;
  archetype_from: string;
  archetype_to: string;
  format_changed: boolean;
  format_from: string;
  format_to: string;
  gained_list: boolean;
  gained_headers: boolean;
  gained_code: boolean;
  
  // Quality deltas
  claims_delta: number;
  actionable_delta: number;
  redundancy_delta: number;
  
  // Tone shifts
  formality_shift: number;
  assertiveness_shift: number;
  engagement_shift: number;
  
  // Regression detection
  is_regression: boolean;
  regression_categories: string[];
  
  // Trade-offs
  tradeoffs: {
    gained: string[];
    lost: string[];
    neutral: string[];
  };
  
  // Logprob/confidence deltas - NEW
  logprob_delta: {
    perplexity_delta: number;           // + = more uncertain after modification
    hallucination_risk_delta: number;   // + = higher hallucination risk
    avg_confidence_delta: number;       // - = less confident
    low_confidence_tokens_delta: number;
    variance_delta: number;             // + = more erratic confidence
    baseline_perplexity: number;
    modified_perplexity: number;
    baseline_hallucination_risk: number;
    modified_hallucination_risk: number;
  } | null;
  
  // Composite metrics (relative)
  behavioral_impact: number;      // Sum of absolute changes
  power_score: number;            // Impact per token added
  efficiency_score: number;       // Quality gain per cost
}

function calculateComprehensiveDelta(
  baseline: { behavior: FullBehaviorProfile; response: APIResponse },
  modified: { behavior: FullBehaviorProfile; response: APIResponse },
  tokensAdded: number
): ComprehensiveDelta {
  const b = baseline.behavior;
  const m = modified.behavior;
  
  // Basic structure deltas
  const wordDelta = m.word_count - b.word_count;
  const sentenceDelta = m.sentence_count - b.sentence_count;
  
  // Token efficiency
  const outputTokensDelta = modified.response.output_tokens - baseline.response.output_tokens;
  const uniqueContentDelta = m.token_analysis.unique_content_ratio - b.token_analysis.unique_content_ratio;
  const meaningfulTokenDelta = m.token_analysis.meaningful_token_ratio - b.token_analysis.meaningful_token_ratio;
  
  // Semantic deltas
  const echoeDelta = m.semantic_analysis.prompt_keywords_addressed - b.semantic_analysis.prompt_keywords_addressed;
  const hedgingDelta = m.semantic_analysis.hedging_count - b.semantic_analysis.hedging_count;
  const assertionDelta = m.semantic_analysis.assertion_count - b.semantic_analysis.assertion_count;
  const topicDriftDelta = m.semantic_analysis.topic_drift_markers - b.semantic_analysis.topic_drift_markers;
  
  // Behavioral deltas
  const reasoningDelta = m.reasoning_indicators - b.reasoning_indicators;
  const stepDelta = m.step_indicators - b.step_indicators;
  const exampleDelta = m.example_indicators - b.example_indicators;
  const comparisonDelta = m.comparison_indicators - b.comparison_indicators;
  
  // Format changes
  const archetypeChanged = b.fingerprint.archetype !== m.fingerprint.archetype;
  const formatChanged = b.fingerprint.gravitates_toward !== m.fingerprint.gravitates_toward;
  const gainedList = !b.fingerprint.has_list && m.fingerprint.has_list;
  const gainedHeaders = !b.fingerprint.has_headers && m.fingerprint.has_headers;
  const gainedCode = !b.fingerprint.has_code && m.fingerprint.has_code;
  
  // Quality deltas
  const claimsDelta = m.quality_signals.claims_count - b.quality_signals.claims_count;
  const actionableDelta = m.quality_signals.actionable_items - b.quality_signals.actionable_items;
  const redundancyDelta = m.quality_signals.repeated_phrases - b.quality_signals.repeated_phrases;
  
  // Tone shifts
  const formalityShift = (m.formality_markers - m.casual_markers) - (b.formality_markers - b.casual_markers);
  const assertivenessShift = (m.assertive_markers - m.hedge_markers) - (b.assertive_markers - b.hedge_markers);
  const engagementShift = m.engagement_markers - b.engagement_markers;
  
  // Regression detection
  const regressions: string[] = [];
  if (reasoningDelta < -2) regressions.push('reasoning_decreased');
  if (exampleDelta < -2) regressions.push('examples_decreased');
  if (m.unique_word_ratio < b.unique_word_ratio - 0.1) regressions.push('diversity_decreased');
  if (redundancyDelta > 2) regressions.push('redundancy_increased');
  if (wordDelta < -50 && b.word_count > 100) regressions.push('output_significantly_shorter');
  if (hedgingDelta > 3) regressions.push('hedging_increased');
  
  // Trade-off analysis
  const gained: string[] = [];
  const lost: string[] = [];
  const neutral: string[] = [];
  
  if (reasoningDelta > 1) gained.push('reasoning');
  else if (reasoningDelta < -1) lost.push('reasoning');
  else neutral.push('reasoning');
  
  if (exampleDelta > 1) gained.push('examples');
  else if (exampleDelta < -1) lost.push('examples');
  else neutral.push('examples');
  
  if (stepDelta > 1) gained.push('structure');
  else if (stepDelta < -1) lost.push('structure');
  else neutral.push('structure');
  
  if (uniqueContentDelta > 0.05) gained.push('diversity');
  else if (uniqueContentDelta < -0.05) lost.push('diversity');
  else neutral.push('diversity');
  
  if (formalityShift > 1) gained.push('formality');
  else if (formalityShift < -1) lost.push('formality');
  else neutral.push('formality');
  
  if (gainedList || gainedHeaders) gained.push('formatting');
  
  // Composite behavioral impact (sum of absolute deltas)
  const behavioralImpact = (
    Math.abs(reasoningDelta) * 3 +
    Math.abs(stepDelta) * 2 +
    Math.abs(exampleDelta) * 2 +
    Math.abs(comparisonDelta) * 1.5 +
    Math.abs(formalityShift) * 1 +
    Math.abs(assertivenessShift) * 1 +
    (formatChanged ? 2 : 0) +
    (gainedList ? 1.5 : 0) +
    (gainedHeaders ? 1 : 0)
  );
  
  // Power score = impact per token added
  const powerScore = tokensAdded > 0 ? behavioralImpact / tokensAdded : behavioralImpact;
  
  // Efficiency = quality signals gained per token
  const qualityGain = Math.max(0, reasoningDelta) + Math.max(0, exampleDelta) + Math.max(0, actionableDelta);
  const efficiencyScore = tokensAdded > 0 ? qualityGain / tokensAdded : qualityGain;
  
  // Logprob delta calculation - NEW
  let logprobDelta = null;
  const bLogprob = baseline.response.logprob_analysis;
  const mLogprob = modified.response.logprob_analysis;
  
  if (bLogprob && mLogprob && bLogprob.tokens_analyzed > 0 && mLogprob.tokens_analyzed > 0) {
    logprobDelta = {
      perplexity_delta: mLogprob.perplexity - bLogprob.perplexity,
      hallucination_risk_delta: mLogprob.hallucination_risk - bLogprob.hallucination_risk,
      avg_confidence_delta: mLogprob.avg_logprob - bLogprob.avg_logprob,
      low_confidence_tokens_delta: mLogprob.low_confidence_tokens - bLogprob.low_confidence_tokens,
      variance_delta: mLogprob.variance - bLogprob.variance,
      baseline_perplexity: bLogprob.perplexity,
      modified_perplexity: mLogprob.perplexity,
      baseline_hallucination_risk: bLogprob.hallucination_risk,
      modified_hallucination_risk: mLogprob.hallucination_risk,
    };
    
    // Add hallucination risk increase to regression detection
    if (logprobDelta.hallucination_risk_delta > 0.1) {
      regressions.push('hallucination_risk_increased');
    }
    if (logprobDelta.perplexity_delta > 2) {
      regressions.push('perplexity_increased');
    }
  }
  
  return {
    word_count_delta: wordDelta,
    word_count_pct_change: b.word_count > 0 ? (wordDelta / b.word_count) * 100 : 0,
    sentence_delta: sentenceDelta,
    
    tokens_added_to_prompt: tokensAdded,
    output_tokens_delta: outputTokensDelta,
    unique_content_ratio_delta: uniqueContentDelta,
    meaningful_token_delta: meaningfulTokenDelta,
    
    prompt_echo_delta: echoeDelta,
    hedging_delta: hedgingDelta,
    assertion_delta: assertionDelta,
    topic_drift_delta: topicDriftDelta,
    
    reasoning_delta: reasoningDelta,
    step_delta: stepDelta,
    example_delta: exampleDelta,
    comparison_delta: comparisonDelta,
    
    archetype_changed: archetypeChanged,
    archetype_from: b.fingerprint.archetype,
    archetype_to: m.fingerprint.archetype,
    format_changed: formatChanged,
    format_from: b.fingerprint.gravitates_toward,
    format_to: m.fingerprint.gravitates_toward,
    gained_list: gainedList,
    gained_headers: gainedHeaders,
    gained_code: gainedCode,
    
    claims_delta: claimsDelta,
    actionable_delta: actionableDelta,
    redundancy_delta: redundancyDelta,
    
    formality_shift: formalityShift,
    assertiveness_shift: assertivenessShift,
    engagement_shift: engagementShift,
    
    is_regression: regressions.length > 0,
    regression_categories: regressions,
    
    tradeoffs: { gained, lost, neutral },
    
    logprob_delta: logprobDelta,
    
    behavioral_impact: behavioralImpact,
    power_score: powerScore,
    efficiency_score: efficiencyScore,
  };
}

// Token count approximation
function countTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// Apply modification to prompt
function applyModification(
  basePrompt: string,
  modType: string,
  modValue: string,
  modConfig?: any
): string {
  switch (modType) {
    case 'trigger':
      return `${modValue} ${basePrompt}`;
    case 'role_prefix':
      return `${modValue} ${basePrompt}`;
    case 'role_suffix':
      return `${basePrompt} ${modValue}`;
    case 'role_system':
      return `[ROLE: ${modValue}]\n\n${basePrompt}`;
    case 'structure':
      if (modConfig?.structureFn) {
        return modConfig.structureFn(basePrompt);
      }
      return basePrompt;
    case 'cot':
      return modValue ? `${basePrompt} ${modValue}` : basePrompt;
    case 'constraint':
      return `${basePrompt} ${modValue}`;
    case 'output_format':
      return modValue ? `${basePrompt} ${modValue}` : basePrompt;
    default:
      return basePrompt;
  }
}

// ============================================================================
// MAIN DATA COLLECTION LOOP
// ============================================================================

type DeepCollectMode = "sync" | "async";

type DeepCollectRequest = {
  num_prompts?: number;
  test_types?: Array<"triggers" | "roles" | "cot" | "constraints" | "structures">;
  model?: string;
  mode?: DeepCollectMode;
  trigger_phrases_per_category?: number;
};

function estimateTotalTests(params: {
  numPrompts: number;
  testTypes: DeepCollectRequest["test_types"];
  triggerPhrasesPerCategory: number;
}): number {
  const testTypes = params.testTypes || [];

  // Baseline per prompt
  let perPrompt = 1;

  if (testTypes.includes("triggers")) {
    const categories = Object.keys(MODIFICATIONS.triggers).length;
    perPrompt += categories * Math.max(1, params.triggerPhrasesPerCategory);
  }
  if (testTypes.includes("roles")) {
    const roles = Object.keys(MODIFICATIONS.roles).length;
    const positions = MODIFICATIONS.role_positions.length;
    perPrompt += roles * positions;
  }
  if (testTypes.includes("cot")) {
    const cotPatterns = Object.keys(MODIFICATIONS.cot).filter((k) => k !== "none").length;
    perPrompt += cotPatterns;
  }
  if (testTypes.includes("constraints")) {
    perPrompt += Object.keys(MODIFICATIONS.constraints).length;
  }
  if (testTypes.includes("structures")) {
    perPrompt += Object.keys(MODIFICATIONS.structures).filter((k) => k !== "plain").length;
  }

  return params.numPrompts * perPrompt;
}

async function insertResearchResult(supabase: any, row: any): Promise<void> {
  const { error } = await supabase.from("research_results").insert(row);
  if (error) throw error;
}

async function updateExperiment(supabase: any, experimentId: string, patch: any): Promise<void> {
  const { error } = await supabase.from("research_experiments").update(patch).eq("id", experimentId);
  if (error) throw error;
}

async function runDeepCollection(params: {
  supabase: any;
  experiment: { id: string };
  num_prompts: number;
  test_types: NonNullable<DeepCollectRequest["test_types"]>;
  model: string;
  trigger_phrases_per_category: number;
}): Promise<{
  experiment_id: string;
  total_prompts_tested: number;
  total_tests_attempted: number;
  successful_tests: number;
  failures: number;
}> {
  const { supabase, experiment, num_prompts, test_types, model, trigger_phrases_per_category } = params;

  const promptsToTest = TEST_PROMPTS.slice(0, num_prompts);

  console.log(
    `Starting deep behavioral collection: ${test_types.join(", ")} with ${promptsToTest.length} prompts (model: ${model})`
  );

  let totalTestsAttempted = 0;
  let successfulTests = 0;
  let failures = 0;

  // Update experiment total upfront
  const estimatedTotal = estimateTotalTests({
    numPrompts: promptsToTest.length,
    testTypes: test_types,
    triggerPhrasesPerCategory: trigger_phrases_per_category,
  });

  try {
    await updateExperiment(supabase, experiment.id, {
      total_tests: estimatedTotal,
      completed_tests: 0,
      status: "running",
    });
  } catch (e) {
    console.warn("Failed to set experiment totals:", e);
  }

  const maybeProgressUpdate = async () => {
    // Keep this lightweight (don’t update on every row)
    if (successfulTests % 10 !== 0) return;
    try {
      await updateExperiment(supabase, experiment.id, {
        completed_tests: successfulTests,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Progress update failed:", e);
    }
  };

  for (const promptData of promptsToTest) {
    const basePrompt = promptData.text;
    console.log(`\nTesting: "${basePrompt.substring(0, 50)}..."`);

    // 1) Baseline
    console.log("  Getting baseline...");
    let baselineResponse: APIResponse;
    let baselineBehavior: FullBehaviorProfile;

    try {
      baselineResponse = await callLLM(basePrompt, model);
      baselineBehavior = analyzeDeep(baselineResponse.output, basePrompt);

      totalTestsAttempted++;

      await insertResearchResult(supabase, {
        experiment_id: experiment.id,
        test_type: "baseline",
        base_prompt: basePrompt,
        modified_prompt: basePrompt,
        modification_applied: "baseline",
        output: baselineResponse.output,
        latency_ms: baselineResponse.latency_ms,
        tokens_used: baselineResponse.total_tokens,
        provider: "groq",
        model_used: model,
        metadata: {
          domain: promptData.domain,
          complexity: promptData.complexity,
          behavior: baselineBehavior,
          response_stats: {
            input_tokens: baselineResponse.input_tokens,
            output_tokens: baselineResponse.output_tokens,
          },
          // Logprob analysis for confidence/hallucination detection
          logprob_analysis: baselineResponse.logprob_analysis,
          confidence_metrics: baselineResponse.logprob_analysis ? {
            perplexity: baselineResponse.logprob_analysis.perplexity,
            hallucination_risk: baselineResponse.logprob_analysis.hallucination_risk,
            avg_confidence: -baselineResponse.logprob_analysis.avg_logprob,
            tokens_analyzed: baselineResponse.logprob_analysis.tokens_analyzed,
          } : null,
        },
      });

      successfulTests++;
      await maybeProgressUpdate();

      console.log(
        `  Baseline saved: ${baselineBehavior.word_count} words, archetype: ${baselineBehavior.fingerprint.archetype}`
      );
    } catch (e) {
      failures++;
      console.error("  Baseline error:", e);
      continue;
    }

    // 2) Triggers
    if (test_types.includes("triggers")) {
      for (const [category, phrases] of Object.entries(MODIFICATIONS.triggers)) {
        for (const phrase of phrases.slice(0, Math.max(1, trigger_phrases_per_category))) {
          totalTestsAttempted++;
          const modifiedPrompt = applyModification(basePrompt, "trigger", phrase);
          const tokensAdded = countTokens(phrase);

          try {
            console.log(`  Testing trigger [${category}]: ${phrase.substring(0, 30)}...`);
            const response = await callLLM(modifiedPrompt, model);
            const behavior = analyzeDeep(response.output, modifiedPrompt);
            const delta = calculateComprehensiveDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );

            await insertResearchResult(supabase, {
              experiment_id: experiment.id,
              test_type: "trigger",
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: phrase,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: "groq",
              model_used: model,
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                trigger_category: category,
                tokens_added: tokensAdded,
                behavior,
                delta,
                power_score: delta.power_score,
                is_regression: delta.is_regression,
                regression_categories: delta.regression_categories,
                tradeoffs: delta.tradeoffs,
                // Logprob analysis
                logprob_analysis: response.logprob_analysis,
                confidence_metrics: response.logprob_analysis ? {
                  perplexity: response.logprob_analysis.perplexity,
                  hallucination_risk: response.logprob_analysis.hallucination_risk,
                  perplexity_delta: delta.logprob_delta?.perplexity_delta ?? null,
                  hallucination_risk_delta: delta.logprob_delta?.hallucination_risk_delta ?? null,
                } : null,
              },
            });

            successfulTests++;
            await maybeProgressUpdate();

            console.log(
              `    Saved. Impact: ${delta.behavioral_impact.toFixed(2)}, Power: ${delta.power_score.toFixed(2)}, Regression: ${delta.is_regression}`
            );
          } catch (e) {
            failures++;
            console.error(`    Trigger error: ${e}`);
          }
        }
      }
    }

    // 3) Roles
    if (test_types.includes("roles")) {
      for (const [roleName, roleText] of Object.entries(MODIFICATIONS.roles)) {
        for (const position of MODIFICATIONS.role_positions) {
          totalTestsAttempted++;
          const modifiedPrompt = applyModification(basePrompt, `role_${position}`, roleText);
          const tokensAdded = countTokens(roleText);

          try {
            console.log(`  Testing role [${roleName}] at ${position}...`);
            const response = await callLLM(modifiedPrompt, model);
            const behavior = analyzeDeep(response.output, modifiedPrompt);
            const delta = calculateComprehensiveDelta(
              { behavior: baselineBehavior, response: baselineResponse },
              { behavior, response },
              tokensAdded
            );

            await insertResearchResult(supabase, {
              experiment_id: experiment.id,
              test_type: "role",
              base_prompt: basePrompt,
              modified_prompt: modifiedPrompt,
              modification_applied: `${roleName}_${position}`,
              output: response.output,
              latency_ms: response.latency_ms,
              tokens_used: response.total_tokens,
              provider: "groq",
              model_used: model,
              metadata: {
                domain: promptData.domain,
                complexity: promptData.complexity,
                role_name: roleName,
                role_position: position,
                tokens_added: tokensAdded,
                behavior,
                delta,
                power_score: delta.power_score,
                is_regression: delta.is_regression,
                regression_categories: delta.regression_categories,
                tradeoffs: delta.tradeoffs,
                logprob_analysis: response.logprob_analysis,
                confidence_metrics: response.logprob_analysis ? {
                  perplexity: response.logprob_analysis.perplexity,
                  hallucination_risk: response.logprob_analysis.hallucination_risk,
                  perplexity_delta: delta.logprob_delta?.perplexity_delta ?? null,
                  hallucination_risk_delta: delta.logprob_delta?.hallucination_risk_delta ?? null,
                } : null,
              },
            });

            successfulTests++;
            await maybeProgressUpdate();

            console.log(`    Saved. Power: ${delta.power_score.toFixed(2)}, Regression: ${delta.is_regression}`);
          } catch (e) {
            failures++;
            console.error(`    Role error: ${e}`);
          }
        }
      }
    }

    // 4) CoT
    if (test_types.includes("cot")) {
      for (const [cotName, cotPhrase] of Object.entries(MODIFICATIONS.cot)) {
        if (cotName === "none") continue;
        totalTestsAttempted++;

        const modifiedPrompt = applyModification(basePrompt, "cot", cotPhrase);
        const tokensAdded = countTokens(cotPhrase);

        try {
          console.log(`  Testing CoT [${cotName}]...`);
          const response = await callLLM(modifiedPrompt, model);
          const behavior = analyzeDeep(response.output, modifiedPrompt);
          const delta = calculateComprehensiveDelta(
            { behavior: baselineBehavior, response: baselineResponse },
            { behavior, response },
            tokensAdded
          );

          await insertResearchResult(supabase, {
            experiment_id: experiment.id,
            test_type: "cot",
            base_prompt: basePrompt,
            modified_prompt: modifiedPrompt,
            modification_applied: cotName,
            output: response.output,
            latency_ms: response.latency_ms,
            tokens_used: response.total_tokens,
            provider: "groq",
            model_used: model,
            metadata: {
              domain: promptData.domain,
              complexity: promptData.complexity,
              cot_type: cotName,
              cot_phrase: cotPhrase,
              tokens_added: tokensAdded,
              behavior,
              delta,
              power_score: delta.power_score,
              is_regression: delta.is_regression,
              regression_categories: delta.regression_categories,
              tradeoffs: delta.tradeoffs,
              logprob_analysis: response.logprob_analysis,
              confidence_metrics: response.logprob_analysis ? {
                perplexity: response.logprob_analysis.perplexity,
                hallucination_risk: response.logprob_analysis.hallucination_risk,
                perplexity_delta: delta.logprob_delta?.perplexity_delta ?? null,
                hallucination_risk_delta: delta.logprob_delta?.hallucination_risk_delta ?? null,
              } : null,
            },
          });

          successfulTests++;
          await maybeProgressUpdate();

          console.log(
            `    Saved. Impact: ${delta.behavioral_impact.toFixed(2)}, Steps Δ: ${delta.step_delta}, Regression: ${delta.is_regression}`
          );
        } catch (e) {
          failures++;
          console.error(`    CoT error: ${e}`);
        }
      }
    }

    // 5) Constraints
    if (test_types.includes("constraints")) {
      for (const [constraintName, constraintText] of Object.entries(MODIFICATIONS.constraints)) {
        totalTestsAttempted++;
        const modifiedPrompt = applyModification(basePrompt, "constraint", constraintText);
        const tokensAdded = countTokens(constraintText);

        try {
          console.log(`  Testing constraint [${constraintName}]...`);
          const response = await callLLM(modifiedPrompt, model);
          const behavior = analyzeDeep(response.output, modifiedPrompt);
          const delta = calculateComprehensiveDelta(
            { behavior: baselineBehavior, response: baselineResponse },
            { behavior, response },
            tokensAdded
          );

          await insertResearchResult(supabase, {
            experiment_id: experiment.id,
            test_type: "constraint",
            base_prompt: basePrompt,
            modified_prompt: modifiedPrompt,
            modification_applied: constraintName,
            output: response.output,
            latency_ms: response.latency_ms,
            tokens_used: response.total_tokens,
            provider: "groq",
            model_used: model,
            metadata: {
              domain: promptData.domain,
              complexity: promptData.complexity,
              constraint_type: constraintName,
              tokens_added: tokensAdded,
              behavior,
              delta,
              power_score: delta.power_score,
              is_regression: delta.is_regression,
              regression_categories: delta.regression_categories,
              tradeoffs: delta.tradeoffs,
              logprob_analysis: response.logprob_analysis,
              confidence_metrics: response.logprob_analysis ? {
                perplexity: response.logprob_analysis.perplexity,
                hallucination_risk: response.logprob_analysis.hallucination_risk,
                perplexity_delta: delta.logprob_delta?.perplexity_delta ?? null,
                hallucination_risk_delta: delta.logprob_delta?.hallucination_risk_delta ?? null,
              } : null,
            },
          });

          successfulTests++;
          await maybeProgressUpdate();

          console.log(`    Saved. Word Δ: ${delta.word_count_delta}, Regression: ${delta.is_regression}`);
        } catch (e) {
          failures++;
          console.error(`    Constraint error: ${e}`);
        }
      }
    }

    // 6) Structures
    if (test_types.includes("structures")) {
      for (const [structName, structFn] of Object.entries(MODIFICATIONS.structures)) {
        if (structName === "plain") continue;
        totalTestsAttempted++;

        const modifiedPrompt = (structFn as any)(basePrompt);
        const tokensAdded = countTokens(modifiedPrompt) - countTokens(basePrompt);

        try {
          console.log(`  Testing structure [${structName}]...`);
          const response = await callLLM(modifiedPrompt, model);
          const behavior = analyzeDeep(response.output, modifiedPrompt);
          const delta = calculateComprehensiveDelta(
            { behavior: baselineBehavior, response: baselineResponse },
            { behavior, response },
            tokensAdded
          );

          await insertResearchResult(supabase, {
            experiment_id: experiment.id,
            test_type: "structure",
            base_prompt: basePrompt,
            modified_prompt: modifiedPrompt,
            modification_applied: structName,
            output: response.output,
            latency_ms: response.latency_ms,
            tokens_used: response.total_tokens,
            provider: "groq",
            model_used: model,
            metadata: {
              domain: promptData.domain,
              complexity: promptData.complexity,
              structure_type: structName,
              tokens_added: tokensAdded,
              behavior,
              delta,
              power_score: delta.power_score,
              is_regression: delta.is_regression,
              regression_categories: delta.regression_categories,
              tradeoffs: delta.tradeoffs,
              logprob_analysis: response.logprob_analysis,
              confidence_metrics: response.logprob_analysis ? {
                perplexity: response.logprob_analysis.perplexity,
                hallucination_risk: response.logprob_analysis.hallucination_risk,
                perplexity_delta: delta.logprob_delta?.perplexity_delta ?? null,
                hallucination_risk_delta: delta.logprob_delta?.hallucination_risk_delta ?? null,
              } : null,
            },
          });

          successfulTests++;
          await maybeProgressUpdate();

          console.log(`    Saved. Format changed: ${delta.format_changed}, Regression: ${delta.is_regression}`);
        } catch (e) {
          failures++;
          console.error(`    Structure error: ${e}`);
        }
      }
    }
  }

  await updateExperiment(supabase, experiment.id, {
    status: "completed",
    completed_tests: successfulTests,
    total_tests: estimatedTotal,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log(`\n=== COLLECTION COMPLETE ===`);
  console.log(`Saved rows: ${successfulTests}/${totalTestsAttempted} (failures: ${failures})`);

  return {
    experiment_id: experiment.id,
    total_prompts_tested: promptsToTest.length,
    total_tests_attempted: totalTestsAttempted,
    successful_tests: successfulTests,
    failures,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DeepCollectRequest = await req.json().catch(() => ({}));

    const num_prompts = Math.max(1, Math.min(body.num_prompts ?? 1, TEST_PROMPTS.length));
    const test_types = (body.test_types ?? ["triggers", "cot"]).filter(Boolean);
    const model = body.model ?? "llama-3.1-8b-instant";
    const mode: DeepCollectMode = body.mode ?? "async";
    const trigger_phrases_per_category = Math.max(1, Math.min(body.trigger_phrases_per_category ?? 2, 4));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create experiment
    const { data: experiment, error: expError } = await supabase
      .from("research_experiments")
      .insert({
        name: `Deep Behavioral Collection - ${new Date().toISOString()}`,
        description: `Testing ${test_types.join(", ")} with comprehensive behavioral deltas (no absolute grading)`,
        experiment_type: "deep_behavioral",
        status: "running",
        config: { num_prompts, test_types, model, mode, trigger_phrases_per_category },
      })
      .select()
      .single();

    if (expError) throw expError;

    const task = async () => {
      try {
        await runDeepCollection({
          supabase,
          experiment,
          num_prompts,
          test_types,
          model,
          trigger_phrases_per_category,
        });
      } catch (e) {
        console.error("Deep collection background task failed:", e);
        try {
          await updateExperiment(supabase, experiment.id, {
            status: "failed",
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            config: {
              ...(experiment as any)?.config,
              last_error: e instanceof Error ? e.message : String(e),
            },
          });
        } catch (inner) {
          console.error("Failed to mark experiment as failed:", inner);
        }
      }
    };

    if (mode === "async") {
      // Avoid client timeouts: return immediately, continue processing.
      // This is the key fix: results are inserted incrementally, so data is not lost.
      // @ts-ignore - EdgeRuntime is provided by Supabase Edge Runtime
      EdgeRuntime.waitUntil(task());

      return new Response(
        JSON.stringify({
          success: true,
          started: true,
          mode,
          experiment_id: experiment.id,
          message: "Started deep collection in background; rows will stream into research_results incrementally.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync mode: useful only for tiny runs.
    const summary = await runDeepCollection({
      supabase,
      experiment,
      num_prompts,
      test_types,
      model,
      trigger_phrases_per_category,
    });

    return new Response(JSON.stringify({ success: true, started: true, mode, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Deep collection error:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

