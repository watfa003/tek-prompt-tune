import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  Target,
  Clock,
  Star,
  BarChart3,
  Activity,
  RefreshCw,
  Play,
  Bookmark,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export const EnhancedDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    
    // Initialize with empty analytics structure
    setAnalytics({
      overview: {
        totalPrompts: 0,
        completedPrompts: 0,
        averageScore: 0,
        totalOptimizations: 0,
        totalChatSessions: 0,
        totalTokensUsed: 0,
        successRate: 0,
      },
      performance: {
        scoreDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
        },
        averageScore: 0,
        improvementTrend: 'stable',
        dailyStats: [],
      },
      usage: {
        providerStats: {},
        modelStats: {},
        outputTypeStats: {},
        tokenAnalytics: {
          total: 0,
          average: 0,
          trend: 'stable',
        },
      },
      engagement: {
        chatSessions: 0,
        avgMessagesPerSession: 0,
        activePrompts: 0,
      },
      recentActivity: [],
      insights: [],
    });

    const setupRealTimeUpdates = () => {
      // Listen for new prompts to update stats
      const promptsChannel = supabase
        .channel('dashboard-prompts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'prompts'
          },
          (payload) => {
            const newPrompt = payload.new as any;
            
            setAnalytics(prev => {
              if (!prev) return prev;
              
              // Update overview stats
              const updatedOverview = {
                ...prev.overview,
                totalPrompts: prev.overview.totalPrompts + 1,
                completedPrompts: newPrompt.status === 'completed' ? prev.overview.completedPrompts + 1 : prev.overview.completedPrompts
              };

              // Add to recent activity
              const newActivity = {
                id: newPrompt.id,
                type: 'prompt_optimization',
                score: newPrompt.score || 0,
                provider: newPrompt.ai_provider,
                model: newPrompt.model_name,
                createdAt: newPrompt.created_at,
                status: newPrompt.status || 'completed'
              };

              const updatedRecentActivity = [newActivity, ...prev.recentActivity].slice(0, 10);

              return {
                ...prev,
                overview: updatedOverview,
                recentActivity: updatedRecentActivity
              };
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'prompts'
          },
          (payload) => {
            const updatedPrompt = payload.new as any;
            
            setAnalytics(prev => {
              if (!prev) return prev;
              
              // Update recent activity with new score/status
              const updatedRecentActivity = prev.recentActivity.map(activity =>
                activity.id === updatedPrompt.id
                  ? { ...activity, score: updatedPrompt.score || activity.score, status: updatedPrompt.status || activity.status }
                  : activity
              );

              return {
                ...prev,
                recentActivity: updatedRecentActivity
              };
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(promptsChannel);
      };
    };

    const cleanup = setupRealTimeUpdates();

    return cleanup;
  }, []);

  const getBestProvider = () => {
    if (!analytics?.usage.providerStats) return "No data";
    const providers = Object.entries(analytics.usage.providerStats);
    if (providers.length === 0) return "No data";
    
    const best = providers.reduce((best, [name, stats]) => 
      stats.avgScore > best.score ? { name, score: stats.avgScore } : best
    , { name: '', score: 0 });
    
    return best.name || "No data";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const formatTimeSpent = () => {
    if (!analytics?.overview.totalOptimizations) return "0m";
    // Estimate 2 minutes per optimization on average
    const minutes = analytics.overview.totalOptimizations * 2;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Welcome! Start optimizing prompts to see your personalized dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Recent Activity Overview
          </h2>
          <Badge variant="outline" className="text-primary">
            Last 7 days
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{analytics.overview.totalPrompts}</div>
            <div className="text-xs text-muted-foreground">Prompts Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{analytics.overview.averageScore.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{getBestProvider()}</div>
            <div className="text-xs text-muted-foreground">Best Provider</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatTimeSpent()}</div>
            <div className="text-xs text-muted-foreground">Time Spent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-success">
              {analytics.performance.improvementTrend === 'improving' ? '+12%' : 
               analytics.performance.improvementTrend === 'declining' ? '-5%' : '0%'}
            </div>
            <div className="text-xs text-muted-foreground">Improvement</div>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{analytics.overview.successRate}%</p>
            </div>
            <Target className="h-8 w-8 text-success" />
          </div>
          <Progress value={analytics.overview.successRate} className="mt-2" />
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Optimizations</p>
              <p className="text-2xl font-bold">{analytics.overview.totalOptimizations}</p>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chat Sessions</p>
              <p className="text-2xl font-bold">{analytics.engagement.chatSessions}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-primary" />
          Score Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-500">{analytics.performance.scoreDistribution.excellent}</div>
            <div className="text-sm text-muted-foreground">Excellent (0.8+)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-yellow-500">{analytics.performance.scoreDistribution.good}</div>
            <div className="text-sm text-muted-foreground">Good (0.6-0.8)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10">
            <div className="text-2xl font-bold text-orange-500">{analytics.performance.scoreDistribution.average}</div>
            <div className="text-sm text-muted-foreground">Average (0.4-0.6)</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-500">{analytics.performance.scoreDistribution.poor}</div>
            <div className="text-sm text-muted-foreground">Poor (0-0.4)</div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Recent Activity
          </h3>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-3">
          {analytics.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-start space-x-3">
                <Bookmark className="h-4 w-4 mt-1 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Prompt Optimization</span>
                    <Badge variant="outline" className="text-xs">{activity.provider}</Badge>
                    <Badge variant="outline" className="text-xs">{activity.model}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getScoreBadge(activity.score)}
                <Button variant="ghost" size="sm">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {analytics.recentActivity.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start optimizing prompts to see your activity here!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Personalized Insights
          </h3>
          <div className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};