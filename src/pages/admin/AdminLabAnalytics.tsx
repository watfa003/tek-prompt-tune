import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, RefreshCw, Target, Clock, TrendingUp, TrendingDown, Beaker } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

interface LabStats {
  totalTests: number;
  totalBattles: number;
  avgScoreA: number;
  avgScoreB: number;
  winRateA: number;
  winRateB: number;
  avgLatency: number;
  modelDistribution: { name: string; value: number }[];
  recentTrends: { date: string; tests: number; avgScore: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AdminLabAnalytics: React.FC = () => {
  const [stats, setStats] = useState<LabStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLabStats();
  }, []);

  const loadLabStats = async () => {
    try {
      // Get all lab results
      const { data: labResults, error } = await supabase
        .from('prompt_lab_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const results = labResults || [];
      
      // Calculate stats
      const battles = results.filter(r => r.mode === 'battle');
      const tests = results.filter(r => r.mode === 'test');
      
      const avgScoreA = results.reduce((sum, r) => sum + (r.total_score_a || 0), 0) / (results.length || 1);
      const avgScoreB = battles.reduce((sum, r) => sum + (r.total_score_b || 0), 0) / (battles.length || 1);
      
      const winsA = battles.filter(r => r.winner === 'A').length;
      const winsB = battles.filter(r => r.winner === 'B').length;
      const totalBattlesWithWinner = winsA + winsB;
      
      const avgLatency = results.reduce((sum, r) => sum + (r.response_latency_ms || 0), 0) / (results.length || 1);

      // Model distribution
      const modelCounts: Record<string, number> = {};
      results.forEach(r => {
        modelCounts[r.target_llm] = (modelCounts[r.target_llm] || 0) + 1;
      });
      const modelDistribution = Object.entries(modelCounts).map(([name, value]) => ({ name, value }));

      // Recent trends (last 14 days)
      const last14Days: Record<string, { tests: number; scores: number[] }> = {};
      results.forEach(r => {
        const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!last14Days[date]) {
          last14Days[date] = { tests: 0, scores: [] };
        }
        last14Days[date].tests += 1;
        if (r.total_score_a) last14Days[date].scores.push(r.total_score_a);
      });
      
      const recentTrends = Object.entries(last14Days)
        .map(([date, data]) => ({
          date,
          tests: data.tests,
          avgScore: data.scores.length ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
        }))
        .slice(-14);

      setStats({
        totalTests: tests.length,
        totalBattles: battles.length,
        avgScoreA: Math.round(avgScoreA * 10) / 10,
        avgScoreB: Math.round(avgScoreB * 10) / 10,
        winRateA: totalBattlesWithWinner ? Math.round((winsA / totalBattlesWithWinner) * 100) : 50,
        winRateB: totalBattlesWithWinner ? Math.round((winsB / totalBattlesWithWinner) * 100) : 50,
        avgLatency: Math.round(avgLatency),
        modelDistribution,
        recentTrends
      });
    } catch (error) {
      console.error('Error loading lab stats:', error);
      toast.error('Failed to load lab analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLabStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lab Analytics</h1>
          <p className="text-muted-foreground mt-1">Prompt Lab testing metrics and insights</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalTests || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Beaker className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Battles</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalBattles || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats?.avgScoreA || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats?.avgLatency || 0}ms</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battle Win Rates */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Battle Win Rates</CardTitle>
          <CardDescription>Prompt A vs Prompt B comparison in battles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Prompt A</span>
                <span className="text-sm text-muted-foreground">{stats?.winRateA}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${stats?.winRateA}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Prompt B</span>
                <span className="text-sm text-muted-foreground">{stats?.winRateB}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${stats?.winRateB}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
            <CardDescription>Tests by target LLM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.modelDistribution && stats.modelDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.modelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.modelDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
            {stats?.modelDistribution && stats.modelDistribution.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {stats.modelDistribution.map((item, index) => (
                  <Badge key={item.name} variant="outline" className="gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {item.name}: {item.value}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Testing Trends</CardTitle>
            <CardDescription>Daily test volume and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.recentTrends && stats.recentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.recentTrends}>
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
                    <Line type="monotone" dataKey="tests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLabAnalytics;
