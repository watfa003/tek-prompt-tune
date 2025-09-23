import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  MessageSquare, 
  Clock,
  Award,
  Brain,
  Activity,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    providerStats: Record<string, { count: number; avgScore: number }>;
    modelStats: Record<string, { count: number; avgScore: number }>;
    outputTypeStats: Record<string, { count: number; avgScore: number }>;
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

export const AIAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/ai-analytics?userId=${user.id}&timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success';
      case 'declining':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="text-center text-muted-foreground">
          No analytics data available
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>AI Analytics Dashboard</span>
          </h2>
          <p className="text-muted-foreground">
            Track your prompt optimization performance and AI usage patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Prompts</p>
              <p className="text-2xl font-bold">{analytics.overview.totalPrompts}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{analytics.overview.averageScore}%</p>
            </div>
            <Award className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chat Sessions</p>
              <p className="text-2xl font-bold">{analytics.overview.totalChatSessions}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tokens Used</p>
              <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalTokensUsed)}</p>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <Card className="p-4 bg-gradient-accent border-accent/20">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="h-5 w-5 text-accent-foreground" />
            <h3 className="font-semibold text-accent-foreground">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <p key={index} className="text-sm text-accent-foreground/90">
                {insight}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="font-semibold mb-4">Score Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Excellent (80%+)</span>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-success text-success-foreground">
                      {analytics.performance.scoreDistribution.excellent}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Good (60-79%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-warning text-warning-foreground">
                      {analytics.performance.scoreDistribution.good}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average (40-59%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {analytics.performance.scoreDistribution.average}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Poor (&lt;40%)</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">
                      {analytics.performance.scoreDistribution.poor}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Improvement Trend */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="font-semibold mb-4">Performance Trend</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Trend</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analytics.performance.improvementTrend)}
                    <span className={`text-sm capitalize ${getTrendColor(analytics.performance.improvementTrend)}`}>
                      {analytics.performance.improvementTrend}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-semibold">{analytics.overview.successRate}%</span>
                  </div>
                  <Progress value={analytics.overview.successRate} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Providers */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="font-semibold mb-4">AI Providers</h3>
              <div className="space-y-3">
                {Object.entries(analytics.usage.providerStats).map(([provider, stats]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{provider}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stats.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(stats.avgScore * 100)}% avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Models */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="font-semibold mb-4">Models</h3>
              <div className="space-y-3">
                {Object.entries(analytics.usage.modelStats).map(([model, stats]) => (
                  <div key={model} className="flex items-center justify-between">
                    <span className="text-sm">{model}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stats.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(stats.avgScore * 100)}% avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Output Types */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
              <h3 className="font-semibold mb-4">Output Types</h3>
              <div className="space-y-3">
                {Object.entries(analytics.usage.outputTypeStats).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stats.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(stats.avgScore * 100)}% avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Token Analytics */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
            <h3 className="font-semibold mb-4">Token Usage Analytics</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(analytics.usage.tokenAnalytics.total)}</div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.usage.tokenAnalytics.average}</div>
                <div className="text-sm text-muted-foreground">Avg per Optimization</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${getTrendColor(analytics.usage.tokenAnalytics.trend)}`}>
                  {getTrendIcon(analytics.usage.tokenAnalytics.trend)}
                  <span className="capitalize">{analytics.usage.tokenAnalytics.trend}</span>
                </div>
                <div className="text-sm text-muted-foreground">Usage Trend</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
            <h3 className="font-semibold mb-4">Daily Performance Trends</h3>
            <div className="space-y-4">
              {analytics.performance.dailyStats.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">{new Date(day.date).toLocaleDateString()}</div>
                    <Badge variant="outline">{day.prompts} prompts</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      {Math.round(day.avgScore * 100)}% avg score
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(day.avgGenerationTime)}ms avg time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/40">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <Target className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Prompt Optimization</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.provider} • {activity.model} • {new Date(activity.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                      {activity.score && (
                        <div className="text-sm font-semibold">
                          {Math.round(activity.score * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};