import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// COMPREHENSIVE RESEARCH DATA COLLECTION
// Collects ALL data from OSS prompt engineering research:
// - Behavioral Mapping (trigger phrases, roles, positions, structures)
// - Token Efficiency (power words, token-to-impact ratios)
// - Constraint Effectiveness
// - Chain-of-Thought Triggers
// - Output Format Patterns
// - Model-Specific Behaviors
// ============================================================================

// 100 diverse base prompts across domains
const BASE_PROMPTS = [
  // Creative Writing (10)
  "Write a short story about a robot learning to paint",
  "Create a poem about the ocean at midnight",
  "Write dialogue between two strangers on a train",
  "Describe a haunted house from a child's perspective",
  "Write a letter from the future to the past",
  "Create a myth explaining why the sky is blue",
  "Write a monologue for a villain explaining their motives",
  "Describe a meal that changed someone's life",
  "Write a story told entirely through text messages",
  "Create a fable with a moral about patience",
  
  // Technical/Code (10)
  "Explain how a hash table works",
  "Write a function to find duplicates in an array",
  "Explain the difference between REST and GraphQL",
  "Describe how garbage collection works",
  "Write a SQL query to find the top 5 customers",
  "Explain what a closure is in JavaScript",
  "Describe the CAP theorem simply",
  "Write pseudocode for a binary search",
  "Explain how HTTPS encryption works",
  "Describe microservices vs monolithic architecture",
  
  // Analysis/Reasoning (10)
  "Analyze the pros and cons of remote work",
  "Compare electric cars to traditional vehicles",
  "Evaluate the impact of social media on teenagers",
  "Assess the effectiveness of online education",
  "Analyze why some startups fail",
  "Compare different investment strategies",
  "Evaluate the ethics of AI in hiring",
  "Analyze the causes of urbanization",
  "Compare different leadership styles",
  "Assess the future of cryptocurrency",
  
  // Instruction/How-to (10)
  "Explain how to make sourdough bread",
  "Describe how to start a podcast",
  "Explain how to negotiate a salary",
  "Describe how to learn a new language",
  "Explain how to prepare for a marathon",
  "Describe how to build a personal brand",
  "Explain how to meditate for beginners",
  "Describe how to write a business plan",
  "Explain how to improve public speaking",
  "Describe how to manage time effectively",
  
  // Question Answering (10)
  "What causes inflation?",
  "Why do leaves change color in fall?",
  "How does the immune system work?",
  "What is quantum computing?",
  "Why do we dream?",
  "How do vaccines work?",
  "What causes earthquakes?",
  "Why is the sky blue?",
  "How does memory work in the brain?",
  "What is dark matter?",
  
  // Summarization (10)
  "Summarize the key points of climate change",
  "Summarize how the internet changed communication",
  "Summarize the history of artificial intelligence",
  "Summarize the principles of good design",
  "Summarize the impact of the printing press",
  "Summarize how antibiotics were discovered",
  "Summarize the theory of evolution",
  "Summarize the causes of World War I",
  "Summarize the benefits of exercise",
  "Summarize the principles of economics",
  
  // Persuasion/Argument (10)
  "Argue for the importance of reading books",
  "Make a case for renewable energy",
  "Argue why critical thinking matters",
  "Make a case for learning history",
  "Argue for the value of failure",
  "Make a case for work-life balance",
  "Argue why diversity improves teams",
  "Make a case for continuous learning",
  "Argue for the importance of sleep",
  "Make a case for ethical business practices",
  
  // Data/Structured (10)
  "List 5 ways to reduce carbon footprint",
  "Create a weekly meal plan for vegetarians",
  "List the steps to troubleshoot a slow computer",
  "Create a checklist for moving to a new city",
  "List common logical fallacies with examples",
  "Create a comparison table of programming languages",
  "List the stages of project management",
  "Create a decision matrix for choosing a career",
  "List the elements of effective feedback",
  "Create a timeline of major tech innovations",
  
  // Role-play/Persona (10)
  "As a historian, explain the Renaissance",
  "As a chef, describe perfect knife technique",
  "As a psychologist, explain cognitive biases",
  "As an economist, explain supply and demand",
  "As a biologist, explain photosynthesis",
  "As a philosopher, discuss free will",
  "As a marketer, explain brand positioning",
  "As an architect, describe sustainable design",
  "As a lawyer, explain contract basics",
  "As a doctor, explain preventive care",
  
  // Complex Multi-step (10)
  "Plan a sustainable city from scratch",
  "Design a curriculum for teaching ethics",
  "Create a strategy for entering a new market",
  "Plan a community garden project",
  "Design a mentorship program",
  "Create a crisis communication plan",
  "Plan a product launch strategy",
  "Design an employee wellness program",
  "Create a content marketing strategy",
  "Plan a charity fundraising campaign"
];

