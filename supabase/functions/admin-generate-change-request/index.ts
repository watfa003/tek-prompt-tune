import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "watfa003@gmail.com";

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

    // Gather last 7 days of data
    const { data: recentPrompts } = await supabase
      .from("prompts")
      .select("score, ai_provider, model_name, created_at")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    const { data: recentAnalysis } = await supabase
      .from("prompt_analysis")
      .select("score, strategy, user_feedback, feedback_reason")
      .gte("created_at", weekStart.toISOString());

    const { data: recentInsights } = await supabase
      .from("optimization_insights")
      .select("successful_strategies, avg_improvement_score")
      .order("updated_at", { ascending: false })
      .limit(10);

    // Analyze data
    const totalOptimizations = recentPrompts?.length || 0;
    const avgScore = recentPrompts?.length
      ? recentPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / recentPrompts.length
      : 0;

    const feedbackStats = {
      positive: recentAnalysis?.filter(a => a.user_feedback === "positive").length || 0,
      negative: recentAnalysis?.filter(a => a.user_feedback === "negative").length || 0,
      negativeReasons: recentAnalysis
        ?.filter(a => a.user_feedback === "negative" && a.feedback_reason)
        .map(a => a.feedback_reason) || [],
    };

    // Strategy performance
    const strategyPerformance: Record<string, { count: number; totalScore: number; positive: number; negative: number }> = {};
    recentAnalysis?.forEach(a => {
      if (!a.strategy) return;
      if (!strategyPerformance[a.strategy]) {
        strategyPerformance[a.strategy] = { count: 0, totalScore: 0, positive: 0, negative: 0 };
      }
      strategyPerformance[a.strategy].count++;
      strategyPerformance[a.strategy].totalScore += a.score || 0;
      if (a.user_feedback === "positive") strategyPerformance[a.strategy].positive++;
      if (a.user_feedback === "negative") strategyPerformance[a.strategy].negative++;
    });

    // Identify weak strategies
    const weakStrategies = Object.entries(strategyPerformance)
      .filter(([_, data]) => {
        const avgStrategyScore = data.count > 0 ? data.totalScore / data.count : 0;
        const negativeRate = data.count > 0 ? data.negative / data.count : 0;
        return avgStrategyScore < 7.5 || negativeRate > 0.3;
      })
      .map(([name, data]) => ({
        name,
        avgScore: data.count > 0 ? (data.totalScore / data.count).toFixed(2) : 0,
        negativeRate: data.count > 0 ? ((data.negative / data.count) * 100).toFixed(1) + "%" : "0%",
      }));

    // Build findings
    const findings = [];
    if (avgScore < 7.5) {
      findings.push({ type: "score_drop", message: `Average score (${avgScore.toFixed(2)}) is below target (7.5)` });
    }
    if (feedbackStats.negative > feedbackStats.positive) {
      findings.push({ type: "negative_feedback", message: `Negative feedback (${feedbackStats.negative}) exceeds positive (${feedbackStats.positive})` });
    }
    weakStrategies.forEach(s => {
      findings.push({ type: "weak_strategy", message: `Strategy "${s.name}" underperforming: avg ${s.avgScore}, negative rate ${s.negativeRate}` });
    });

    // Generate conservative proposals
    const strategyChanges = weakStrategies.map(s => ({
      strategy: s.name,
      action: "reduce_weight",
      reason: `Underperforming with avg score ${s.avgScore}`,
      proposed_weight_change: -0.1,
    }));

    const confidenceScore = Math.min(0.95, 0.5 + (totalOptimizations / 200) * 0.3 + (findings.length > 0 ? 0.15 : 0));

    // Create change request
    const { data: changeRequest, error: insertError } = await supabase
      .from("weekly_change_requests")
      .insert({
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
        status: "submitted",
        submitted_at: new Date().toISOString(),
        analysis_summary: {
          total_optimizations: totalOptimizations,
          avg_score: avgScore.toFixed(2),
          feedback: feedbackStats,
          strategies_analyzed: Object.keys(strategyPerformance).length,
        },
        findings,
        proposed_changes: {
          strategy_adjustments: strategyChanges,
          master_prompt_patches: [],
        },
        strategy_changes: strategyChanges,
        expected_impact: {
          estimated_score_improvement: strategyChanges.length > 0 ? "+0.2 to +0.5" : "minimal",
          risk_level: "low",
        },
        risk_assessment: {
          level: "low",
          notes: "Conservative patch-based changes only",
        },
        rollback_plan: {
          strategy: "Restore previous strategy weights from optimization_insights",
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
      metadata: { findings_count: findings.length, strategies_flagged: weakStrategies.length },
    });

    console.log("✅ Change request generated:", changeRequest.id);

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
