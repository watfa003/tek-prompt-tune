import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "watfa003@gmail.com";

interface IndividualChange {
  change_id: string;
  change_type: "strategy_weight" | "strategy_apply_step" | "strategy_fix_rule" | "master_prompt_rule" | "target_score";
  target_strategy: string;
  current_value: any;
  proposed_value: any;
  evidence: {
    data_points: number;
    avg_score: number;
    negative_rate: number;
    regression_categories?: string[];
    feedback_themes?: string[];
    pillar_scores?: Record<string, number>;
    research_support?: { modification: string; score_delta: number }[];
  };
  reasoning: string;
  expected_impact: string;
  risk_level: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
  review_notes?: string;
}

interface StrategyPerformance {
  name: string;
  count: number;
  avgScore: number;
  positiveCount: number;
  negativeCount: number;
  negativeRate: number;
  avgSpecificity: number;
  avgFormality: number;
  avgReasoningDepth: number;
  avgPerplexity: number;
  avgHallucinationRisk: number;
  regressionCategories: string[];
  feedbackReasons: string[];
}

// Analyze strategy performance from prompt_analysis data
function analyzeStrategyPerformance(analysisData: any[]): Record<string, StrategyPerformance> {
  const performance: Record<string, StrategyPerformance> = {};

  for (const row of analysisData) {
    const strategy = row.strategy;
    if (!strategy) continue;

    if (!performance[strategy]) {
      performance[strategy] = {
        name: strategy,
        count: 0,
        avgScore: 0,
        positiveCount: 0,
        negativeCount: 0,
        negativeRate: 0,
        avgSpecificity: 0,
        avgFormality: 0,
        avgReasoningDepth: 0,
        avgPerplexity: 0,
        avgHallucinationRisk: 0,
        regressionCategories: [],
        feedbackReasons: [],
      };
    }

    const p = performance[strategy];
    p.count++;
    p.avgScore = ((p.avgScore * (p.count - 1)) + (row.score || 0)) / p.count;
    
    if (row.user_feedback === "positive") p.positiveCount++;
    if (row.user_feedback === "negative") {
      p.negativeCount++;
      if (row.feedback_reason) p.feedbackReasons.push(row.feedback_reason);
    }
    
    // Pillar scores
    if (row.specificity_score) p.avgSpecificity = ((p.avgSpecificity * (p.count - 1)) + row.specificity_score) / p.count;
    if (row.formality_score) p.avgFormality = ((p.avgFormality * (p.count - 1)) + row.formality_score) / p.count;
    if (row.reasoning_depth) p.avgReasoningDepth = ((p.avgReasoningDepth * (p.count - 1)) + row.reasoning_depth) / p.count;
    if (row.perplexity) p.avgPerplexity = ((p.avgPerplexity * (p.count - 1)) + row.perplexity) / p.count;
    if (row.hallucination_risk) p.avgHallucinationRisk = ((p.avgHallucinationRisk * (p.count - 1)) + row.hallucination_risk) / p.count;
    
    // Regressions
    if (row.regression_detected && row.regression_categories) {
      p.regressionCategories.push(...row.regression_categories);
    }
  }

  // Calculate negative rates
  for (const strategy of Object.values(performance)) {
    strategy.negativeRate = strategy.count > 0 ? strategy.negativeCount / strategy.count : 0;
  }

  return performance;
}

