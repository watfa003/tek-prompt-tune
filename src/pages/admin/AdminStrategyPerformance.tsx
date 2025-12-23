import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, Layers, Target, Activity, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

interface StrategyStats {
  name: string;
  usageCount: number;
  avgScore: number;
  positiveFeedback: number;
  negativeFeedback: number;
  tier: 'primary' | 'secondary' | 'experimental';
}

interface StrategyEvents {
  date: string;
  usages: number;
  avgScore: number;
}

const tierColors = {
  primary: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  secondary: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  experimental: 'bg-amber-500/10 text-amber-500 border-amber-500/30'
};

const AdminStrategyPerformance: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyStats[]>([]);
  const [events, setEvents] = useState<StrategyEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStrategyData();
  }, []);

  const loadStrategyData = async () => {
    try {
      // Get strategy usage from prompt_analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('prompt_analysis')
        .select('strategy, score, user_feedback, created_at')
        .not('strategy', 'is', null);

      if (analysisError) throw analysisError;

      // Aggregate by strategy
      const strategyMap: Record<string, StrategyStats> = {};
      
      (analysisData || []).forEach(record => {
        const strategy = record.strategy || 'unknown';
        if (!strategyMap[strategy]) {
          strategyMap[strategy] = {
            name: strategy,
            usageCount: 0,
            avgScore: 0,
            positiveFeedback: 0,
            negativeFeedback: 0,
            tier: strategy.includes('adaptive') ? 'primary' : 
                  strategy.includes('chain') ? 'secondary' : 'experimental'
          };
        }
        
        strategyMap[strategy].usageCount += 1;
        if (record.score) {
          strategyMap[strategy].avgScore = 
            (strategyMap[strategy].avgScore * (strategyMap[strategy].usageCount - 1) + record.score) / 
            strategyMap[strategy].usageCount;
        }
        if (record.user_feedback === 'positive') strategyMap[strategy].positiveFeedback += 1;
        if (record.user_feedback === 'negative') strategyMap[strategy].negativeFeedback += 1;
      });

      const strategiesArray = Object.values(strategyMap)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);

      // Get events data for trends
      const eventsByDate: Record<string, { usages: number; scores: number[] }> = {};
      (analysisData || []).forEach(record => {
        const date = new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!eventsByDate[date]) {
          eventsByDate[date] = { usages: 0, scores: [] };
        }
        eventsByDate[date].usages += 1;
        if (record.score) eventsByDate[date].scores.push(record.score);
      });

      const eventsArray = Object.entries(eventsByDate)
        .map(([date, data]) => ({
          date,
          usages: data.usages,
          avgScore: data.scores.length ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10 : 0
        }))
        .slice(-14);

      setStrategies(strategiesArray);
      setEvents(eventsArray);
    } catch (error) {
      console.error('Error loading strategy data:', error);
      toast.error('Failed to load strategy performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStrategyData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const topStrategy = strategies[0];
  const totalUsage = strategies.reduce((sum, s) => sum + s.usageCount, 0);
  const avgOverallScore = strategies.length 
    ? strategies.reduce((sum, s) => sum + s.avgScore, 0) / strategies.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Performance</h1>
          <p className="text-muted-foreground mt-1">Optimization strategy metrics and rankings</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Strategy</p>
                <p className="text-xl font-bold text-foreground mt-1">{topStrategy?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-1">{topStrategy?.usageCount || 0} uses</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Strategy Uses</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalUsage.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Strategy Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">{avgOverallScore.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Rankings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Strategy Rankings
          </CardTitle>
          <CardDescription>Performance metrics by optimization strategy</CardDescription>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No strategy data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy, index) => (
                <div 
                  key={strategy.name} 
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold text-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{strategy.name}</span>
                      <Badge variant="outline" className={tierColors[strategy.tier]}>
                        {strategy.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {strategy.usageCount} uses • Score: {strategy.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">{strategy.positiveFeedback}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">{strategy.negativeFeedback}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>Daily strategy usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {events.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={events}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="usages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStrategyPerformance;
