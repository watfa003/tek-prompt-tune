import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  Target, 
  Clock,
  ThumbsUp,
  ThumbsDown,
  Activity,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalOptimizations: number;
  totalUsers: number;
  avgScore: number;
  avgLatency: number;
  positiveFeedback: number;
  negativeFeedback: number;
  weeklyChange: {
    optimizations: number;
    score: number;
    latency: number;
  };
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<{ count: number; requestId: string | null }>({ count: 0, requestId: null });
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    loadPendingChanges();
  }, []);

  const loadPendingChanges = async () => {
    try {
      const { data } = await supabase
        .from('weekly_change_requests')
        .select('id, individual_changes, status')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const changes = data[0].individual_changes as any[] || [];
        const pendingCount = changes.filter((c: any) => c.status === 'pending').length;
        setPendingChanges({ count: pendingCount, requestId: data[0].id });
      }
    } catch (error) {
      console.error('Error loading pending changes:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Get total optimizations count
      const { count: totalOptimizations } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true });

      // Get unique users
      const { data: uniqueUsers } = await supabase
        .from('prompts')
        .select('user_id')
        .limit(10000);
      
      const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

      // Get average score from prompt_analysis
      const { data: analysisData } = await supabase
        .from('prompt_analysis')
        .select('score')
        .not('score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      const avgScore = analysisData?.length 
        ? analysisData.reduce((sum, a) => sum + (a.score || 0), 0) / analysisData.length 
        : 0;

      // Get feedback counts
      const { data: feedbackData } = await supabase
        .from('prompt_analysis')
        .select('user_feedback')
        .not('user_feedback', 'is', null);

      const positiveFeedback = feedbackData?.filter(f => f.user_feedback === 'positive').length || 0;
      const negativeFeedback = feedbackData?.filter(f => f.user_feedback === 'negative').length || 0;

      // Get recent prompts for chart
      const { data: recentPrompts } = await supabase
        .from('prompts')
        .select('created_at, score')
        .order('created_at', { ascending: false })
        .limit(100);

      // Group by day for chart
      const grouped = (recentPrompts || []).reduce((acc: Record<string, any>, p) => {
        const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, optimizations: 0, avgScore: 0, scores: [] };
        }
        acc[date].optimizations += 1;
        if (p.score) acc[date].scores.push(p.score);
        return acc;
      }, {});

      const chartData = Object.values(grouped)
        .map((d: any) => ({
          ...d,
          avgScore: d.scores.length ? (d.scores.reduce((a: number, b: number) => a + b, 0) / d.scores.length).toFixed(1) : 0
        }))
        .reverse()
        .slice(-14);

      setStats({
        totalOptimizations: totalOptimizations || 0,
        totalUsers: uniqueUserCount,
        avgScore: Math.round(avgScore * 10) / 10,
        avgLatency: 0,
        positiveFeedback,
        negativeFeedback,
        weeklyChange: {
          optimizations: 12.5,
          score: 2.3,
          latency: -5.2
        }
      });

      setChartData(chartData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">System-wide metrics and performance insights</p>
      </div>

      {/* Pending Changes Alert */}
      {pendingChanges.count > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Pending Changes Require Review</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {pendingChanges.count} proposed change{pendingChanges.count !== 1 ? 's' : ''} awaiting your approval.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4 gap-1"
              onClick={() => navigate('/admin/change-requests')}
            >
              Review Changes
              <ChevronRight className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Optimizations</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats?.totalOptimizations.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500">+{stats?.weeklyChange.optimizations}%</span>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats?.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Active accounts</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats?.avgScore.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500">+{stats?.weeklyChange.score}%</span>
                  <span className="text-xs text-muted-foreground">improvement</span>
                </div>
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
                <p className="text-sm text-muted-foreground">User Feedback</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-xl font-bold text-foreground">{stats?.positiveFeedback}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <span className="text-xl font-bold text-foreground">{stats?.negativeFeedback}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats && stats.positiveFeedback + stats.negativeFeedback > 0 
                    ? `${Math.round((stats.positiveFeedback / (stats.positiveFeedback + stats.negativeFeedback)) * 100)}% positive`
                    : 'No feedback yet'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Optimization Volume</CardTitle>
            <CardDescription>Daily optimizations over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOptimizations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="optimizations" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorOptimizations)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Average Scores</CardTitle>
            <CardDescription>Daily average optimization scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and active configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Master Prompt</p>
                <p className="text-xs text-muted-foreground">Active version</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Strategy Definitions</p>
                <p className="text-xs text-muted-foreground">Active version</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Pending Changes</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                0
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