// Use LLM to analyze patterns and generate change proposals
async function analyzeWithLLM(
  strategyPerformance: Record<string, StrategyPerformance>,
  researchResults: any[],
  globalMetrics: { avgScore: number; totalOptimizations: number; negativeRate: number }
): Promise<IndividualChange[]> {
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIKey) {
    console.log("No OpenAI key, using rule-based analysis");
    return generateRuleBasedChanges(strategyPerformance, researchResults, globalMetrics);
  }

  const prompt = `You are an expert prompt optimization analyst. Analyze the following performance data and propose specific, actionable changes to improve the prompt optimization system.

## Current Strategy Performance (last 7 days):
${JSON.stringify(strategyPerformance, null, 2)}

## Research Results (successful modifications):
${JSON.stringify(researchResults.slice(0, 20), null, 2)}

## Global Metrics:
- Total optimizations: ${globalMetrics.totalOptimizations}
- Average score: ${globalMetrics.avgScore.toFixed(2)}
- Negative feedback rate: ${(globalMetrics.negativeRate * 100).toFixed(1)}%

## Your Task:
Analyze patterns and propose specific changes. For each proposed change, provide:
1. change_type: One of "strategy_weight", "strategy_apply_step", "strategy_fix_rule", "master_prompt_rule", "target_score"
2. target_strategy: Which strategy is affected
3. current_value: What the current setting is (be specific)
4. proposed_value: What you propose to change it to
5. reasoning: Clear explanation (2-3 sentences max)
6. expected_impact: Quantified prediction like "+0.3 avg score"
7. risk_level: "low", "medium", or "high"

Focus on:
- Strategies with high negative feedback rates (>30%)
- Strategies with low average scores (<7.5)
- Patterns from research that show clear improvements
- Regression patterns that indicate problematic transformations

Respond with a JSON array of changes. Maximum 5 changes. Be conservative - propose patch-based improvements, not rewrites.

Example format:
[
  {
    "change_type": "strategy_weight",
    "target_strategy": "efficiency",
    "current_value": 0.20,
    "proposed_value": 0.15,
    "reasoning": "Efficiency strategy shows 45% negative rate with feedback about 'lost context'. Reducing weight allows other strategies to preserve more detail.",
    "expected_impact": "+0.3 specificity improvement",
    "risk_level": "low"
  }
]`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a prompt optimization expert. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    let llmChanges: any[];
    try {
      // Handle markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      llmChanges = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse LLM response:", content);
      return generateRuleBasedChanges(strategyPerformance, researchResults, globalMetrics);
    }

    // Convert LLM output to IndividualChange format
    return llmChanges.map((change: any, i: number) => ({
      change_id: `chg_${change.target_strategy || 'general'}_${change.change_type}_${Date.now()}_${i}`,
      change_type: change.change_type,
      target_strategy: change.target_strategy || "general",
      current_value: change.current_value,
      proposed_value: change.proposed_value,
      evidence: {
        data_points: strategyPerformance[change.target_strategy]?.count || 0,
        avg_score: strategyPerformance[change.target_strategy]?.avgScore || 0,
        negative_rate: strategyPerformance[change.target_strategy]?.negativeRate || 0,
        pillar_scores: strategyPerformance[change.target_strategy] ? {
          specificity: strategyPerformance[change.target_strategy].avgSpecificity,
          formality: strategyPerformance[change.target_strategy].avgFormality,
          reasoning_depth: strategyPerformance[change.target_strategy].avgReasoningDepth,
        } : undefined,
        feedback_themes: strategyPerformance[change.target_strategy]?.feedbackReasons.slice(0, 5),
        regression_categories: [...new Set(strategyPerformance[change.target_strategy]?.regressionCategories || [])].slice(0, 5),
      },
      reasoning: change.reasoning,
      expected_impact: change.expected_impact,
      risk_level: change.risk_level || "medium",
      status: "pending" as const,
    }));
  } catch (error) {
    console.error("LLM analysis failed:", error);
    return generateRuleBasedChanges(strategyPerformance, researchResults, globalMetrics);
  }
}

