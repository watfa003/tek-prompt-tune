import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const timeframe = url.searchParams.get('timeframe') || '7d';

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range
    const now = new Date();
    const daysAgo = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get prompt analytics
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        score,
        ai_provider,
        model_name,
        output_type,
        variants_generated,
        performance_metrics,
        created_at,
        status
      `)
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
      throw new Error('Failed to fetch prompt data');
    }

    // Get optimization history
    const { data: optimizations, error: optimizationsError } = await supabase
      .from('optimization_history')
      .select(`
        score,
        metrics,
        generation_time_ms,
        tokens_used,
        created_at
      `)
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (optimizationsError) {
      console.error('Error fetching optimizations:', optimizationsError);
      throw new Error('Failed to fetch optimization history');
    }

    // Get chat sessions analytics
    const { data: chatSessions, error: chatError } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        created_at,
        chat_messages(count)
      `)
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (chatError) {
      console.error('Error fetching chat sessions:', chatError);
      throw new Error('Failed to fetch chat data');
    }

    // Calculate analytics
    const analytics = calculateAnalytics(prompts || [], optimizations || [], chatSessions || []);

    return new Response(
      JSON.stringify(analytics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateAnalytics(prompts: any[], optimizations: any[], chatSessions: any[]) {
  const now = new Date();
  
  // Basic metrics
  const totalPrompts = prompts.length;
  const completedPrompts = prompts.filter(p => p.status === 'completed').length;
  const averageScore = prompts.reduce((sum, p) => sum + (p.score || 0), 0) / Math.max(totalPrompts, 1);
  const totalOptimizations = optimizations.length;

  // Provider analytics
  const providerStats = prompts.reduce((stats, prompt) => {
    const provider = prompt.ai_provider;
    if (!stats[provider]) {
      stats[provider] = { count: 0, avgScore: 0, totalScore: 0 };
    }
    stats[provider].count++;
    stats[provider].totalScore += prompt.score || 0;
    stats[provider].avgScore = stats[provider].totalScore / stats[provider].count;
    return stats;
  }, {});

  // Model performance
  const modelStats = prompts.reduce((stats, prompt) => {
    const model = prompt.model_name;
    if (!stats[model]) {
      stats[model] = { count: 0, avgScore: 0, totalScore: 0 };
    }
    stats[model].count++;
    stats[model].totalScore += prompt.score || 0;
    stats[model].avgScore = stats[model].totalScore / stats[model].count;
    return stats;
  }, {});

  // Output type analytics
  const outputTypeStats = prompts.reduce((stats, prompt) => {
    const type = prompt.output_type || 'unknown';
    if (!stats[type]) {
      stats[type] = { count: 0, avgScore: 0, totalScore: 0 };
    }
    stats[type].count++;
    stats[type].totalScore += prompt.score || 0;
    stats[type].avgScore = stats[type].totalScore / stats[type].count;
    return stats;
  }, {});

  // Performance trends (last 7 days)
  const dailyStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const dayPrompts = prompts.filter(p => {
      const pDate = new Date(p.created_at);
      return pDate >= startOfDay && pDate < endOfDay;
    });

    const dayOptimizations = optimizations.filter(o => {
      const oDate = new Date(o.created_at);
      return oDate >= startOfDay && oDate < endOfDay;
    });

    dailyStats.push({
      date: startOfDay.toISOString().split('T')[0],
      prompts: dayPrompts.length,
      optimizations: dayOptimizations.length,
      avgScore: dayPrompts.length > 0 
        ? dayPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / dayPrompts.length 
        : 0,
      avgGenerationTime: dayOptimizations.length > 0
        ? dayOptimizations.reduce((sum, o) => sum + (o.generation_time_ms || 0), 0) / dayOptimizations.length
        : 0
    });
  }

  // Token usage analytics
  const totalTokens = optimizations.reduce((sum, o) => sum + (o.tokens_used || 0), 0);
  const avgTokensPerOptimization = totalOptimizations > 0 ? totalTokens / totalOptimizations : 0;

  // Chat analytics
  const totalChatSessions = chatSessions.length;
  const avgMessagesPerSession = chatSessions.length > 0 
    ? chatSessions.reduce((sum, s) => sum + (s.chat_messages?.[0]?.count || 0), 0) / chatSessions.length
    : 0;

  // Score distribution
  const scoreRanges = {
    excellent: prompts.filter(p => (p.score || 0) >= 0.8).length,
    good: prompts.filter(p => (p.score || 0) >= 0.6 && (p.score || 0) < 0.8).length,
    average: prompts.filter(p => (p.score || 0) >= 0.4 && (p.score || 0) < 0.6).length,
    poor: prompts.filter(p => (p.score || 0) < 0.4).length
  };

  // Recent activity
  const recentActivity = prompts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      type: 'prompt_optimization',
      score: p.score,
      provider: p.ai_provider,
      model: p.model_name,
      createdAt: p.created_at,
      status: p.status
    }));

  return {
    overview: {
      totalPrompts,
      completedPrompts,
      averageScore: Math.round(averageScore * 100) / 100,
      totalOptimizations,
      totalChatSessions,
      totalTokensUsed: totalTokens,
      successRate: totalPrompts > 0 ? Math.round((completedPrompts / totalPrompts) * 100) : 0
    },
    performance: {
      scoreDistribution: scoreRanges,
      averageScore: Math.round(averageScore * 100) / 100,
      improvementTrend: calculateImprovementTrend(dailyStats),
      dailyStats
    },
    usage: {
      providerStats,
      modelStats,
      outputTypeStats,
      tokenAnalytics: {
        total: totalTokens,
        average: Math.round(avgTokensPerOptimization),
        trend: calculateTokenTrend(optimizations)
      }
    },
    engagement: {
      chatSessions: totalChatSessions,
      avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
      activePrompts: prompts.filter(p => p.status === 'processing').length
    },
    recentActivity,
    insights: generateInsights(prompts, optimizations, providerStats, modelStats)
  };
}

