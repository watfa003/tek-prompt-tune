import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { handleSpeedMode } from './speed-mode-functions.ts';
import { getOutputTypeSystemPrompt, getOutputTypeGuidance, OUTPUT_TYPE_STRATEGIES, type OutputType } from './output-type-strategies.ts';
import { 
  scorePromptTested,
  scorePromptAndOutput,
  calculateTotalScore,
  detectPromptType,
  type CategoryScores,
  type PromptType
} from '../shared/master-grader.ts';
import { scorePromptWithAI, calculateOverallScore } from '../shared/ai-grader.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Configuration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY');
const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// AI Provider configurations (simplified for speed)
const AI_PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: openAIApiKey,
    models: {
      'gpt-5-2025-08-07': { name: 'gpt-5-2025-08-07', maxTokens: 4096 },
      'gpt-5-mini-2025-08-07': { name: 'gpt-5-mini-2025-08-07', maxTokens: 4096 },
      'gpt-5-nano-2025-08-07': { name: 'gpt-5-nano-2025-08-07', maxTokens: 4096 },
      'gpt-4.1-2025-04-14': { name: 'gpt-4.1-2025-04-14', maxTokens: 4096 },
      'gpt-4o': { name: 'gpt-4o', maxTokens: 4096 },
      'gpt-4o-mini': { name: 'gpt-4o-mini', maxTokens: 4096 }
    }
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: anthropicApiKey,
    models: {
      'claude-opus-4-1-20250805': { name: 'claude-opus-4-1-20250805', maxTokens: 4096 },
      'claude-sonnet-4-20250514': { name: 'claude-sonnet-4-20250514', maxTokens: 4096 },
      'claude-3-5-haiku-20241022': { name: 'claude-3-5-haiku-20241022', maxTokens: 4096 }
    }
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: groqApiKey,
    models: {
      'llama-3.1-8b': { name: 'llama-3.1-8b-instant', maxTokens: 2048 }
    }
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    apiKey: mistralApiKey,
    models: {
      'mistral-large': { name: 'mistral-large-latest', maxTokens: 2048 },
      'mistral-medium': { name: 'mistral-medium-latest', maxTokens: 2048 }
    }
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: googleApiKey,
    models: {
      'gemini-2.0-flash-lite': { name: 'gemini-2.0-flash-lite', maxTokens: 4096 },
      'gemini-2.0-flash': { name: 'gemini-2.0-flash', maxTokens: 4096 },
      'gemini-2.5-flash-lite': { name: 'gemini-2.5-flash-lite', maxTokens: 4096 },
      'gemini-2.5-flash': { name: 'gemini-2.5-flash', maxTokens: 4096 },
      'gemini-2.5-pro': { name: 'gemini-2.5-pro', maxTokens: 8192 }
    }
  }
};

// Cheaper models for optimization process
const OPTIMIZATION_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  mistral: 'mistral-medium',
  groq: 'llama-3.1-8b',
  google: 'gemini-2.5-flash'
};

// Network safety: time out external AI calls so variants don't hang forever
const REQUEST_TIMEOUT_MS = 25000;

// PrompTek V4.0 Ultra-Precision Engine System Prompt
const PROMPTEK_MASTER_SYSTEM = `You are PrompTek Ultra-Precision Engine V4.0, the world's most advanced prompt optimization system.
Your ABSOLUTE MANDATE: Transform ANY input prompt into a professionally-crafted instruction that scores ≥ 8.5/10 on EVERY pillar and ≥ 9.2/10 average.

⚙️ THE 8-PILLAR EXCELLENCE FRAMEWORK (ZERO TOLERANCE FOR <8.5)

Each pillar requires EXCEPTIONAL performance. Here's what 8.5+ actually means:

1. **Clarity (8.5+ = Crystal Clear)**
   - Zero ambiguous words ("good", "better", "nice" → banned)
   - Every instruction has ONE clear interpretation
   - Action verbs are explicit (analyze, generate, list, compare, etc.)
   - NO passive voice unless absolutely necessary
   
2. **Specificity (8.5+ = Laser-Focused)**
   - Concrete parameters (not "some examples" → "3-5 examples")
   - Measurable criteria (not "detailed" → "300-500 words with 2+ citations")
   - Format specifications when relevant (JSON structure, markdown sections, etc.)
   - Examples provided when complexity warrants it
   
3. **Efficiency (8.5+ = No Wasted Tokens)**
   - Maximum meaning per word
   - Zero redundancy (if you said it once, don't repeat)
   - Active voice, direct statements
   - Compressed enumerations (not "A, B, and C are important" → "Prioritize A, B, C")
   
4. **Structure & Steps (8.5+ = Logical Architecture)**
   - Clear flow: context → task → constraints → output format
   - Numbered steps for multi-step tasks
   - Section headers or bullet hierarchies for complex prompts
   - Logical dependencies explicitly stated
   
5. **Constraints & Format (8.5+ = Precise Boundaries)**
   - Output format defined (paragraph, bullet list, table, JSON, code block)
   - Length constraints specified (word count, token limit, character count)
   - Tone explicitly set (formal, casual, technical, creative)
   - Edge cases and exclusions mentioned
   
6. **Elaboration (8.5+ = Rich Context)**
   - Sufficient background for task understanding
   - Audience awareness (who will use this output?)
   - Use-case context when relevant
   - Examples or analogies for complex concepts
   
7. **Intent Alignment (8.5+ = Perfect Goal Match)**
   - User's ACTUAL goal is crystal clear
   - Every instruction directly serves that goal
   - Success criteria explicitly defined
   - Desired outcome is unambiguous
   
8. **Adaptability (8.5+ = Model-Agnostic Excellence)**
   - Works across GPT, Claude, Gemini, Llama families
   - Handles edge cases gracefully
   - Robust against minor input variations
   - No model-specific jargon unless targeting a specific model

🧬 ULTRA-PRECISION REINFORCEMENT PROTOCOL:

BEFORE outputting, you MUST mentally execute this checklist:

**Phase 1: Initial Draft**
1. Create first optimized version
2. Mentally score each pillar 0-10

**Phase 2: Aggressive Reinforcement (CRITICAL)**
For EACH pillar scoring < 8.5:
- **Clarity < 8.5**: Add explicit action verbs, remove ALL vague terms, specify exact deliverables
- **Specificity < 8.5**: Add numerical constraints, examples, or format specifications
- **Efficiency < 8.5**: Cut redundancy, compress phrasing, use active voice exclusively
- **Structure < 8.5**: Add numbered steps, section headers, or hierarchical organization
- **Constraints < 8.5**: Define output format, length limits, tone requirements explicitly
- **Elaboration < 8.5**: Add concrete examples, background context, or use-case scenarios
- **Intent < 8.5**: Add success criteria, desired outcomes, or explicit goal statements
- **Adaptability < 8.5**: Add fallback options, conditional phrasing, edge-case handling

**Phase 3: Holistic Validation**
- Ensure NO pillar < 8.5
- Verify average ≥ 9.2
- Confirm original intent PERFECTLY preserved
- Check that improvements don't contradict each other

🎯 ABSOLUTE COMMANDMENTS:

✅ MUST DO:
- Preserve EXACT user intent and action (don't change WHAT they're asking)
- Only improve HOW they ask for it
- Achieve ≥8.5 on EVERY pillar (no exceptions)
- Target average ≥9.2 (exceptional across the board)
- Use professional, natural language
- Prioritize clarity and performance over cleverness

❌ NEVER DO:
- Answer the prompt yourself (only optimize the asking)
- Change the core request or goal
- Add unnecessary bloat just to hit word count
- Use passive voice without good reason
- Leave any vague or ambiguous terms
- Accept any pillar < 8.5 (re-optimize until it's fixed)

🔹 ADAPTIVE MODES:

**Light Mode** (prompts < 15 tokens):
- Focus on clarity, specificity, intent alignment
- Minimal elaboration (avoid over-engineering simple requests)
- Quick wins only

**Standard Mode** (prompts 15-150 tokens):
- Full 8-pillar optimization
- Balanced enhancement across all dimensions
- Target: 8.5+ each, 9.2+ average

**Deep Mode** (prompts > 150 tokens):
- Aggressive multi-layer optimization
- Add structural hierarchy
- Rich context and examples
- Target: 9.0+ each, 9.5+ average

✅ SUCCESS METRIC:
Output an optimized prompt where:
- EVERY pillar scores ≥ 8.5/10
- Average score ≥ 9.2/10
- Original intent 100% preserved
- Ready for immediate professional use`;


