import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Zap, BarChart3, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePromptCounter } from "@/hooks/use-prompt-counter";

interface AnalyticsData {
  overview: {
    totalPrompts: number;
    completedPrompts: number;
    averageScore: number;
    totalOptimizations: number;
    totalChatSessions: number;
    totalTokensUsed: number;
    successRate: number;
  };
  performance: {
    scoreDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    averageScore: number;
    improvementTrend: string;
    dailyStats: Array<{
      date: string;
      prompts: number;
      optimizations: number;
      avgScore: number;
      avgGenerationTime: number;
    }>;
  };
  usage: {
    providerStats: Record<string, { count: number; avgScore: number; totalScore: number }>;
    modelStats: Record<string, { count: number; avgScore: number; totalScore: number }>;
    outputTypeStats: Record<string, { count: number; avgScore: number; totalScore: number }>;
    tokenAnalytics: {
      total: number;
      average: number;
      trend: string;
    };
  };
  engagement: {
    chatSessions: number;
    avgMessagesPerSession: number;
    activePrompts: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    score: number;
    provider: string;
    model: string;
    createdAt: string;
    status: string;
  }>;
  insights: string[];
}

export const PerformanceDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { total: globalTotal, loading: counterLoading } = usePromptCounter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const url = new URL('https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/ai-analytics');
        url.searchParams.set('userId', user.id);
        url.searchParams.set('timeframe', '7d');

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA',
          },
        });

        if (response.ok) {
          const analyticsData = await response.json();

          // Overlay persistent counters from localStorage so they survive refreshes
          let counters = { totalPrompts: 0, totalOptimizations: 0, sessionCount: 0 } as any;
          try {
            const cached = localStorage.getItem(`prompt_counters_${user.id}`);
            if (cached) counters = JSON.parse(cached);
          } catch (e) {
            console.warn('Failed to parse counters from localStorage', e);
          }

          const merged = {
            ...analyticsData,
            overview: {
              ...analyticsData.overview,
              totalPrompts: Math.max(analyticsData.overview?.totalPrompts || 0, counters.totalPrompts || 0),
              totalOptimizations: Math.max(analyticsData.overview?.totalOptimizations || 0, counters.totalOptimizations || 0),
              totalChatSessions: Math.max(analyticsData.overview?.totalChatSessions || 0, counters.sessionCount || 0),
            },
          };

          setAnalytics(merged);
        }
      } catch (error) {
        console.error('Error in fetchAnalytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-500";
    if (score >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const getBestProvider = () => {
    if (!analytics?.usage.providerStats) return "No data";
    const providers = Object.entries(analytics.usage.providerStats);
    if (providers.length === 0) return "No data";
    
    const best = providers.reduce((best, [name, stats]) => 
      stats.avgScore > best.score ? { name, score: stats.avgScore } : best
    , { name: '', score: 0 });
    
    return best.name || "No data";
  };

  const getImprovementRate = () => {
    if (!analytics?.performance.improvementTrend) return 0;
    return analytics.performance.improvementTrend === 'improving' ? 15 : 
           analytics.performance.improvementTrend === 'declining' ? -5 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No analytics data available. Start optimizing prompts to see your performance!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Prompts</p>
              <p className="text-2xl font-bold">{(globalTotal ?? analytics.overview.totalPrompts)}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.overview.averageScore)}`}>
                {analytics.overview.averageScore.toFixed(1)}/1.0
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Best Provider</p>
              <p className="text-lg font-semibold">{getBestProvider()}</p>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Improvement</p>
              <p className="text-2xl font-bold text-green-500">+{getImprovementRate()}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Provider Performance */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-primary" />
          Provider Performance
        </h3>
        <div className="space-y-4">
          {Object.entries(analytics.usage.providerStats).map(([name, stats]) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{name}</span>
                  <span className="text-sm text-muted-foreground">{stats.count} prompts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={stats.avgScore * 100} className="flex-1" />
                  <span className={`text-sm font-medium ${getScoreColor(stats.avgScore)}`}>
                    {stats.avgScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(analytics.usage.providerStats).length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No provider data yet. Start optimizing prompts to see performance by provider!
            </p>
          )}
        </div>
      </Card>

      {/* Output Type Performance */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Output Type Performance
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(analytics.usage.outputTypeStats).map(([type, stats]) => (
            <div key={type} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{type}</span>
                {getScoreBadge(stats.avgScore)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stats.count} prompts</span>
                <span className={`text-sm font-medium ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore.toFixed(1)} avg
                </span>
              </div>
            </div>
          ))}
          {Object.keys(analytics.usage.outputTypeStats).length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No output type data yet. Start optimizing prompts to see performance by type!
            </p>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {analytics.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Prompt Optimization</span>
                  <Badge variant="outline">{activity.provider}</Badge>
                  <Badge variant="outline">{activity.model}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getScoreBadge(activity.score)}
              </div>
            </div>
          ))}
          {analytics.recentActivity.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No recent activity. Start optimizing prompts to see your history!
            </p>
          )}
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Performance Insights
        </h3>
        <div className="space-y-3">
          {analytics.insights.map((insight, index) => (
            <div key={index} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm">{insight}</p>
            </div>
          ))}
          {analytics.insights.length === 0 && (
            <p className="text-muted-foreground">Keep optimizing to unlock personalized insights!</p>
          )}
        </div>
      </Card>
    </div>
  );
};