function calculateImprovementTrend(dailyStats: any[]): string {
  if (dailyStats.length < 2) return 'stable';
  
  const recentAvg = dailyStats.slice(-3).reduce((sum, day) => sum + day.avgScore, 0) / 3;
  const earlierAvg = dailyStats.slice(0, 3).reduce((sum, day) => sum + day.avgScore, 0) / 3;
  
  if (recentAvg > earlierAvg + 0.05) return 'improving';
  if (recentAvg < earlierAvg - 0.05) return 'declining';
  return 'stable';
}

function calculateTokenTrend(optimizations: any[]): string {
  if (optimizations.length < 5) return 'stable';
  
  const recent = optimizations.slice(-5);
  const earlier = optimizations.slice(0, 5);
  
  const recentAvg = recent.reduce((sum, o) => sum + (o.tokens_used || 0), 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, o) => sum + (o.tokens_used || 0), 0) / earlier.length;
  
  if (recentAvg > earlierAvg * 1.1) return 'increasing';
  if (recentAvg < earlierAvg * 0.9) return 'decreasing';
  return 'stable';
}

function generateInsights(prompts: any[], optimizations: any[], providerStats: any, modelStats: any): string[] {
  const insights = [];
  
  // Performance insights
  const avgScore = prompts.reduce((sum, p) => sum + (p.score || 0), 0) / Math.max(prompts.length, 1);
  if (avgScore > 0.8) {
    insights.push("🎯 Excellent prompt performance! Your optimization strategies are highly effective.");
  } else if (avgScore < 0.5) {
    insights.push("💡 Consider focusing on prompt clarity and specificity to improve scores.");
  }

  // Provider insights
  const bestProvider = Object.entries(providerStats).reduce((best, [provider, stats]: [string, any]) => 
    stats.avgScore > (best.score || 0) ? { provider, score: stats.avgScore } : best
  , { provider: '', score: 0 });
  
  if (bestProvider.provider) {
    insights.push(`🏆 ${bestProvider.provider} shows the best performance with ${Math.round(bestProvider.score * 100)}% average score.`);
  }

  // Usage patterns
  if (prompts.length > 10) {
    const recentPrompts = prompts.slice(-5);
    const oldPrompts = prompts.slice(0, 5);
    const recentAvg = recentPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / recentPrompts.length;
    const oldAvg = oldPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / oldPrompts.length;
    
    if (recentAvg > oldAvg + 0.1) {
      insights.push("📈 Your prompt optimization skills are improving over time!");
    }
  }

  // Token efficiency
  const avgTokens = optimizations.reduce((sum, o) => sum + (o.tokens_used || 0), 0) / Math.max(optimizations.length, 1);
  if (avgTokens < 500) {
    insights.push("⚡ Great token efficiency! You're optimizing prompts without excessive API usage.");
  }

  return insights;
}