// ============================================================================
// TEST DIMENSIONS
// ============================================================================

const TRIGGER_PHRASES = {
  authority: [
    "As an expert,",
    "According to research,",
    "Studies show that",
    "Experts agree that",
    "It is well-established that",
  ],
  precision: [
    "Be specific and detailed.",
    "Provide exact information.",
    "Be precise in your response.",
    "Give concrete examples.",
    "Include specific details.",
  ],
  quality: [
    "Think carefully before responding.",
    "Take your time to consider this.",
    "Reason step by step.",
    "Consider all aspects.",
    "Think through this thoroughly.",
  ],
  constraint: [
    "Keep it under 200 words.",
    "Be concise.",
    "Briefly explain.",
    "In summary,",
    "The key points are:",
  ],
  format: [
    "Structure your response clearly.",
    "Use bullet points.",
    "Organize by importance.",
    "Present in a logical order.",
    "Break down into sections.",
  ],
  emphasis: [
    "This is very important:",
    "Pay close attention to:",
    "Focus especially on:",
    "The critical aspect is:",
    "Most importantly,",
  ],
  chain_of_thought: [
    "Let's think step by step.",
    "First, let's consider...",
    "Breaking this down:",
    "Working through this logically:",
    "Analyzing this systematically:",
  ],
  persona: [
    "You are a world-class expert.",
    "You are a helpful assistant.",
    "You are a thoughtful advisor.",
    "You are a skilled teacher.",
    "You are a professional consultant.",
  ]
};

const ROLE_POSITIONS = {
  prefix: (role: string, prompt: string) => `${role} ${prompt}`,
  suffix: (role: string, prompt: string) => `${prompt} ${role}`,
  wrapped: (role: string, prompt: string) => `${role} ${prompt} Remember your expertise.`,
  system_style: (role: string, prompt: string) => `[Role: ${role}]\n\n${prompt}`,
  embedded: (role: string, prompt: string) => `Given that ${role.toLowerCase()}, ${prompt.toLowerCase()}`,
};

const ROLES = [
  "You are an expert analyst.",
  "You are a senior consultant.",
  "You are a renowned professor.",
  "You are a skilled practitioner.",
  "You are a thoughtful mentor.",
  "You are a detail-oriented researcher.",
  "You are an experienced professional.",
  "You are a creative problem-solver.",
  "You are a strategic thinker.",
  "You are a domain specialist.",
];

const STRUCTURE_PATTERNS = {
  plain: (prompt: string) => prompt,
  numbered: (prompt: string) => `Task: ${prompt}\n\nRequirements:\n1. Be thorough\n2. Be accurate\n3. Be clear`,
  sections: (prompt: string) => `# Task\n${prompt}\n\n# Guidelines\nProvide a comprehensive response.`,
  xml_tags: (prompt: string) => `<task>${prompt}</task>\n<guidelines>Be thorough and accurate.</guidelines>`,
  markdown: (prompt: string) => `## Task\n${prompt}\n\n## Expected Output\nA well-structured response.`,
  json_style: (prompt: string) => `{"task": "${prompt}", "requirements": ["thorough", "accurate", "clear"]}`,
  conversational: (prompt: string) => `I need help with this: ${prompt}. Can you assist?`,
  imperative: (prompt: string) => `DO THIS: ${prompt}. ENSURE: Quality and accuracy.`,
};

const CONSTRAINT_PATTERNS = {
  none: (prompt: string) => prompt,
  length_words: (prompt: string) => `${prompt} Limit: 150 words.`,
  length_sentences: (prompt: string) => `${prompt} Use exactly 5 sentences.`,
  format_list: (prompt: string) => `${prompt} Format as a numbered list.`,
  format_paragraphs: (prompt: string) => `${prompt} Use 3 paragraphs.`,
  audience: (prompt: string) => `${prompt} Explain for a beginner.`,
  tone: (prompt: string) => `${prompt} Use a professional tone.`,
  exclusion: (prompt: string) => `${prompt} Do not use jargon.`,
};