// PrompTek V4.0 Ultra-Precision Strategies - Guaranteed ≥8.5/10 per pillar
const OPTIMIZATION_STRATEGIES = {
  clarity: {
    name: "Cognitive Fusion (Clarity↑)",
    definition: "Transform vague language into crystal-clear, unambiguous instructions with explicit action verbs. Zero tolerance for passive voice or ambiguity. Target: ≥9.0/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Cognitive Fusion (Clarity Dominance)
Focus: Clarity↑ (9.0+), Structure↑ (8.5+), Intent↑ (8.5+)
Method: 
- Replace ALL vague words (good→excellent, better→more precise, nice→effective)
- Use explicit action verbs exclusively (analyze, generate, list, compare, calculate, design)
- Eliminate passive voice entirely unless grammatically essential
- Create linear logical flow: setup → instruction → output specification
- One interpretation only - zero ambiguity tolerance

Reinforcement Rule: If Clarity < 9.0, aggressively:
1. Replace every vague adjective/adverb with concrete terms
2. Convert passive constructions to active voice
3. Add explicit deliverable specifications
4. Break complex sentences into simple, direct statements

CRITICAL: No phrase should have multiple interpretations.`,
    weight: 0.3
  },
  specificity: {
    name: "Precision Abstraction (Specificity↑)",
    definition: "Add laser-focused measurable parameters, concrete examples, and quantifiable criteria. No vague descriptors allowed. Target: ≥9.0/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Precision Abstraction (Specificity Dominance)
Focus: Specificity↑ (9.0+), Adaptability↑ (8.5+), Clarity↑ (8.5+)
Method:
- Replace "some examples" → "3-5 concrete examples with [specific attribute]"
- Replace "detailed" → "300-500 words covering [aspect A], [aspect B], [aspect C]"
- Add numerical constraints (word counts, item counts, percentage thresholds)
- Specify output format precisely (JSON schema, markdown structure, table format)
- Provide concrete examples when task complexity > medium

Reinforcement Rule: If Specificity < 9.0, aggressively:
1. Quantify every qualitative descriptor (much→50%+, several→3-5, detailed→200+ words)
2. Add format specifications (bullets, numbered list, table, JSON, code block)
3. Include 1-2 concrete examples demonstrating expected output
4. Define success criteria measurably

CRITICAL: Ban these vague words: "good", "better", "some", "various", "detailed", "comprehensive" (unless quantified).`,
    weight: 0.25
  },
  efficiency: {
    name: "Semantic Compression (Efficiency↑)",
    definition: "Maximum meaning per token. Ruthlessly eliminate redundancy while preserving complete meaning. Target: ≥8.8/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Semantic Compression (Efficiency Dominance)
Focus: Efficiency↑ (8.8+), Specificity↑ (8.5+), Clarity↑ (8.5+)
Method:
- Use active voice exclusively (passive adds 20-40% more words)
- Compress enumerations ("A, B, and C are important" → "Prioritize A, B, C")
- Eliminate filler words (really, very, quite, somewhat, basically)
- Combine redundant clauses into single powerful statements
- Dense meaning per token without sacrificing clarity

Reinforcement Rule: If Efficiency < 8.8, aggressively:
1. Convert ALL passive voice to active
2. Remove every filler word and redundant phrase
3. Consolidate repetitive instructions
4. Use power verbs that compress meaning (utilize→use, demonstrate→show, facilitate→enable)

CRITICAL: Every word must carry semantic weight. If removing a word doesn't change meaning, remove it.`,
    weight: 0.2
  },
  structure: {
    name: "Directive Synthesis (Structure↑)",
    definition: "Transform unstructured requests into logically-sequenced, hierarchically-organized instructions. Target: ≥8.8/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Directive Synthesis (Structure Dominance)
Focus: Structure↑ (8.8+), Clarity↑ (8.5+), Constraints↑ (8.5+)
Method:
- Create clear logical flow: Context → Task → Method → Constraints → Output Format
- Use numbered steps for multi-step procedures (1., 2., 3.)
- Add section headers for complex prompts (## Analysis, ## Output Requirements)
- Organize with hierarchical bullets when listing criteria
- Make dependencies explicit ("After completing X, then Y")

Reinforcement Rule: If Structure < 8.8, aggressively:
1. Add numbered steps if task has 2+ sequential actions
2. Create section headers to group related instructions
3. Use hierarchical bullets (-, *, •) for sub-points
4. Explicitly state order dependencies ("first...", "then...", "finally...")

CRITICAL: Reader should be able to follow instructions linearly without backtracking.`,
    weight: 0.15
  },
  constraints: {
    name: "Constraint-Driven Creativity",
    definition: "Define precise boundaries (format, length, tone, style) to guide creative precision. Target: ≥8.8/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Constraint-Driven Creativity (Constraints Dominance)
Focus: Constraints↑ (8.8+), Elaboration↑ (8.5+), Adaptability↑ (8.5+)
Method:
- Specify exact output format (JSON schema, markdown, table, bullet list, code block)
- Define length constraints precisely (150-200 words, 5-7 sentences, 3-4 paragraphs)
- Set explicit tone requirements (formal academic, casual conversational, technical precise)
- Include style guidelines (use/avoid passive voice, citation format, heading levels)
- Define edge cases and exclusions ("exclude X", "do not include Y")

Reinforcement Rule: If Constraints < 8.8, aggressively:
1. Add explicit output format specification
2. Define length limits precisely (not "brief" → "50-75 words")
3. Set tone explicitly (formal/casual/technical/creative)
4. Specify what to exclude or avoid

CRITICAL: Constraints enable creativity by removing ambiguity about boundaries.`,
    weight: 0.1
  },
  elaboration: {
    name: "Contextual Intelligence Matrix",
    definition: "Embed rich context (audience, use-case, background) for situational awareness without bloat. Target: ≥8.6/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Contextual Intelligence Matrix (Elaboration Dominance)
Focus: Elaboration↑ (8.6+), Intent↑ (8.5+), Adaptability↑ (8.5+)
Method:
- Add audience awareness (technical experts, beginners, executives)
- Include use-case context (academic research, business presentation, creative writing)
- Provide relevant background when task requires domain knowledge
- Add 1-2 concrete examples for complex concepts
- Include timeframe if relevant (historical context, current trends, future projections)

Reinforcement Rule: If Elaboration < 8.6, aggressively:
1. Specify target audience explicitly
2. Add use-case context or scenario
3. Provide 1-2 concrete examples demonstrating expected output quality
4. Include relevant background information (but avoid Wikipedia dumps)

CRITICAL: Context should illuminate, not overwhelm. Every detail must serve the goal.`,
    weight: 0.12,
    condition: (prompt: string) => prompt.length < 200
  },
  intent: {
    name: "Semantic Anchoring (Intent↑)",
    definition: "Clarify user's ACTUAL goal with explicit success criteria and desired outcomes. Zero drift tolerance. Target: ≥9.0/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Semantic Anchoring (Intent Dominance)
Focus: Intent↑ (9.0+), Specificity↑ (8.5+), Clarity↑ (8.5+)
Method:
- Identify user's TRUE goal (not just surface request)
- Add explicit success criteria ("successful output includes X, Y, Z")
- Define desired outcome precisely ("the result should enable [specific action]")
- Preserve exact verb and core action from original
- Add definitional anchors to prevent scope creep

Reinforcement Rule: If Intent < 9.0, aggressively:
1. Add "Success criteria:" section with 2-3 measurable outcomes
2. Define "Desired outcome:" explicitly
3. State "Primary goal:" if not crystal clear
4. Anchor key terms with brief definitions if ambiguous

CRITICAL: Every instruction must OBVIOUSLY serve the user's actual goal. No tangents.`,
    weight: 0.12,
    condition: (prompt: string) => /\b(improve|better|fix|enhance|optimize|analyze|make)\b/i.test(prompt)
  },
  adaptability: {
    name: "Cognitive Elasticity",
    definition: "Build model-agnostic instructions that work across GPT/Claude/Gemini/Llama with edge-case handling. Target: ≥8.6/10.",
    systemPrompt: `${PROMPTEK_MASTER_SYSTEM}

🧬 ACTIVE STRATEGY: Cognitive Elasticity (Adaptability Dominance)
Focus: Adaptability↑ (8.6+), Intent↑ (8.5+), Clarity↑ (8.5+)
Method:
- Avoid model-specific jargon (unless targeting specific model)
- Add conditional phrasing for robust interpretation ("if/when applicable", "where relevant")
- Include fallback options for edge cases ("if data unavailable, use X approach")
- Make prompt work across different model capabilities
- Handle input variations gracefully

Reinforcement Rule: If Adaptability < 8.6, aggressively:
1. Add "if/when" clauses for conditional scenarios
2. Provide fallback instructions for edge cases
3. Remove model-specific references unless intentional
4. Test mental model: "Would this work on GPT-5, Claude Sonnet, and Gemini Pro?"

CRITICAL: Prompt should be robust across models, tasks, and minor input variations.`,
    weight: 0.10
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalPrompt, 
      taskDescription, 
      aiProvider = 'openai', 
      modelName = 'gpt-4o-mini', 
      outputType = 'text',
      variants = 3,
      userId,
      maxTokens = null,
      temperature = 0.7,
      influence = '',
      influenceWeight = 0,
      mode = 'deep',
      autoSave = true,
      // New template functionality
      isTemplate = false,
      templateId = null,
      saveAsTemplate = false,
      templateTitle = '',
      templateDescription = '',
      templateCategory = 'custom',
      // Progress tracking
      sessionKey = null
    } = await req.json();

    console.log('prompt-optimizer received:', { maxTokens, modelName, aiProvider, temperature, variants, outputType, mode, isTemplate, influenceWeight });

    if (!originalPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Original prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze prompt to determine if it's procedural/instructional
    const analyzePromptType = (prompt: string): boolean => {
      // Keywords that indicate procedural/instructional content
      const proceduralKeywords = [
        'how to', 'step', 'steps', 'tutorial', 'guide', 'process', 'procedure', 
        'instructions', 'explain', 'teach', 'demonstrate', 'walkthrough',
        'first', 'then', 'next', 'finally', 'follow', 'method', 'approach',
        'setup', 'configure', 'install', 'implement', 'create a', 'build a',
        'sequence', 'order', 'stage', 'phase', 'workflow'
      ];
      
      const promptLower = prompt.toLowerCase();
      
      // Check if prompt contains procedural keywords
      const hasProceduralKeywords = proceduralKeywords.some(keyword => 
        promptLower.includes(keyword)
      );
      
      // Check for numbered lists or bullet point patterns
      const hasNumberedList = /\d+\.|step \d+|\d+\)/i.test(prompt);
      
      // Check for imperative verbs that suggest instructions
      const imperativePattern = /\b(create|build|make|develop|design|setup|configure|install|write|explain|describe|outline|list)\b/i;
      const hasImperativeVerbs = imperativePattern.test(prompt);
      
      // Not procedural if it's clearly creative/conversational
      const creativeKeywords = ['story', 'poem', 'creative', 'imagine', 'pretend', 'greeting', 'hello', 'opinion', 'feel', 'think about'];
      const isCreative = creativeKeywords.some(keyword => promptLower.includes(keyword));
      
      return (hasProceduralKeywords || hasNumberedList || hasImperativeVerbs) && !isCreative;
    };

    // Enhance prompt if it's procedural/instructional
    let enhancedPrompt = originalPrompt;
    const isProcedural = analyzePromptType(originalPrompt);
    
    if (isProcedural) {
      enhancedPrompt = `${originalPrompt}\n\nEnsure the optimized prompt includes clear step-by-step or bullet-point guidance, and instructs the model to verify completeness and clarity for each step.`;
      console.log('📋 Detected procedural prompt - adding structural guidance');
    } else {
      console.log('💭 Detected creative/conversational prompt - no structural guidance needed');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const startTime = Date.now();

    // Handle Speed Mode
    if (mode === 'speed') {
      return await handleSpeedMode(supabase, { 
        originalPrompt: enhancedPrompt, 
        taskDescription, 
        outputType, 
        userId, 
        startTime, 
        variants, 
        aiProvider, 
        modelName,
        maxTokens,
        temperature,
        influence,
        influenceWeight,
        autoSave,
        sessionKey // pass through for progress tracking
      });
    }

    // Create initial prompt record in background
    let promptRecord: any = { id: null };
    const createPromptRecord = async () => {
      if (!autoSave) return { id: null };
      return await supabase
        .from('prompts')
        .insert({
          user_id: userId,
          original_prompt: enhancedPrompt,
          task_description: taskDescription,
          ai_provider: aiProvider,
          model_name: modelName,
          output_type: outputType,
          status: 'processing'
        })
        .select()
        .single();
    };

    // Generate session key for progress tracking (use provided or create new)
    const progressSessionKey = sessionKey || `${userId}_${Date.now()}`;
    
    // Helper function to update progress in database
    const updateProgress = async (progress: number, step: number, message: string) => {
      try {
        await supabase
          .from('optimization_progress')
          .upsert({
            user_id: userId,
            session_key: progressSessionKey,
            progress,
            step,
            message,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'session_key,user_id'
          });
      } catch (error) {
        console.error('Progress update failed:', error);
      }
    };

    // Initialize progress
    await updateProgress(0, 1, 'Initializing optimization...');
    
    // Start prompt record creation
    const promptRecordPromise = createPromptRecord();

    // Load cached optimization insights instead of checking all history
    await updateProgress(5, 1, 'Loading optimization insights...');
    const cachedInsights = await loadOptimizationInsights(supabase, userId, aiProvider, modelName);
    
    // Detect prompt type to determine optimization approach
    const promptType = detectPromptType(enhancedPrompt);
    console.log(`🔍 Detected prompt type: ${promptType}`);
    
    // Generate optimized variants in parallel for maximum speed
    // Filter strategies based on their conditional logic AND prompt type
    const allAvailableStrategies = Object.keys(OPTIMIZATION_STRATEGIES).filter(key => {
      const strategy = OPTIMIZATION_STRATEGIES[key as keyof typeof OPTIMIZATION_STRATEGIES];
      
      // Check if strategy has a condition function, and if so, test it
      if (strategy.condition && typeof strategy.condition === 'function') {
        if (!strategy.condition(originalPrompt)) return false;
      }
      
      // Filter strategies based on prompt type to avoid bloat
      if (promptType === 'creative') {
        // For creative prompts: Focus on intent, adaptability, clarity - avoid rigid structure/constraints
        const creativeStrategies = ['clarity', 'intent', 'adaptability', 'specificity'];
        return creativeStrategies.includes(key);
      }
      // For complex prompts: Use ALL strategies to maximize score
      return true;
    });
    
    console.log(`📋 Available strategies for ${promptType} prompt: [${allAvailableStrategies.join(', ')}]`);
    
    await updateProgress(10, 1, 'Selecting optimization strategies...');
    
    // Get ALL strategies sorted by performance for this specific LLM
    const allStrategiesSorted = selectBestStrategies(allAvailableStrategies, 0, cachedInsights, aiProvider, modelName);
    const variantCount = Math.min(Math.max(Number(variants) || 1, 1), allStrategiesSorted.length);
    
    // CRITICAL: Always include top 2 best performers for this specific LLM, then rotate through others for testing
    const top2BestForLLM = allStrategiesSorted.slice(0, 2);
    const remainingStrategies = allStrategiesSorted.slice(2);
    
    // Rotate through remaining strategies using a per-request deterministic offset
    const rotationOffset = (() => {
      const key = `${userId}:${aiProvider}:${modelName}:${Date.now()}`;
      let h = 0;
      for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i);
      return Math.abs(h) % Math.max(1, remainingStrategies.length);
    })();
    const rotatedRemaining = [...remainingStrategies.slice(rotationOffset), ...remainingStrategies.slice(0, rotationOffset)];
    
    // Combine: always top 2 + rotated remaining, up to variant count
    const selectedStrategies = [
      ...top2BestForLLM,
      ...rotatedRemaining
    ].slice(0, variantCount);
    
    console.log(`🎯 Strategy selection for ${aiProvider}/${modelName}:`);
    console.log(`   ✅ Top 2 best: [${top2BestForLLM.join(', ')}]`);
    console.log(`   🔄 Testing rotation: [${rotatedRemaining.slice(0, Math.max(0, variantCount - 2)).join(', ')}]`);
    console.log(`   📊 Final selection (${selectedStrategies.length}): [${selectedStrategies.join(', ')}]`);
    
    // Test only the requested number of strategies, prioritized by performance
    const variantPromises = selectedStrategies.map(async (strategyKey, index) => {
      const strategy = OPTIMIZATION_STRATEGIES[strategyKey as keyof typeof OPTIMIZATION_STRATEGIES];
      
      try {
        // Update progress for generating this variant
        const progressPercent = 15 + Math.floor((index / selectedStrategies.length) * 30);
        await updateProgress(progressPercent, 2, `Generating variant ${index + 1}/${selectedStrategies.length}...`);
        // Get model-friendly name for the target model
        const targetModelName = getModelFriendlyName(aiProvider, modelName);
        
        // For optimization: enhance the prompt while preserving intent
        // CRITICAL: Explicitly state the strategy being used with model awareness
        let optimizationPrompt = `You are a prompt optimization expert specializing in the ${targetModelName} language model. Tailor the improved prompt for ${targetModelName}'s preferred structure, clarity, and style.

You are optimizing a prompt using the ${strategy.name.toUpperCase()} strategy.

${strategy.definition}

${strategy.systemPrompt}

[Meta-guidance only — Do not include format requirements in the optimized prompt]
Output type context: This prompt is intended for ${outputType} output, so consider ${OUTPUT_TYPE_STRATEGIES[outputType as OutputType].description} when optimizing, but do not add format instructions to the prompt itself.

Original prompt to optimize:
${enhancedPrompt}`;
        
        // CRITICAL: Add task description as meta-instructions FIRST, before anything else
        if (taskDescription) {
          optimizationPrompt += `\n\n=== HOW TO OPTIMIZE (Meta-instructions) ===\nThe following are guidance on HOW you should optimize this prompt. These are NOT part of the prompt itself:\n${taskDescription}`;
        }
        
        // Add cached insights if available
        const strategyInsights = cachedInsights.strategies[strategyKey];
        if (strategyInsights?.patterns?.length > 0) {
          optimizationPrompt += `\n\nSuccessful patterns for this strategy: ${strategyInsights.patterns.slice(0, 3).join(', ')}`;
        }
        
        // Critical rules: keep user's intent and only improve the prompt
        const outputStrategy = OUTPUT_TYPE_STRATEGIES[outputType as OutputType];
        optimizationPrompt += `\n\nRules:\n- Preserve the user's original task and intent exactly.\n- You are optimizing a PROMPT, not answering it directly.\n- Do NOT answer the user's question - only improve how they ask it.\n- Apply the ${strategy.name.toUpperCase()} strategy throughout your optimization.\n- Consider that this prompt is intended for ${outputType} output, so optimize for ${outputStrategy.description}.\n- DO NOT add format instructions to the prompt itself (like "return as JSON" or "format as a list").\n- Return ONLY the improved prompt enclosed between <optimized_prompt> and </optimized_prompt> with no other text.\n- Do not use markdown fences or commentary.\n- The output should still be a prompt that asks for the same thing, just better.\n- Do not change the task into writing code unless the original prompt explicitly requested code.\n- Ensure the optimized prompt still requests the same task and does not alter the intended output type.`;
        
        // UNIFORM influence instructions - exactly the same for ALL variants
        if (influence && influence.trim().length > 0 && influenceWeight > 0) {
          const influenceStrength = 
            influenceWeight < 30 ? 'MINIMAL' :
            influenceWeight < 60 ? 'MODERATE' :
            'STRONG';
          
          optimizationPrompt += `\n\n=== INFLUENCE TEMPLATE (${influenceWeight}% weight) ===\nReference template:\n"${influence}"\n\n🎯 CRITICAL INFLUENCE RULES - APPLY UNIFORMLY:\n`;
          
          if (influenceWeight < 30) {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Use template for LIGHT INSPIRATION ONLY (tone/style hints)\n- PRIMARY FOCUS: ${100 - influenceWeight}% on original prompt\n- DO NOT copy template structure, phrasing, or patterns\n- Keep original prompt's core approach and voice`;
          } else if (influenceWeight < 60) {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Balance template guidance with original style\n- Blend template patterns with user's approach (${influenceWeight}% template / ${100 - influenceWeight}% original)\n- Adapt helpful template elements while preserving original intent`;
          } else {
            optimizationPrompt += `- ${influenceWeight}% = ${influenceStrength} influence\n- Closely follow template's patterns and structure\n- Adapt template approach (${influenceWeight}%) to user's specific needs (${100 - influenceWeight}%)\n- Template is primary guide, original prompt provides the topic`;
          }
        } else if (influence && influence.trim().length > 0) {
          optimizationPrompt += `\n\n=== INFLUENCE: DISABLED (0%) ===\nA template was provided but set to 0% - COMPLETELY IGNORE IT. Focus only on the original prompt.`;
        }
        
        
        // CRITICAL: Only integrate max_tokens if it's set
        if (maxTokens) {
          optimizationPrompt += `\n- IMPORTANT: Integrate the token limit naturally into the prompt as a constraint. For example, add phrasing like "in ${maxTokens} tokens or less" or "Keep the response within ${maxTokens} tokens" or "Provide a concise response (max ${maxTokens} tokens)" as part of the prompt's requirements. Make it flow naturally with the rest of the prompt - don't just append it as metadata.`;
        }

        // Textual creativity guidance derived from user's temperature (do NOT mention parameters)
        const temp = typeof temperature === 'number' ? temperature : 0.7;
        let creativityLabel = 'Balanced';
        let creativityGuidance = '- Maintain a balance between novelty and adherence to constraints.';
        if (temp <= 0.3) {
          creativityLabel = 'Highly deterministic';
          creativityGuidance = '- Emphasize specificity, determinism, and reproducibility; minimize brainstorming or randomness.';
        } else if (temp < 0.7) {
          creativityLabel = 'Balanced';
          creativityGuidance = '- Encourage limited variation while strictly following requirements and structure.';
        } else {
          creativityLabel = 'Creative';
          creativityGuidance = '- Encourage diverse ideas and varied phrasing while still meeting acceptance criteria.';
        }
        optimizationPrompt += `\n\n=== CREATIVITY STYLE (Textual guidance only) ===\nTarget: ${creativityLabel}\nGuidance:\n${creativityGuidance}\n- Embed wording in the improved prompt to achieve this style without referencing model parameters.`;
        const optimizationModel = OPTIMIZATION_MODELS[aiProvider as keyof typeof OPTIMIZATION_MODELS] || modelName;
        // Ensure minimum 1024 tokens for optimization to avoid MAX_TOKENS errors
        const optimizationTokens = maxTokens ? Math.max(1024, Math.min(maxTokens, 4096)) : 2048;
        const optimizedPromptRaw = await callAIProvider(
          aiProvider, 
          optimizationModel, 
          optimizationPrompt, 
          optimizationTokens,
          temperature
        );
        
        // Sanitize to ensure we only keep the improved prompt text (never an AI answer)
        let optimizedPrompt = (optimizedPromptRaw ?? '').toString();
        const tagMatch = optimizedPrompt.match(/<optimized_prompt>([\s\S]*?)<\/optimized_prompt>/i);
        if (tagMatch) {
          optimizedPrompt = tagMatch[1].trim();
        } else {
          const fenceMatch = optimizedPrompt.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
          if (fenceMatch) optimizedPrompt = fenceMatch[1].trim();
          optimizedPrompt = optimizedPrompt
            .replace(/^\s*Optimized Prompt:\s*/i, '')
            .replace(/^\s*(Here is|Here’s|Sure,|Certainly,|I can|As an AI)\b[:,]?\s*/i, '')
            .trim();
        }
        
        // Validate and repair if the AI returned an answer instead of a prompt
        if (optimizedPrompt && looksLikeAnswer(optimizedPrompt, enhancedPrompt)) {
          console.log(`[${strategyKey}] ⚠️ Validator failed - looks like answer, triggering repair...`);
          console.log(`[${strategyKey}] Preview:`, optimizedPrompt.slice(0, 180));
          
          try {
            const repairPrompt = `You produced OUTPUT, not a PROMPT. Rewrite as an instruction prompt that preserves the original intent. Do not include JSON, code fences, sample output, or example payloads. Return only the prompt text that tells an AI what to do.

Fix this - it should be a prompt instruction, not an answer:

${optimizedPrompt}`;

            const repairedRaw = await callAIProvider(
              aiProvider,
              optimizationModel,
              repairPrompt,
              1500,
              0.3
            );
            
            if (repairedRaw) {
              const repairedPrompt = repairedRaw.toString().trim();
              console.log(`[${strategyKey}] ✅ Repair successful`);
              console.log(`[${strategyKey}] Repaired preview:`, repairedPrompt.slice(0, 180));
              optimizedPrompt = repairedPrompt;
            }
          } catch (repairError) {
            console.error(`[${strategyKey}] Repair failed:`, repairError);
          }
        }
        
        if (!optimizedPrompt) {
          console.error('Failed to get optimization response for strategy:', strategyKey);
          return null;
        }

        // Test the optimized prompt with user's selected model
        let actualResponse = '';
        let actualScore = 0;
        
        // Update progress for testing this variant
        const testProgressPercent = 45 + Math.floor((index / selectedStrategies.length) * 40);
        await updateProgress(testProgressPercent, 3, `Testing variant ${index + 1}/${selectedStrategies.length}...`);
        
        try {
          console.log(`Testing optimized prompt with user's selected model: ${modelName}`);
          // Use 1024 tokens for testing when no limit is set (faster responses), otherwise respect user's limit
          const testTokens = maxTokens ? Math.max(512, Math.min(maxTokens, 4096)) : 1024;
          const testResponse = await callAIProvider(
            aiProvider,
            modelName,
            optimizedPrompt,
            testTokens,
            temperature
          );
          
          if (testResponse) {
            actualResponse = testResponse;
            // Score based on the actual response from the user's selected model
            // Use fast evaluation for very long responses (over 2 pages)
            const responseWords = testResponse.split(' ').length;
            if (responseWords > 1500) { // Roughly 2 pages
              console.log(`Using fast skim evaluation for long response (${responseWords} words)`);
              actualScore = fastSkimEvaluation(testResponse, strategy.weight);
            } else {
              const evalResult = await evaluateOutput(optimizedPrompt, testResponse, openAIApiKey);
              actualScore = evalResult.score / 10; // Convert 0-10 to 0-1 scale
             }
             console.log(`Actual response scored: ${actualScore} for strategy: ${strategyKey}`);
          } else {
            // If no response, re-score the optimized prompt but ensure it's actually optimized
            if (optimizedPrompt.length > originalPrompt.length * 0.8) {
              try {
                const evalResult = await evaluateOutput(optimizedPrompt, `Optimized using ${strategy.name} strategy`, openAIApiKey);
                actualScore = evalResult.score / 10; // Convert 0-10 to 0-1 scale
                actualResponse = `Successfully optimized using ${strategy.name} strategy`;
              } catch (evalError) {
                console.error('Evaluation error, using fallback:', evalError);
                actualScore = strategy.weight * 0.7;
                actualResponse = `Successfully optimized using ${strategy.name} strategy`;
              }
            } else {
              // Prompt wasn't properly optimized, give low score
              actualScore = strategy.weight * 0.3;
              actualResponse = `Partial optimization using ${strategy.name} strategy`;
            }
            console.log(`Using fallback scoring for strategy: ${strategyKey}`);
         }
       } catch (error) {
          console.error(`Error testing with user model ${modelName}:`, error);
          // Ensure we still have a properly optimized prompt even in error cases
          if (optimizedPrompt && optimizedPrompt.length > originalPrompt.length * 0.8) {
            try {
              const evalResult = await evaluateOutput(optimizedPrompt, `Optimization completed (fallback)`, openAIApiKey);
              actualScore = evalResult.score / 10;
              actualResponse = `Optimization completed using ${strategy.name} strategy (fallback)`;
            } catch (evalError) {
              console.error('Evaluation error in catch block:', evalError);
              actualScore = strategy.weight * 0.6;
              actualResponse = `Optimization completed using ${strategy.name} strategy (fallback)`;
            }
          } else {
            // If optimization failed completely, return a lower score
            actualScore = strategy.weight * 0.2;
            actualResponse = `Limited optimization using ${strategy.name} strategy`;
          }
       }

        return {
          prompt: optimizedPrompt,
          strategy: strategy.name,
          strategyKey: strategyKey,
          score: actualScore,
          response: actualResponse,
            metrics: {
              tokens_used: optimizedPrompt.length,
              response_length: actualResponse.length,
              prompt_length: originalPrompt.length,
              strategy_weight: strategy.weight * 100,
              tested_with_target_model: actualResponse !== `Optimization completed using ${strategy.name} strategy`
            }
        };

      } catch (error) {
        console.error(`Error processing strategy ${strategyKey}:`, error);
        return null;
      }
    });

    // Wait for variants in parallel
    const [promptRecordResult, ...variantResults] = await Promise.allSettled([
      promptRecordPromise,
      ...variantPromises
    ]);

    // Get prompt record (respect autoSave)
    if (autoSave) {
      promptRecord = promptRecordResult.status === 'fulfilled' ? promptRecordResult.value?.data : null;
      if (!promptRecord) {
        throw new Error('Failed to create prompt record');
      }
    } else {
      // When autoSave is off, we intentionally skip creating a DB record
      promptRecord = { id: null };
    }

    // Update progress for computing best variant
    await updateProgress(85, 4, 'Computing best variant...');
    
    // Filter successful variants
    const optimizedVariants = variantResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (optimizedVariants.length === 0) {
      throw new Error('Failed to generate any optimized variants');
    }

    // Find best variant
    const bestVariant = optimizedVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const processingTime = Date.now() - startTime;
    
    // Update progress to 95% before final updates
    await updateProgress(95, 4, 'Finalizing results...');

    // Background task for database updates and optimization insights (don't block response)
    const backgroundUpdates = async () => {
      try {
        // Store optimization history (only when autoSave is enabled and we have a prompt id)
        let historyPromises: Promise<any>[] = [];
        if (autoSave && promptRecord?.id) {
          historyPromises = optimizedVariants.map(variant => 
            supabase.from('optimization_history').insert({
              user_id: userId,
              prompt_id: promptRecord.id,
              variant_prompt: variant.prompt,
              ai_response: variant.response,
              score: variant.score,
              metrics: { ...variant.metrics, strategy: variant.strategy, optimization_strategy: variant.strategy },
              generation_time_ms: processingTime,
              tokens_used: variant.metrics.tokens_used
            })
          );

          await Promise.allSettled(historyPromises);

          // Update prompt record
          await supabase
            .from('prompts')
            .update({
              optimized_prompt: bestVariant.prompt,
              score: bestVariant.score,
              performance_metrics: {
                best_strategy: bestVariant.strategy,
                bestStrategy: bestVariant.strategy,
                total_variants: optimizedVariants.length,
                processing_time_ms: processingTime,
                processingTimeMs: processingTime,
                average_score: optimizedVariants.reduce((sum, v) => sum + v.score, 0) / optimizedVariants.length
              },
              variants_generated: optimizedVariants.length,
              status: 'completed'
            })
            .eq('id', promptRecord.id);
        }


        // Save batch findings to optimization insights - CRITICAL for speed optimization
        console.log('Starting to save batch insights to optimization_insights table...');
        await saveBatchInsights(supabase, userId, aiProvider, modelName, optimizedVariants, cachedInsights);
        console.log('✅ Batch insights saved successfully to optimization_insights table');

        console.log('Background database updates and insights completed');
      } catch (error) {
        console.error('❌ Background update error:', error);
        // Try to save insights even if other operations failed
        try {
          console.log('Attempting fallback save of batch insights...');
          await saveBatchInsights(supabase, userId, aiProvider, modelName, optimizedVariants, cachedInsights);
          console.log('✅ Fallback batch insights save successful');
        } catch (fallbackError) {
          console.error('❌ Fallback batch insights save failed:', fallbackError);
        }
      }
    };

    // Start background task to save insights
    console.log('🚀 Starting background task to save optimization insights...');
    Promise.resolve().then(() => backgroundUpdates().catch(err => 
      console.error('❌ Background task failed completely:', err)
    ));

    // Save as template if requested
    if (saveAsTemplate && templateTitle) {
      try {
        await supabase.from('prompt_templates').insert({
          user_id: userId,
          title: templateTitle,
          description: templateDescription || `Optimized template from ${bestVariant.strategy}`,
          template: bestVariant.prompt,
          category: templateCategory,
          output_type: outputType,
          rating: Math.max(1, Math.min(Math.round(bestVariant.score * 5), 5)), // Convert 0-1 score to 1-5 rating
          tags: [aiProvider, modelName, bestVariant.strategy.toLowerCase().replace(/\s+/g, '-')]
        });
        console.log('✅ Template saved successfully');
      } catch (templateError) {
        console.error('❌ Error saving template:', templateError);
      }
    }

    // Update progress to 100% - completion
    await updateProgress(100, 4, 'Complete!');
    
    // Return immediate response with sessionKey for progress tracking
    const response = {
      promptId: autoSave && promptRecord?.id ? promptRecord.id : null,
      originalPrompt,
      bestOptimizedPrompt: bestVariant.prompt,
      bestScore: bestVariant.score,
      variants: optimizedVariants,
      templateSaved: saveAsTemplate && templateTitle,
      sessionKey: progressSessionKey, // Include session key for progress tracking
      summary: {
        improvementScore: Math.round(bestVariant.score * 100), // Convert 0.93 to 93
        bestStrategy: bestVariant.strategy,
        totalVariants: optimizedVariants.length,
        processingTimeMs: processingTime
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in prompt-optimizer function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


// Helper function to get model-friendly name
function getModelFriendlyName(provider: string, model: string): string {
  const modelMap: Record<string, Record<string, string>> = {
    openai: {
      'gpt-5-2025-08-07': 'GPT-5',
      'gpt-5-mini-2025-08-07': 'GPT-5 Mini',
      'gpt-5-nano-2025-08-07': 'GPT-5 Nano',
      'gpt-4.1-2025-04-14': 'GPT-4.1',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini'
    },
    anthropic: {
      'claude-opus-4-1-20250805': 'Claude Opus 4.1',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku'
    },
    mistral: {
      'mistral-large': 'Mistral Large',
      'mistral-medium': 'Mistral Medium'
    },
    groq: {
      'llama-3.1-8b': 'Llama 3.1 8B'
    },
    google: {
      'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro'
    }
  };

  return modelMap[provider]?.[model] || model;
}


// Optimized AI provider calls
async function callAIProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string | null> {
  const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
  if (!providerConfig || !providerConfig.apiKey) {
    throw new Error(`Provider ${provider} not configured`);
  }

  let modelConfig = (providerConfig.models as any)[model];
  if (!modelConfig && provider === 'groq') {
    // Fallback to the only supported Groq model we expose
    modelConfig = (providerConfig.models as any)['llama-3.1-8b'];
  }
  if (!modelConfig) {
    throw new Error(`Model ${model} not available`);
  }

  try {
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
        return await callOpenAICompatible(providerConfig, modelConfig.name, prompt, maxTokens, temperature);
      
      case 'anthropic':
        return await callAnthropic(providerConfig, modelConfig.name, prompt, maxTokens);
      
      case 'google':
        return await callGoogle(providerConfig, modelConfig.name, prompt, maxTokens);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    return null;
  }
}

async function callOpenAICompatible(providerConfig: any, model: string, prompt: string, maxTokens: number, temperature: number): Promise<string> {
  console.log(`🟢 OpenAI-compatible API call: ${model} with maxTokens: ${maxTokens}`);
  
  const isNewerModel = /^(gpt-5|gpt-4\.1|o3|o4)/i.test(model);
  const payload: any = {
    model: model,
    messages: [{ role: 'user', content: prompt }],
  };
  
  if (isNewerModel) {
    payload.max_completion_tokens = maxTokens;
    // Newer models don't support temperature parameter - defaults to 1.0
  } else {
    payload.max_tokens = maxTokens;
    // Ignore temperature; style is enforced via prompt wording
  }

  console.log('📦 OpenAI Payload:', { model, isNewerModel, maxTokens, temp: payload.temperature });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  console.log(`📡 Response status: ${response.status} for model: ${model}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API call failed for ${model}:`, errorText);
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ OpenAI-compatible API success: ${model}`);
  return data.choices[0].message.content;
}

async function callAnthropic(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  console.log(`🟣 Anthropic API call: ${model} with maxTokens: ${maxTokens}`);
  
  console.log('📦 Anthropic Payload:', { model, maxTokens });
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const response = await fetch(providerConfig.baseUrl, {
    method: 'POST',
    headers: {
      'x-api-key': providerConfig.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  console.log(`📡 Response status: ${response.status} for model: ${model}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Anthropic API error (${response.status}):`, errorText);
    throw new Error(`Anthropic API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Anthropic API success: ${model}`);
  return data.content[0].text;
}

async function callGoogle(providerConfig: any, model: string, prompt: string, maxTokens: number): Promise<string> {
  console.log(`🔵 Google API call: ${model} with maxTokens: ${maxTokens}`);
  
  console.log('📦 Google Payload:', { model, maxOutputTokens: maxTokens });
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
  const response = await fetch(`${providerConfig.baseUrl}/${model}:generateContent?key=${providerConfig.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
      }
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  console.log(`📡 Response status: ${response.status} for model: ${model}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google API error (${response.status}):`, errorText);
    throw new Error(`Google API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ Google API response has no candidates:', JSON.stringify(data));
    throw new Error('Google API returned no candidates');
  }
  
  if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('❌ Google API response has no content parts:', JSON.stringify(data.candidates[0]));
    throw new Error('Google API returned no content parts');
  }
  
  console.log(`✅ Google API success: ${model}`);
  return data.candidates[0].content.parts[0].text;
}

// AI-powered evaluation for optimizer
async function evaluateOutput(
  prompt: string,
  output: string,
  openAIKey?: string
): Promise<{ score: number; categoryScores: CategoryScores }> {
  
  // Use AI-powered scoring with fallback to rule-based
  let scores: CategoryScores;
  
  try {
    const aiResult = await scorePromptWithAI(prompt, output, openAIKey);
    scores = aiResult.scores;
    console.log('✅ Using AI-powered scoring for optimizer evaluation');
  } catch (error) {
    console.error('AI grading failed in optimizer, using fallback:', error);
    const result = scorePromptAndOutput(prompt, output);
    scores = result.scores;
    console.log('⚠️ Using fallback rule-based scoring in optimizer');
  }

  const overallScore = calculateOverallScore(scores);

  return {
    score: overallScore,
    categoryScores: scores
  };
}

// Removed old evaluation functions - now using master-grader.ts unified scoring

// Load cached optimization insights for fast optimization
async function loadOptimizationInsights(supabase: any, userId: string, aiProvider: string, modelName: string) {
  try {
    console.log(`🔍 Loading cached insights for ${aiProvider}/${modelName}...`);
    const { data: insights } = await supabase
      .from('optimization_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('ai_provider', aiProvider)
      .eq('model_name', modelName)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (insights) {
      console.log(`✅ Loaded cached insights: ${insights.batch_count} batches, ${insights.total_optimizations} total opts, avg score: ${insights.avg_improvement_score?.toFixed(3)}`);
      console.log(`📊 Available strategies: ${Object.keys(insights.successful_strategies || {}).length}, patterns: ${Object.keys(insights.performance_patterns || {}).length}`);
      return {
        strategies: insights.successful_strategies || {},
        optimizationRules: insights.optimization_rules || {},
        performancePatterns: insights.performance_patterns || {},
        totalOptimizations: insights.total_optimizations || 0,
        avgUserScore: insights.avg_improvement_score || 0.5,
        hasCachedData: true,
        batchCount: insights.batch_count
      };
    }

    // No cached insights, return defaults for first run
    console.log('No cached insights found, using defaults for first optimization');
    return {
      strategies: {},
      optimizationRules: {},
      performancePatterns: {},
      totalOptimizations: 0,
      avgUserScore: 0.5,
      hasCachedData: false
    };
  } catch (error) {
    console.error('Error loading optimization insights:', error);
    return {
      strategies: {},
      optimizationRules: {},
      performancePatterns: {},
      totalOptimizations: 0,
      avgUserScore: 0.5,
      hasCachedData: false
    };
  }
}

// Save batch optimization findings to insights table
async function saveBatchInsights(supabase: any, userId: string, aiProvider: string, modelName: string, optimizedVariants: any[], previousInsights: any) {
  try {
    // Analyze current batch findings
    const batchSummary = {
      totalVariants: optimizedVariants.length,
      bestScore: Math.max(...optimizedVariants.map(v => v.score)),
      avgScore: optimizedVariants.reduce((sum, v) => sum + v.score, 0) / optimizedVariants.length,
      strategiesUsed: optimizedVariants.map(v => v.strategy),
      timestamp: new Date().toISOString()
    };

    // Extract successful strategies from this batch WITH PER-LLM TRACKING
    const llmKey = `${aiProvider}_${modelName}`;
    const successfulStrategies: any = {};
    
    optimizedVariants.forEach(variant => {
      if (variant.score > 0.7) {
        const patterns = extractSuccessfulPatterns(variant.prompt);
        const strategyKey = (variant.strategyKey ?? identifyStrategy(variant.strategy));
        
        if (!successfulStrategies[strategyKey]) {
          successfulStrategies[strategyKey] = { 
            patterns: [], 
            scores: [], 
            count: 0,
            byLLM: {} // Track performance per LLM
          };
        }
        
        successfulStrategies[strategyKey].patterns.push(...patterns);
        successfulStrategies[strategyKey].scores.push(variant.score);
        successfulStrategies[strategyKey].count++;
        
        // Track LLM-specific performance
        if (!successfulStrategies[strategyKey].byLLM[llmKey]) {
          successfulStrategies[strategyKey].byLLM[llmKey] = { scores: [], count: 0 };
        }
        successfulStrategies[strategyKey].byLLM[llmKey].scores.push(variant.score);
        successfulStrategies[strategyKey].byLLM[llmKey].count++;
      }
    });

    
    // Calculate averages for successful strategies (overall and per-LLM)
    Object.keys(successfulStrategies).forEach(key => {
      const strategy = successfulStrategies[key];
      strategy.avgScore = strategy.scores.reduce((sum: number, s: number) => sum + s, 0) / strategy.scores.length;
      strategy.patterns = [...new Set(strategy.patterns)]; // Remove duplicates
      
      // Calculate per-LLM averages
      Object.keys(strategy.byLLM).forEach(llm => {
        const llmData = strategy.byLLM[llm];
        llmData.avgScore = llmData.scores.reduce((sum: number, s: number) => sum + s, 0) / llmData.scores.length;
        delete llmData.scores; // Clean up
      });
      
      delete strategy.scores; // Clean up overall scores
    });

    // Merge with previous insights, preserving per-LLM data
    const mergedStrategies = { ...previousInsights.strategies };
    Object.keys(successfulStrategies).forEach(key => {
      if (mergedStrategies[key]) {
        // Update existing strategy data
        mergedStrategies[key].patterns = [...new Set([...mergedStrategies[key].patterns, ...successfulStrategies[key].patterns])];
        mergedStrategies[key].avgScore = (mergedStrategies[key].avgScore + successfulStrategies[key].avgScore) / 2;
        mergedStrategies[key].count += successfulStrategies[key].count;
        
        // Merge per-LLM data
        if (!mergedStrategies[key].byLLM) {
          mergedStrategies[key].byLLM = {};
        }
        Object.keys(successfulStrategies[key].byLLM).forEach(llm => {
          if (mergedStrategies[key].byLLM[llm]) {
            // Average with existing LLM data
            const existing = mergedStrategies[key].byLLM[llm];
            const newData = successfulStrategies[key].byLLM[llm];
            existing.avgScore = (existing.avgScore + newData.avgScore) / 2;
            existing.count += newData.count;
          } else {
            // Add new LLM data
            mergedStrategies[key].byLLM[llm] = successfulStrategies[key].byLLM[llm];
          }
        });
      } else {
        // Add new strategy data
        mergedStrategies[key] = successfulStrategies[key];
      }
    });

    // Performance patterns from this batch
    const performancePatterns = {
      topPerformingPromptLength: optimizedVariants
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Tiebreaker: prefer fewer tokens
          return (a.metrics?.tokens_used || 0) - (b.metrics?.tokens_used || 0);
        })[0]?.prompt.length || 0,
      averageResponseTime: optimizedVariants
        .reduce((sum, v) => sum + (v.metrics.response_time || 0), 0) / optimizedVariants.length,
      mostSuccessfulStrategy: optimizedVariants
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Tiebreaker: prefer fewer tokens
          return (a.metrics?.tokens_used || 0) - (b.metrics?.tokens_used || 0);
        })[0]?.strategy || 'unknown'
    };

    // Optimization rules learned from this batch
    const optimizationRules = {
      minPromptLength: Math.min(...optimizedVariants.map(v => v.prompt.length)),
      maxPromptLength: Math.max(...optimizedVariants.map(v => v.prompt.length)),
      optimalPromptLength: performancePatterns.topPerformingPromptLength,
      avoidPatterns: optimizedVariants
        .filter(v => v.score < 0.5)
        .map(v => extractSuccessfulPatterns(v.prompt))
        .flat()
        .filter((pattern, index, arr) => arr.indexOf(pattern) === index)
        .slice(0, 5) // Top 5 patterns to avoid
    };

    const newTotalOptimizations = (previousInsights.totalOptimizations || 0) + optimizedVariants.length;
    const newAvgScore = previousInsights.hasCachedData 
      ? (previousInsights.avgUserScore + batchSummary.avgScore) / 2
      : batchSummary.avgScore;
    const newBatchCount = (previousInsights.batchCount || 0) + 1;

    console.log(`Saving insights: batch ${newBatchCount}, total opts: ${newTotalOptimizations}, avg score: ${newAvgScore.toFixed(3)}`);

    // First try to update existing record
    const { data: existingRecord } = await supabase
      .from('optimization_insights')
      .select('id')
      .eq('user_id', userId)
      .eq('ai_provider', aiProvider)
      .eq('model_name', modelName)
      .maybeSingle();

    let result;
    if (existingRecord) {
      // Update existing record
      console.log(`Updating existing insights record: ${existingRecord.id}`);
      result = await supabase
        .from('optimization_insights')
        .update({
          batch_summary: batchSummary,
          successful_strategies: mergedStrategies,
          performance_patterns: performancePatterns,
          optimization_rules: optimizationRules,
          batch_count: newBatchCount,
          total_optimizations: newTotalOptimizations,
          avg_improvement_score: newAvgScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
    } else {
      // Insert new record
      console.log('Creating new insights record');
      result = await supabase
        .from('optimization_insights')
        .insert({
          user_id: userId,
          ai_provider: aiProvider,
          model_name: modelName,
          batch_summary: batchSummary,
          successful_strategies: mergedStrategies,
          performance_patterns: performancePatterns,
          optimization_rules: optimizationRules,
          batch_count: newBatchCount,
          total_optimizations: newTotalOptimizations,
          avg_improvement_score: newAvgScore
        });
    }

    const { error } = result;

    if (error) {
      console.error('❌ Error saving batch insights to optimization_insights table:', error);
      throw error; // Re-throw to trigger fallback logging
    } else {
      console.log(`✅ Successfully saved batch insights: ${optimizedVariants.length} variants, avg score: ${batchSummary.avgScore.toFixed(3)}, batch #${newBatchCount}`);
      
      // Verify the save worked by checking if record exists
      const { data: verification } = await supabase
        .from('optimization_insights')
        .select('batch_count, total_optimizations')
        .eq('user_id', userId)
        .eq('ai_provider', aiProvider)
        .eq('model_name', modelName)
        .maybeSingle();
      
      if (verification) {
        console.log(`✅ Verification successful: Record shows ${verification.batch_count} batches, ${verification.total_optimizations} total optimizations`);
      } else {
        console.error('❌ Verification failed: Could not find saved insights record');
      }
    }

  } catch (error) {
    console.error('❌ Critical error in saveBatchInsights:', error);
    throw error; // Re-throw so calling function can handle fallback
  }
}

// Select and prioritize strategies based on cached insights
// Returns ALL strategies but sorted by performance (best first)
function selectBestStrategies(
  allStrategies: string[], 
  variantCount: number, 
  cachedInsights: any, 
  aiProvider?: string, 
  modelName?: string
): string[] {
  if (!cachedInsights.hasCachedData || cachedInsights.totalOptimizations < 3) {
    // Not enough cached data, return all strategies in default order
    console.log('Using all strategies in default order - insufficient cached data');
    return allStrategies;
  }

  const llmKey = aiProvider && modelName ? `${aiProvider}_${modelName}` : null;

  // Sort ALL strategies by cached performance (best first)
  const strategyScores = allStrategies.map(strategy => {
    let score = 0.5;
    let count = 0;
    
    const strategyData = cachedInsights.strategies[strategy];
    if (strategyData) {
      // Check for LLM-specific performance data first with legacy fallbacks
      const byLLM = strategyData.byLLM ?? strategyData.by_llm;
      if (llmKey && byLLM && byLLM[llmKey]) {
        const llmData = byLLM[llmKey];
        score = (llmData.avgScore ?? llmData.avg_score ?? 0.5);
        count = llmData.count ?? 0;
      } else {
        score = (strategyData.avgScore ?? strategyData.avg_score ?? 0.5);
        count = strategyData.count ?? 0;
      }
    }
    
    return { strategy, score, count };
  });

  strategyScores.sort((a, b) => {
    // Prioritize strategies with both high scores and sufficient data
    const scoreA = a.score * Math.min(1, a.count / 3); // Confidence factor
    const scoreB = b.score * Math.min(1, b.count / 3);
    return scoreB - scoreA;
  });
  
  // Return ALL strategies, sorted by performance
  const sorted = strategyScores.map(s => s.strategy);
  console.log(`Testing all ${sorted.length} strategies, prioritized by performance for ${llmKey || 'general'}: ${sorted.join(', ')}`);
  return sorted;
}

// Extract successful patterns from optimized prompts
function extractSuccessfulPatterns(prompt: string): string[] {
  const patterns = [];
  
  // Look for common successful patterns
  if (/step.by.step|step-by-step/i.test(prompt)) patterns.push('step-by-step instructions');
  if (/example|for instance|such as/i.test(prompt)) patterns.push('concrete examples');
  if (/format|structure|organize/i.test(prompt)) patterns.push('clear formatting');
  if (/context|background|setting/i.test(prompt)) patterns.push('contextual information');
  if (/specific|detailed|precise/i.test(prompt)) patterns.push('specific requirements');
  if (/constraint|limit|requirement/i.test(prompt)) patterns.push('clear constraints');
  
  return patterns;
}

// Identify which strategy a pattern belongs to
function identifyStrategy(pattern: string): string {
  if (pattern.includes('step-by-step') || pattern.includes('structure')) return 'structure';
  if (pattern.includes('specific') || pattern.includes('detailed')) return 'specificity';
  if (pattern.includes('examples') || pattern.includes('concrete')) return 'clarity';
  if (pattern.includes('constraints') || pattern.includes('requirements')) return 'constraints';
  return 'efficiency';
}

// Validator: Detect if the AI returned an answer instead of a prompt
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