// Fallback rule-based change generation
function generateRuleBasedChanges(
  strategyPerformance: Record<string, StrategyPerformance>,
  researchResults: any[],
  globalMetrics: { avgScore: number; totalOptimizations: number; negativeRate: number }
): IndividualChange[] {
  const changes: IndividualChange[] = [];
  const timestamp = Date.now();

  // Find underperforming strategies
  for (const [name, perf] of Object.entries(strategyPerformance)) {
    if (perf.count < 5) continue; // Need minimum sample size

    // High negative feedback rate
    if (perf.negativeRate > 0.3) {
      changes.push({
        change_id: `chg_${name}_weight_${timestamp}`,
        change_type: "strategy_weight",
        target_strategy: name,
        current_value: "current weight",
        proposed_value: "reduce by 0.1",
        evidence: {
          data_points: perf.count,
          avg_score: perf.avgScore,
          negative_rate: perf.negativeRate,
          feedback_themes: perf.feedbackReasons.slice(0, 5),
        },
        reasoning: `Strategy "${name}" has ${(perf.negativeRate * 100).toFixed(1)}% negative feedback rate (${perf.negativeCount} of ${perf.count}). Top complaints: ${perf.feedbackReasons.slice(0, 3).join(", ") || "N/A"}. Reducing weight may improve user satisfaction.`,
        expected_impact: "+0.2 to +0.4 satisfaction improvement",
        risk_level: "low",
        status: "pending",
      });
    }

    // Low pillar scores with regressions
    if (perf.avgSpecificity < 7 && perf.regressionCategories.includes("specificity_decreased")) {
      changes.push({
        change_id: `chg_${name}_fix_specificity_${timestamp}`,
        change_type: "strategy_fix_rule",
        target_strategy: name,
        current_value: "current fix rules",
        proposed_value: "add specificity preservation check",
        evidence: {
          data_points: perf.count,
          avg_score: perf.avgScore,
          negative_rate: perf.negativeRate,
          pillar_scores: { specificity: perf.avgSpecificity },
          regression_categories: ["specificity_decreased"],
        },
        reasoning: `Strategy "${name}" shows average specificity of ${perf.avgSpecificity.toFixed(1)} with frequent specificity_decreased regressions. Adding a fix rule to preserve key details may help.`,
        expected_impact: "+0.3 specificity score improvement",
        risk_level: "medium",
        status: "pending",
      });
    }
  }

  // Check research results for successful modifications
  const successfulMods = researchResults.filter(r => r.score_delta > 0.3);
  for (const mod of successfulMods.slice(0, 2)) {
    changes.push({
      change_id: `chg_research_${mod.modification_applied}_${timestamp}`,
      change_type: "strategy_apply_step",
      target_strategy: mod.modification_applied?.split("_")[0] || "general",
      current_value: "current apply steps",
      proposed_value: `add: "${mod.modification_applied}"`,
      evidence: {
        data_points: 1,
        avg_score: mod.modified_score || 0,
        negative_rate: 0,
        research_support: [{ modification: mod.modification_applied, score_delta: mod.score_delta }],
      },
      reasoning: `Research testing shows "${mod.modification_applied}" improved scores by +${mod.score_delta?.toFixed(2) || "?"} in controlled tests. Adding as apply step may provide consistent improvements.`,
      expected_impact: `+${mod.score_delta?.toFixed(2) || "0.3"} score improvement`,
      risk_level: "medium",
      status: "pending",
    });
  }

  return changes.slice(0, 5); // Max 5 changes
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.email !== OWNER_EMAIL) {
      console.log("Access denied for:", user?.email);
      return new Response(JSON.stringify({ error: "Access denied - owner only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Owner verified:", user.email);

    // Calculate week range
    const now = new Date();
    const weekEnd = new Date(now);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    console.log("📊 Gathering data from", weekStart.toISOString(), "to", weekEnd.toISOString());

    // Gather comprehensive data
    const [promptsResult, analysisResult, researchResult, insightsResult] = await Promise.all([
      supabase
        .from("prompts")
        .select("score, ai_provider, model_name, created_at")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString()),
      
      supabase
        .from("prompt_analysis")
        .select(`
          score, strategy, user_feedback, feedback_reason,
          specificity_score, formality_score, reasoning_depth,
          perplexity, hallucination_risk, regression_detected, regression_categories,
          word_count_delta, specificity_delta
        `)
        .gte("created_at", weekStart.toISOString()),
      
      supabase
        .from("research_results")
        .select("modification_applied, score_delta, modified_score, base_score, test_type")
        .gt("score_delta", 0)
        .order("score_delta", { ascending: false })
        .limit(50),
      
      supabase
        .from("optimization_insights")
        .select("successful_strategies, avg_improvement_score, performance_patterns")
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    const recentPrompts = promptsResult.data || [];
    const recentAnalysis = analysisResult.data || [];
    const researchResults = researchResult.data || [];
    const insights = insightsResult.data || [];

    console.log(`📈 Data gathered: ${recentPrompts.length} prompts, ${recentAnalysis.length} analysis records, ${researchResults.length} research results`);

    // Analyze strategy performance
    const strategyPerformance = analyzeStrategyPerformance(recentAnalysis);

    // Calculate global metrics
    const totalOptimizations = recentPrompts.length;
    const avgScore = recentPrompts.length
      ? recentPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / recentPrompts.length
      : 0;
    const totalNegative = recentAnalysis.filter(a => a.user_feedback === "negative").length;
    const negativeRate = recentAnalysis.length > 0 ? totalNegative / recentAnalysis.length : 0;

    const globalMetrics = { avgScore, totalOptimizations, negativeRate };

    console.log("🔍 Analyzing patterns with LLM...");

    // Generate change proposals using LLM
    const individualChanges = await analyzeWithLLM(strategyPerformance, researchResults, globalMetrics);

    console.log(`💡 Generated ${individualChanges.length} change proposals`);

    // Build analysis summary
    const analysisSummary = {
      total_optimizations: totalOptimizations,
      avg_score: parseFloat(avgScore.toFixed(2)),
      negative_feedback_count: totalNegative,
      negative_rate: parseFloat((negativeRate * 100).toFixed(1)),
      strategies_analyzed: Object.keys(strategyPerformance).length,
      top_strategies: Object.entries(strategyPerformance)
        .sort((a, b) => b[1].avgScore - a[1].avgScore)
        .slice(0, 5)
        .map(([name, perf]) => ({
          name,
          avg_score: parseFloat(perf.avgScore.toFixed(2)),
          count: perf.count,
          negative_rate: parseFloat((perf.negativeRate * 100).toFixed(1)),
        })),
      weakest_pillars: Object.entries(strategyPerformance)
        .flatMap(([name, perf]) => [
          { pillar: "specificity", score: perf.avgSpecificity, strategy: name },
          { pillar: "formality", score: perf.avgFormality, strategy: name },
          { pillar: "reasoning", score: perf.avgReasoningDepth, strategy: name },
        ])
        .filter(p => p.score > 0 && p.score < 7)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5),
      research_insights: researchResults.slice(0, 5).map(r => ({
        modification: r.modification_applied,
        score_delta: r.score_delta,
      })),
    };

    // Build findings
    const findings = [];
    if (avgScore < 7.5) {
      findings.push({ type: "score_drop", severity: "high", message: `Average score (${avgScore.toFixed(2)}) is below target (7.5)` });
    }
    if (negativeRate > 0.2) {
      findings.push({ type: "negative_feedback", severity: "high", message: `Negative feedback rate (${(negativeRate * 100).toFixed(1)}%) is high` });
    }
    for (const [name, perf] of Object.entries(strategyPerformance)) {
      if (perf.negativeRate > 0.3 && perf.count >= 5) {
        findings.push({ 
          type: "weak_strategy", 
          severity: "medium",
          message: `Strategy "${name}" has ${(perf.negativeRate * 100).toFixed(1)}% negative rate (${perf.negativeCount}/${perf.count})`,
          details: perf.feedbackReasons.slice(0, 3),
        });
      }
    }

    // Calculate confidence
    const confidenceScore = Math.min(0.95, 0.5 + (totalOptimizations / 200) * 0.3 + (individualChanges.length > 0 ? 0.15 : 0));

    // Create change request
    const { data: changeRequest, error: insertError } = await supabase
      .from("weekly_change_requests")
      .insert({
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
        status: "submitted",
        submitted_at: new Date().toISOString(),
        analysis_summary: analysisSummary,
        findings,
        proposed_changes: {
          strategy_adjustments: individualChanges.filter(c => c.change_type === "strategy_weight"),
          apply_step_changes: individualChanges.filter(c => c.change_type === "strategy_apply_step"),
          fix_rule_changes: individualChanges.filter(c => c.change_type === "strategy_fix_rule"),
          master_prompt_changes: individualChanges.filter(c => c.change_type === "master_prompt_rule"),
        },
        individual_changes: individualChanges,
        strategy_changes: individualChanges.filter(c => 
          ["strategy_weight", "strategy_apply_step", "strategy_fix_rule"].includes(c.change_type)
        ),
        expected_impact: {
          estimated_score_improvement: individualChanges.length > 0 ? "+0.2 to +0.5" : "minimal",
          risk_level: individualChanges.every(c => c.risk_level === "low") ? "low" : "medium",
          changes_proposed: individualChanges.length,
        },
        risk_assessment: {
          level: individualChanges.some(c => c.risk_level === "high") ? "high" : 
                 individualChanges.some(c => c.risk_level === "medium") ? "medium" : "low",
          notes: "Conservative patch-based changes with rollback capability",
          high_risk_changes: individualChanges.filter(c => c.risk_level === "high").length,
        },
        rollback_plan: {
          strategy: "Restore previous strategy weights from strategy_definitions_versions",
          individual_rollback: true,
          estimated_time: "< 5 minutes",
        },
        confidence_score: confidenceScore,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await supabase.from("admin_audit_log").insert({
      action: "generate_change_request",
      entity_type: "weekly_change_requests",
      entity_id: changeRequest.id,
      actor_email: user.email,
      metadata: { 
        findings_count: findings.length, 
        changes_proposed: individualChanges.length,
        strategies_analyzed: Object.keys(strategyPerformance).length,
        llm_powered: !!Deno.env.get("OPENAI_API_KEY"),
      },
    });

    console.log("✅ Change request generated:", changeRequest.id, "with", individualChanges.length, "individual changes");

    return new Response(JSON.stringify({ success: true, data: changeRequest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