const OUTPUT_FORMATS = {
  none: "",
  json: "Respond in valid JSON format.",
  markdown: "Use markdown formatting.",
  bullet_points: "Use bullet points.",
  numbered_list: "Use a numbered list.",
  table: "Present as a table if applicable.",
  code_block: "Use code blocks for any code.",
  plain_text: "Respond in plain text only.",
};

const COT_TRIGGERS = {
  none: "",
  step_by_step: "Think step by step.",
  break_down: "Break this down into steps.",
  reason_through: "Reason through this carefully.",
  analyze_first: "First analyze, then respond.",
  show_work: "Show your reasoning process.",
  consider_aspects: "Consider all aspects before answering.",
};

const POWER_WORDS = [
  "comprehensive", "detailed", "thorough", "precise", "expert",
  "professional", "strategic", "systematic", "rigorous", "insightful",
  "actionable", "practical", "effective", "optimal", "essential",
  "critical", "fundamental", "innovative", "proven", "reliable"
];

// ============================================================================
// API CALLING
// ============================================================================

// Rate limiting for Groq free tier (6000 TPM = ~10 requests/min)
let lastCallTime = 0;
const MIN_DELAY_MS = 6000; // 6 seconds between calls to stay under limit

async function rateLimitedDelay() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_DELAY_MS && lastCallTime > 0) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastCallTime = Date.now();
}

async function callGroq(prompt: string, model: string = "llama-3.1-8b-instant", retries = 3): Promise<{
  output: string;
  latency_ms: number;
  tokens_used: number;
  input_tokens: number;
  output_tokens: number;
  finish_reason: string;
}> {
  await rateLimitedDelay();
  
  const startTime = Date.now();
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512, // Reduced to stay under TPM
      temperature: 0.7,
    }),
  });

  const latency_ms = Date.now() - startTime;
  
  if (!response.ok) {
    const error = await response.text();
    // Retry on rate limit
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited, waiting 10s and retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 10000));
      return callGroq(prompt, model, retries - 1);
    }
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    output: data.choices[0]?.message?.content || '',
    latency_ms,
    tokens_used: data.usage?.total_tokens || 0,
    input_tokens: data.usage?.prompt_tokens || 0,
    output_tokens: data.usage?.completion_tokens || 0,
    finish_reason: data.choices[0]?.finish_reason || 'unknown',
  };
}

// ============================================================================
// BEHAVIORAL METRICS - Raw output analysis without grading
// ============================================================================

