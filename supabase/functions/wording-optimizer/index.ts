// DSPy-Style Wording Optimizer
// Discovers optimal wording variations through A/B testing
// ONLY changes wording - never rules, metrics, or structure

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phrases from the optimization schema to test
const PHRASES_TO_TEST = [
  // Role synthesis phrases
  "You are a",
  "Think step by step",
  "Be specific and detailed",
  "Provide concrete examples",
  
  // Power words from replace map
  "exceptional",
  "more precise",
  "include background context, key factors, and 2–3 concrete examples",
  
  // Instruction phrases
  "Zero ambiguity",
  "explicit verbs",
  "single interpretation",
  "Concrete scope",
  "Max meaning/token",
  "zero redundancy",
  "Clear logical flow",
  "Explicit but intent-safe boundaries",
  
  // Common prompt patterns
  "Analyze the following",
  "Provide a detailed",
  "Explain how",
  "List the key",
  "Summarize the main",
];

// Test prompts for evaluating wording effectiveness
const TEST_PROMPTS = [
  "Write a marketing email for a new product launch",
  "Explain quantum computing to a beginner",
  "Create a business plan outline for a startup",
  "Analyze the pros and cons of remote work",
  "Write code to sort an array efficiently",
  "Summarize the key points of climate change research",
  "Design a user interface for a mobile app",
  "Create a meal plan for a week",
  "Explain machine learning algorithms",
  "Write a cover letter for a job application",
];

interface WordingResult {
  original: string;
  variation: string;
  originalScore: number;
  variationScore: number;
  improvement: number;
  testPrompt: string;
}

interface WordingPattern {
  original_phrase: string;
  winning_phrase: string;
  avg_score_improvement: number;
  test_count: number;
  confidence: number;
  applicable_domains: string[];
  applicable_models: string[];
}

/**
 * Generate synonymous variations for a phrase using LLM
 */
async function generateVariations(phrase: string, apiKey: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a linguistic variation generator. Your job is to create alternative phrasings that mean EXACTLY the same thing but use different words.

RULES:
- Keep the EXACT same meaning
- Only change the words/structure
- Maintain the same formality level
- Keep similar length
- No added concepts or constraints
- Return 5 variations as a JSON array`
        },
        {
          role: 'user',
          content: `Generate 5 alternative phrasings for: "${phrase}"\n\nReturn only a JSON array of strings.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    console.error('Failed to generate variations:', await response.text());
    return [];
  }

  const data = await response.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.variations || parsed.alternatives || Object.values(parsed).flat().filter((v: any) => typeof v === 'string');
  } catch (e) {
    console.error('Failed to parse variations:', e);
    return [];
  }
}

/**
 * Score a prompt using the combined grader approach
 */
async function scorePrompt(prompt: string, apiKey: string): Promise<number> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Score this prompt on a scale of 0-10 based on:
1. Clarity (is the goal obvious?)
2. Specificity (concrete details?)
3. Structure (logical flow?)
4. Efficiency (concise?)

Return ONLY a JSON object: {"score": X, "reasoning": "brief explanation"}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to score prompt');
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed.score || 5;
}

/**
 * Test a single wording variation against the original
 */
async function testWordingVariation(
  testPrompt: string,
  originalPhrase: string,
  newPhrase: string,
  apiKey: string
): Promise<WordingResult> {
  // Create optimized prompt with original phrase
  const promptWithOriginal = `${originalPhrase}. ${testPrompt}`;
  const originalScore = await scorePrompt(promptWithOriginal, apiKey);

  // Create optimized prompt with new phrase
  const promptWithNew = `${newPhrase}. ${testPrompt}`;
  const variationScore = await scorePrompt(promptWithNew, apiKey);

  return {
    original: originalPhrase,
    variation: newPhrase,
    originalScore,
    variationScore,
    improvement: variationScore - originalScore,
    testPrompt,
  };
}

/**
 * Calculate confidence based on test results
 */
function calculateConfidence(results: WordingResult[]): number {
  if (results.length === 0) return 0;
  
  const wins = results.filter(r => r.improvement > 0).length;
  const winRate = wins / results.length;
  
  // Adjust for sample size (more tests = more confident)
  const sampleBonus = Math.min(results.length / 20, 0.2); // Max 0.2 bonus at 20+ tests
  
  return Math.min(winRate + sampleBonus, 1.0);
}

/**
 * Run the wording optimization discovery
 */