function measureOutputBehavior(output: string, prompt: string): Record<string, any> {
  const words = output.split(/\s+/).filter(w => w.length > 0);
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = output.split(/\n\n+/).filter(p => p.trim().length > 0);
  const lines = output.split(/\n/).filter(l => l.trim().length > 0);
  
  // Structural analysis
  const hasBulletPoints = /^[\s]*[-•*]\s/m.test(output);
  const hasNumberedList = /^[\s]*\d+[.)]\s/m.test(output);
  const hasHeaders = /^#+\s|^[A-Z][^.!?]{0,50}:$/m.test(output);
  const hasCodeBlocks = /```[\s\S]*```/.test(output);
  const hasInlineCode = /`[^`]+`/.test(output);
  const hasEmphasis = /\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/.test(output);
  const hasLinks = /\[.+\]\(.+\)|https?:\/\//.test(output);
  const hasBlockquotes = /^>/m.test(output);
  
  // Content markers
  const hasExamples = /for example|e\.g\.|such as|like this|instance|consider/i.test(output);
  const hasQualifiers = /however|although|but|nevertheless|on the other hand|that said/i.test(output);
  const hasConclusion = /in conclusion|to summarize|in summary|overall|therefore|in short/i.test(output);
  const hasSteps = /first|second|third|then|next|finally|step \d|1\.|2\.|3\./i.test(output);
  const hasDefinitions = /is defined as|means|refers to|is a|are called/i.test(output);
  const hasTransitions = /additionally|furthermore|moreover|also|similarly|likewise/i.test(output);
  
  // Vocabulary analysis
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 0));
  const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
  const longWords = words.filter(w => w.length > 8);
  const veryLongWords = words.filter(w => w.length > 12);
  const powerWordsUsed = POWER_WORDS.filter(pw => output.toLowerCase().includes(pw));
  
  // Technical vocabulary
  const technicalTerms = output.match(/\b[A-Z]{2,}\b/g) || []; // Acronyms
  const quotedTerms = output.match(/"[^"]+"|'[^']+'/g) || [];
  
  // Prompt adherence signals
  const promptWords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const promptWordsInOutput = promptWords.filter(pw => output.toLowerCase().includes(pw));
  const promptAdherence = promptWords.length > 0 ? promptWordsInOutput.length / promptWords.length : 0;
  
  // Specificity signals
  const hasNumbers = /\d+/.test(output);
  const numberCount = (output.match(/\d+/g) || []).length;
  const hasPercentages = /%|\bpercent\b/i.test(output);
  const hasQuotes = /"[^"]+"|'[^']+'/.test(output);
  const hasNames = /[A-Z][a-z]+ [A-Z][a-z]+/.test(output);
  const hasDates = /\d{4}|\d{1,2}\/\d{1,2}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(output);
  const hasLocations = /\b(city|country|state|region|area|place|location)\b/i.test(output);
  
  // Reasoning signals
  const hasReasoning = /because|since|therefore|thus|hence|as a result|due to|caused by/i.test(output);
  const hasComparisons = /compared to|versus|vs\.|unlike|similar to|different from|whereas/i.test(output);
  const hasAnalysis = /analysis|analyze|examine|evaluate|assess|consider|review/i.test(output);
  const hasCausality = /leads to|results in|causes|affects|impacts|influences/i.test(output);
  const hasConditions = /if|when|unless|provided that|assuming|in case/i.test(output);
  
  // Engagement signals
  const hasQuestions = /\?/.test(output);
  const questionCount = (output.match(/\?/g) || []).length;
  const hasDirectAddress = /you|your|we|our|us/i.test(output);
  const hasCallToAction = /try|consider|think about|remember|note that|keep in mind/i.test(output);
  
  // Sentiment/tone markers
  const positiveWords = /great|excellent|amazing|wonderful|fantastic|good|better|best|success|benefit/gi;
  const negativeWords = /bad|worse|worst|problem|issue|challenge|difficult|hard|fail/gi;
  const positiveCount = (output.match(positiveWords) || []).length;
  const negativeCount = (output.match(negativeWords) || []).length;
  
  // Hedging language
  const hedging = /might|may|could|possibly|perhaps|likely|probably|seem|appear|suggest/i.test(output);
  const hedgeCount = (output.match(/might|may|could|possibly|perhaps|likely|probably|seem|appear|suggest/gi) || []).length;
  
  // Authority language
  const authorityWords = /must|always|never|definitely|certainly|absolutely|clearly|obviously/i.test(output);
  const authorityCount = (output.match(/must|always|never|definitely|certainly|absolutely|clearly|obviously/gi) || []).length;
  
  return {
    // Length metrics
    char_count: output.length,
    word_count: words.length,
    sentence_count: sentences.length,
    paragraph_count: paragraphs.length,
    line_count: lines.length,
    avg_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0,
    avg_word_length: avgWordLength,
    avg_paragraph_length: paragraphs.length > 0 ? words.length / paragraphs.length : 0,
    
    // Structure metrics
    has_bullet_points: hasBulletPoints,
    has_numbered_list: hasNumberedList,
    has_headers: hasHeaders,
    has_code_blocks: hasCodeBlocks,
    has_inline_code: hasInlineCode,
    has_emphasis: hasEmphasis,
    has_links: hasLinks,
    has_blockquotes: hasBlockquotes,
    structure_elements: [hasBulletPoints, hasNumberedList, hasHeaders, hasCodeBlocks, hasEmphasis, hasLinks].filter(Boolean).length,
    
    // Content richness
    has_examples: hasExamples,
    has_qualifiers: hasQualifiers,
    has_conclusion: hasConclusion,
    has_steps: hasSteps,
    has_definitions: hasDefinitions,
    has_transitions: hasTransitions,
    content_markers: [hasExamples, hasQualifiers, hasConclusion, hasSteps, hasDefinitions, hasTransitions].filter(Boolean).length,
    
    // Vocabulary metrics
    unique_word_count: uniqueWords.size,
    vocabulary_diversity: words.length > 0 ? uniqueWords.size / words.length : 0,
    long_word_count: longWords.length,
    long_word_ratio: words.length > 0 ? longWords.length / words.length : 0,
    very_long_word_count: veryLongWords.length,
    power_words_used: powerWordsUsed,
    power_word_count: powerWordsUsed.length,
    technical_term_count: technicalTerms.length,
    quoted_term_count: quotedTerms.length,
    
    // Prompt adherence
    prompt_adherence_ratio: promptAdherence,
    prompt_words_echoed: promptWordsInOutput.length,
    
    // Specificity metrics
    has_numbers: hasNumbers,
    number_count: numberCount,
    has_percentages: hasPercentages,
    has_quotes: hasQuotes,
    has_proper_names: hasNames,
    has_dates: hasDates,
    has_locations: hasLocations,
    specificity_markers: [hasNumbers, hasPercentages, hasQuotes, hasNames, hasDates].filter(Boolean).length,
    
    // Reasoning metrics
    has_reasoning: hasReasoning,
    has_comparisons: hasComparisons,
    has_analysis: hasAnalysis,
    has_causality: hasCausality,
    has_conditions: hasConditions,
    reasoning_markers: [hasReasoning, hasComparisons, hasAnalysis, hasCausality, hasConditions].filter(Boolean).length,
    
    // Engagement metrics
    has_questions: hasQuestions,
    question_count: questionCount,
    has_direct_address: hasDirectAddress,
    has_call_to_action: hasCallToAction,
    
    // Tone metrics
    positive_word_count: positiveCount,
    negative_word_count: negativeCount,
    sentiment_balance: positiveCount - negativeCount,
    has_hedging: hedging,
    hedge_count: hedgeCount,
    has_authority_language: authorityWords,
    authority_count: authorityCount,
    
    // Token efficiency (output quality per token)
    content_per_token: words.length > 0 ? uniqueWords.size / words.length : 0,
    structure_per_word: words.length > 0 ? [hasBulletPoints, hasNumberedList, hasHeaders, hasCodeBlocks, hasEmphasis].filter(Boolean).length / words.length * 100 : 0,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      num_prompts = 100, 
      test_types = ['trigger_phrases', 'role_positions', 'structure_patterns', 'constraint_patterns', 'cot_triggers', 'output_formats']
    } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create experiment record
    const { data: experiment, error: expError } = await supabase
      .from('research_experiments')
      .insert({
        name: `Comprehensive Data Collection - ${new Date().toISOString()}`,
        description: 'Full behavioral mapping: triggers, roles, positions, structures, constraints, CoT, formats',
        experiment_type: 'comprehensive',
        status: 'running',
        config: { num_prompts, test_types },
        total_tests: 0,
        completed_tests: 0,
      })
      .select()
      .single();
    
    if (expError) throw expError;
    
    const results: any[] = [];
    const promptsToTest = BASE_PROMPTS.slice(0, Math.min(num_prompts, BASE_PROMPTS.length));
    let completedTests = 0;
    
    console.log(`Starting comprehensive data collection with ${promptsToTest.length} prompts`);
    console.log(`Test types: ${test_types.join(', ')}`);
    
    // ========================================================================
    // TEST 1: TRIGGER PHRASES
    // ========================================================================
    if (test_types.includes('trigger_phrases')) {
      console.log('Testing trigger phrases...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 20 to 5
        const prompt = promptsToTest[i];
        
        // Baseline
        try {
          const baseline = await callGroq(prompt);
          const metrics = measureOutputBehavior(baseline.output, prompt);
          
          results.push({
            experiment_id: experiment.id,
            test_type: 'trigger_phrase',
            base_prompt: prompt,
            modified_prompt: prompt,
            modification_applied: 'baseline',
            output: baseline.output,
            latency_ms: baseline.latency_ms,
            tokens_used: baseline.tokens_used,
            provider: 'groq',
            model_used: 'llama-3.1-8b-instant',
            metadata: {
              trigger_category: 'baseline',
              trigger_phrase: null,
              input_tokens: baseline.input_tokens,
              output_tokens: baseline.output_tokens,
              finish_reason: baseline.finish_reason,
              behavior: metrics,
            },
          });
          completedTests++;
        } catch (e) {
          console.error('Baseline error:', e);
        }
        
        // Test each trigger category
        for (const [category, phrases] of Object.entries(TRIGGER_PHRASES)) {
          const phrase = phrases[0]; // Use first phrase from each category
          const modifiedPrompt = `${phrase} ${prompt}`;
          
          try {
            const result = await callGroq(modifiedPrompt);
            const metrics = measureOutputBehavior(result.output, prompt);
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'trigger_phrase',
              base_prompt: prompt,
              modified_prompt: modifiedPrompt,
              modification_applied: phrase,
              output: result.output,
              latency_ms: result.latency_ms,
              tokens_used: result.tokens_used,
              provider: 'groq',
              model_used: 'llama-3.1-8b-instant',
              metadata: {
                trigger_category: category,
                trigger_phrase: phrase,
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
                finish_reason: result.finish_reason,
                behavior: metrics,
              },
            });
            completedTests++;
          } catch (e) {
            console.error(`Trigger test error:`, e);
          }
        }
        
        console.log(`Triggers: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // TEST 2: ROLE POSITIONS
    // ========================================================================
    if (test_types.includes('role_positions')) {
      console.log('Testing role positions...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 15 to 5
        const prompt = promptsToTest[i];
        
        for (const [posName, posFn] of Object.entries(ROLE_POSITIONS)) {
          for (const role of ROLES.slice(0, 2)) {
            const modifiedPrompt = posFn(role, prompt);
            
            try {
              const result = await callGroq(modifiedPrompt);
              const metrics = measureOutputBehavior(result.output, prompt);
              
              results.push({
                experiment_id: experiment.id,
                test_type: 'role_position',
                base_prompt: prompt,
                modified_prompt: modifiedPrompt,
                modification_applied: `${posName}: ${role}`,
                output: result.output,
                latency_ms: result.latency_ms,
                tokens_used: result.tokens_used,
                provider: 'groq',
                model_used: 'llama-3.1-8b-instant',
                metadata: {
                  role,
                  position: posName,
                  input_tokens: result.input_tokens,
                  output_tokens: result.output_tokens,
                  finish_reason: result.finish_reason,
                  behavior: metrics,
                },
              });
              completedTests++;
            } catch (e) {
              console.error(`Role position error:`, e);
            }
          }
        }
        console.log(`Roles: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // TEST 3: STRUCTURE PATTERNS
    // ========================================================================
    if (test_types.includes('structure_patterns')) {
      console.log('Testing structure patterns...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 15 to 5
        const prompt = promptsToTest[i];
        
        for (const [patternName, patternFn] of Object.entries(STRUCTURE_PATTERNS)) {
          const modifiedPrompt = patternFn(prompt);
          
          try {
            const result = await callGroq(modifiedPrompt);
            const metrics = measureOutputBehavior(result.output, prompt);
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'structure_pattern',
              base_prompt: prompt,
              modified_prompt: modifiedPrompt,
              modification_applied: patternName,
              output: result.output,
              latency_ms: result.latency_ms,
              tokens_used: result.tokens_used,
              provider: 'groq',
              model_used: 'llama-3.1-8b-instant',
              metadata: {
                structure_pattern: patternName,
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
                finish_reason: result.finish_reason,
                behavior: metrics,
              },
            });
            completedTests++;
          } catch (e) {
            console.error(`Structure error:`, e);
          }
        }
        console.log(`Structures: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // TEST 4: CONSTRAINT PATTERNS
    // ========================================================================
    if (test_types.includes('constraint_patterns')) {
      console.log('Testing constraint patterns...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 15 to 5
        const prompt = promptsToTest[i];
        
        for (const [constraintName, constraintFn] of Object.entries(CONSTRAINT_PATTERNS)) {
          const modifiedPrompt = constraintFn(prompt);
          
          try {
            const result = await callGroq(modifiedPrompt);
            const metrics = measureOutputBehavior(result.output, prompt);
            
            // Check constraint adherence
            let adherence: any = { checked: false };
            if (constraintName === 'length_words') {
              adherence = { checked: true, expected: 150, actual: metrics.word_count, met: metrics.word_count <= 150 };
            } else if (constraintName === 'length_sentences') {
              adherence = { checked: true, expected: 5, actual: metrics.sentence_count, met: metrics.sentence_count === 5 };
            } else if (constraintName === 'format_list') {
              adherence = { checked: true, met: metrics.has_numbered_list || metrics.has_bullet_points };
            } else if (constraintName === 'format_paragraphs') {
              adherence = { checked: true, expected: 3, actual: metrics.paragraph_count, met: metrics.paragraph_count === 3 };
            }
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'constraint_pattern',
              base_prompt: prompt,
              modified_prompt: modifiedPrompt,
              modification_applied: constraintName,
              output: result.output,
              latency_ms: result.latency_ms,
              tokens_used: result.tokens_used,
              provider: 'groq',
              model_used: 'llama-3.1-8b-instant',
              metadata: {
                constraint_type: constraintName,
                constraint_adherence: adherence,
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
                finish_reason: result.finish_reason,
                behavior: metrics,
              },
            });
            completedTests++;
          } catch (e) {
            console.error(`Constraint error:`, e);
          }
        }
        console.log(`Constraints: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // TEST 5: CHAIN-OF-THOUGHT TRIGGERS
    // ========================================================================
    if (test_types.includes('cot_triggers')) {
      console.log('Testing CoT triggers...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 15 to 5
        const prompt = promptsToTest[i];
        
        for (const [cotName, cotPhrase] of Object.entries(COT_TRIGGERS)) {
          const modifiedPrompt = cotPhrase ? `${cotPhrase} ${prompt}` : prompt;
          
          try {
            const result = await callGroq(modifiedPrompt);
            const metrics = measureOutputBehavior(result.output, prompt);
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'cot_trigger',
              base_prompt: prompt,
              modified_prompt: modifiedPrompt,
              modification_applied: cotName,
              output: result.output,
              latency_ms: result.latency_ms,
              tokens_used: result.tokens_used,
              provider: 'groq',
              model_used: 'llama-3.1-8b-instant',
              metadata: {
                cot_type: cotName,
                cot_phrase: cotPhrase,
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
                finish_reason: result.finish_reason,
                behavior: metrics,
              },
            });
            completedTests++;
          } catch (e) {
            console.error(`CoT error:`, e);
          }
        }
        console.log(`CoT: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // TEST 6: OUTPUT FORMATS
    // ========================================================================
    if (test_types.includes('output_formats')) {
      console.log('Testing output formats...');
      
      for (let i = 0; i < Math.min(5, promptsToTest.length); i++) { // Reduced from 15 to 5
        const prompt = promptsToTest[i];
        
        for (const [formatName, formatInstr] of Object.entries(OUTPUT_FORMATS)) {
          const modifiedPrompt = formatInstr ? `${prompt} ${formatInstr}` : prompt;
          
          try {
            const result = await callGroq(modifiedPrompt);
            const metrics = measureOutputBehavior(result.output, prompt);
            
            // Check format adherence
            let adherence: any = { checked: false };
            if (formatName === 'bullet_points') {
              adherence = { checked: true, met: metrics.has_bullet_points };
            } else if (formatName === 'numbered_list') {
              adherence = { checked: true, met: metrics.has_numbered_list };
            } else if (formatName === 'markdown') {
              adherence = { checked: true, met: metrics.has_headers || metrics.has_emphasis };
            } else if (formatName === 'code_block') {
              adherence = { checked: true, met: metrics.has_code_blocks };
            }
            
            results.push({
              experiment_id: experiment.id,
              test_type: 'output_format',
              base_prompt: prompt,
              modified_prompt: modifiedPrompt,
              modification_applied: formatName,
              output: result.output,
              latency_ms: result.latency_ms,
              tokens_used: result.tokens_used,
              provider: 'groq',
              model_used: 'llama-3.1-8b-instant',
              metadata: {
                output_format: formatName,
                format_instruction: formatInstr,
                format_adherence: adherence,
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
                finish_reason: result.finish_reason,
                behavior: metrics,
              },
            });
            completedTests++;
            
          } catch (e) {
            console.error(`Format error:`, e);
          }
        }
        console.log(`Formats: ${completedTests} tests completed`);
      }
    }
    
    // ========================================================================
    // SAVE RESULTS
    // ========================================================================
    console.log(`Saving ${results.length} results...`);
    
    const batchSize = 50;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
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
    
    // ========================================================================
    // AGGREGATE ANALYSIS
    // ========================================================================
    const analysis = {
      experiment_id: experiment.id,
      total_tests: results.length,
      
      // Trigger phrase effects
      trigger_effects: Object.keys(TRIGGER_PHRASES).map(cat => {
        const catResults = results.filter(r => r.test_type === 'trigger_phrase' && r.metadata.trigger_category === cat);
        const baseline = results.filter(r => r.test_type === 'trigger_phrase' && r.metadata.trigger_category === 'baseline');
        if (!catResults.length) return null;
        
        const avgBaseline = baseline.reduce((s, r) => s + r.metadata.behavior.word_count, 0) / Math.max(baseline.length, 1);
        const avgCat = catResults.reduce((s, r) => s + r.metadata.behavior.word_count, 0) / catResults.length;
        
        return {
          category: cat,
          sample_size: catResults.length,
          avg_word_count: avgCat,
          word_count_delta: avgCat - avgBaseline,
          avg_reasoning_score: catResults.reduce((s, r) => s + r.metadata.behavior.reasoning_markers, 0) / catResults.length,
          avg_structure_score: catResults.reduce((s, r) => s + r.metadata.behavior.structure_elements, 0) / catResults.length,
          avg_latency_ms: catResults.reduce((s, r) => s + r.latency_ms, 0) / catResults.length,
        };
      }).filter(Boolean),
      
      // Role position effects
      role_position_effects: Object.keys(ROLE_POSITIONS).map(pos => {
        const posResults = results.filter(r => r.test_type === 'role_position' && r.metadata.position === pos);
        if (!posResults.length) return null;
        
        return {
          position: pos,
          sample_size: posResults.length,
          avg_word_count: posResults.reduce((s, r) => s + r.metadata.behavior.word_count, 0) / posResults.length,
          avg_vocabulary_diversity: posResults.reduce((s, r) => s + r.metadata.behavior.vocabulary_diversity, 0) / posResults.length,
          avg_content_markers: posResults.reduce((s, r) => s + r.metadata.behavior.content_markers, 0) / posResults.length,
        };
      }).filter(Boolean),
      
      // Structure effects
      structure_effects: Object.keys(STRUCTURE_PATTERNS).map(pat => {
        const patResults = results.filter(r => r.test_type === 'structure_pattern' && r.metadata.structure_pattern === pat);
        if (!patResults.length) return null;
        
        return {
          pattern: pat,
          sample_size: patResults.length,
          avg_structure_elements: patResults.reduce((s, r) => s + r.metadata.behavior.structure_elements, 0) / patResults.length,
          avg_content_markers: patResults.reduce((s, r) => s + r.metadata.behavior.content_markers, 0) / patResults.length,
          avg_reasoning_markers: patResults.reduce((s, r) => s + r.metadata.behavior.reasoning_markers, 0) / patResults.length,
        };
      }).filter(Boolean),
      
      // Constraint adherence
      constraint_adherence: Object.keys(CONSTRAINT_PATTERNS).map(con => {
        const conResults = results.filter(r => 
          r.test_type === 'constraint_pattern' && 
          r.metadata.constraint_type === con &&
          r.metadata.constraint_adherence?.checked
        );
        if (!conResults.length) return null;
        
        return {
          constraint: con,
          sample_size: conResults.length,
          adherence_rate: conResults.filter(r => r.metadata.constraint_adherence?.met).length / conResults.length,
        };
      }).filter(Boolean),
      
      // CoT effects
      cot_effects: Object.keys(COT_TRIGGERS).map(cot => {
        const cotResults = results.filter(r => r.test_type === 'cot_trigger' && r.metadata.cot_type === cot);
        if (!cotResults.length) return null;
        
        return {
          cot_type: cot,
          sample_size: cotResults.length,
          avg_reasoning_markers: cotResults.reduce((s, r) => s + r.metadata.behavior.reasoning_markers, 0) / cotResults.length,
          avg_word_count: cotResults.reduce((s, r) => s + r.metadata.behavior.word_count, 0) / cotResults.length,
          avg_steps: cotResults.filter(r => r.metadata.behavior.has_steps).length / cotResults.length,
        };
      }).filter(Boolean),
      
      // Format adherence
      format_adherence: Object.keys(OUTPUT_FORMATS).map(fmt => {
        const fmtResults = results.filter(r => 
          r.test_type === 'output_format' && 
          r.metadata.output_format === fmt &&
          r.metadata.format_adherence?.checked
        );
        if (!fmtResults.length) return null;
        
        return {
          format: fmt,
          sample_size: fmtResults.length,
          adherence_rate: fmtResults.filter(r => r.metadata.format_adherence?.met).length / fmtResults.length,
        };
      }).filter(Boolean),
    };
    
    return new Response(JSON.stringify({
      success: true,
      experiment_id: experiment.id,
      total_tests: results.length,
      analysis,
      sample_results: results.slice(0, 5),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Data collection error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