async function runWordingDiscovery(
  supabase: any,
  apiKey: string,
  phrasesToTest: string[] = PHRASES_TO_TEST,
  testsPerPhrase: number = 3
): Promise<WordingPattern[]> {
  const discoveredPatterns: WordingPattern[] = [];
  
  console.log(`🔬 Starting wording discovery for ${phrasesToTest.length} phrases...`);
  
  for (const phrase of phrasesToTest) {
    console.log(`\n📝 Testing phrase: "${phrase}"`);
    
    // Generate variations
    const variations = await generateVariations(phrase, apiKey);
    if (variations.length === 0) {
      console.log(`  ⚠️ No variations generated, skipping...`);
      continue;
    }
    
    console.log(`  📊 Testing ${variations.length} variations...`);
    
    // Test each variation against multiple test prompts
    const variationResults: Map<string, WordingResult[]> = new Map();
    
    for (const variation of variations) {
      variationResults.set(variation, []);
      
      // Select random test prompts
      const selectedTests = TEST_PROMPTS
        .sort(() => Math.random() - 0.5)
        .slice(0, testsPerPhrase);
      
      for (const testPrompt of selectedTests) {
        try {
          const result = await testWordingVariation(testPrompt, phrase, variation, apiKey);
          variationResults.get(variation)!.push(result);
          
          console.log(`    ${variation}: ${result.improvement > 0 ? '✅' : '❌'} ${result.improvement.toFixed(2)}`);
        } catch (e) {
          console.error(`    Error testing "${variation}":`, e);
        }
      }
    }
    
    // Find the best performing variation
    let bestVariation = '';
    let bestAvgImprovement = 0;
    let bestResults: WordingResult[] = [];
    
    for (const [variation, results] of variationResults) {
      const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
      
      if (avgImprovement > bestAvgImprovement) {
        bestAvgImprovement = avgImprovement;
        bestVariation = variation;
        bestResults = results;
      }
    }
    
    // Only store if improvement is positive
    if (bestAvgImprovement > 0 && bestVariation) {
      const pattern: WordingPattern = {
        original_phrase: phrase,
        winning_phrase: bestVariation,
        avg_score_improvement: bestAvgImprovement,
        test_count: bestResults.length,
        confidence: calculateConfidence(bestResults),
        applicable_domains: [], // Could be inferred from test prompts
        applicable_models: ['gpt-4o-mini'], // Tested on this model
      };
      
      discoveredPatterns.push(pattern);
      
      console.log(`  🏆 Winner: "${bestVariation}" (+${bestAvgImprovement.toFixed(2)}, confidence: ${pattern.confidence.toFixed(2)})`);
      
      // Upsert to database
      const { error } = await supabase
        .from('wording_patterns')
        .upsert({
          original_phrase: pattern.original_phrase,
          winning_phrase: pattern.winning_phrase,
          avg_score_improvement: pattern.avg_score_improvement,
          test_count: pattern.test_count,
          confidence: pattern.confidence,
          applicable_domains: pattern.applicable_domains,
          applicable_models: pattern.applicable_models,
          is_active: pattern.confidence >= 0.5, // Only activate high-confidence patterns
          last_tested: new Date().toISOString(),
        }, {
          onConflict: 'original_phrase,winning_phrase',
        });
      
      if (error) {
        console.error('Failed to save pattern:', error);
      }
    }
  }
  
  console.log(`\n✨ Discovery complete! Found ${discoveredPatterns.length} winning patterns.`);
  return discoveredPatterns;
}

/**
 * Load active wording patterns from database
 */
async function loadActivePatterns(supabase: any, minConfidence: number = 0.6): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('wording_patterns')
    .select('original_phrase, winning_phrase, avg_score_improvement, confidence')
    .eq('is_active', true)
    .gte('confidence', minConfidence)
    .order('avg_score_improvement', { ascending: false });
  
  if (error) {
    console.error('Failed to load patterns:', error);
    return {};
  }
  
  const patterns: Record<string, string> = {};
  for (const row of data || []) {
    // Only use the best variation for each original phrase
    if (!patterns[row.original_phrase]) {
      patterns[row.original_phrase] = row.winning_phrase;
    }
  }
  
  console.log(`📚 Loaded ${Object.keys(patterns).length} active wording patterns`);
  return patterns;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, phrases, testsPerPhrase, minConfidence } = await req.json();
    
    switch (action) {
      case 'discover': {
        // Run discovery on specified phrases or defaults
        const phrasesToTest = phrases?.length > 0 ? phrases : PHRASES_TO_TEST;
        const tests = testsPerPhrase || 3;
        
        console.log(`🚀 Starting wording discovery (${phrasesToTest.length} phrases, ${tests} tests each)`);
        
        const patterns = await runWordingDiscovery(supabase, openAIKey, phrasesToTest, tests);
        
        return new Response(JSON.stringify({
          success: true,
          discovered: patterns.length,
          patterns,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'load': {
        // Load active patterns for use in optimization
        const patterns = await loadActivePatterns(supabase, minConfidence || 0.6);
        
        return new Response(JSON.stringify({
          success: true,
          count: Object.keys(patterns).length,
          patterns,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'list': {
        // List all patterns with stats
        const { data, error } = await supabase
          .from('wording_patterns')
          .select('*')
          .order('avg_score_improvement', { ascending: false });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({
          success: true,
          count: data?.length || 0,
          patterns: data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'test_single': {
        // Test a single phrase with variations
        const { phrase, testPrompt } = await req.json();
        if (!phrase) throw new Error('phrase required');
        
        const variations = await generateVariations(phrase, openAIKey);
        const results: WordingResult[] = [];
        
        const testStr = testPrompt || TEST_PROMPTS[0];
        for (const variation of variations) {
          const result = await testWordingVariation(testStr, phrase, variation, openAIKey);
          results.push(result);
        }
        
        return new Response(JSON.stringify({
          success: true,
          original: phrase,
          results: results.sort((a, b) => b.improvement - a.improvement),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response(JSON.stringify({
          error: 'Invalid action. Use: discover, load, list, or test_single',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
  } catch (error) {
    console.error('Wording optimizer error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
