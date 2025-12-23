import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  TrendingUp, 
  FileText, 
  Zap, 
  Users,
  Brain,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface DataMetrics {
  totalPrompts: number;
  totalOptimizations: number;
  totalAnalysis: number;
  totalTemplates: number;
  totalPatterns: number;
  totalResearchResults: number;
  providerDistribution: { name: string; value: number }[];
  modelDistribution: { name: string; value: number }[];
  dailyActivity: { date: string; prompts: number; optimizations: number }[];
  strategyUsage: { strategy: string; count: number; avgScore: number }[];
  outputTypeDistribution: { name: string; value: number }[];
}

const COLORS = ['#6ee7ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

const AdminDataCollection: React.FC = () => {
  const [metrics, setMetrics] = useState<DataMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      // Fetch counts from various tables
      const [
        promptsResult,
        optimizationsResult,
        analysisResult,
        templatesResult,
        patternsResult,
        researchResult,
        providerResult,
        modelResult,
        dailyResult,
        strategyResult,
        outputTypeResult
      ] = await Promise.all([
        supabase.from('prompts').select('id', { count: 'exact', head: true }),
        supabase.from('optimization_history').select('id', { count: 'exact', head: true }),
        supabase.from('prompt_analysis').select('id', { count: 'exact', head: true }),
        supabase.from('prompt_templates').select('id', { count: 'exact', head: true }),
        supabase.from('extracted_patterns').select('id', { count: 'exact', head: true }),
        supabase.from('research_results').select('id', { count: 'exact', head: true }),
        supabase.from('prompts').select('ai_provider'),
        supabase.from('prompts').select('model_name'),
        supabase.from('prompts').select('created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('prompt_analysis').select('strategy, score'),
        supabase.from('prompts').select('output_type')
      ]);

      // Process provider distribution
      const providerCounts: Record<string, number> = {};
      providerResult.data?.forEach((p: any) => {
        const provider = p.ai_provider || 'Unknown';
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      });
      const providerDistribution = Object.entries(providerCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Process model distribution
      const modelCounts: Record<string, number> = {};
      modelResult.data?.forEach((m: any) => {
        const model = m.model_name || 'Unknown';
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      });
      const modelDistribution = Object.entries(modelCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Process daily activity (last 14 days)
      const dailyData: Record<string, { prompts: number; optimizations: number }> = {};
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { prompts: 0, optimizations: 0 };
      }
      
      dailyResult.data?.forEach((p: any) => {
        const dateStr = new Date(p.created_at).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].prompts++;
        }
      });

      const dailyActivity = Object.entries(dailyData).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data
      }));

      // Process strategy usage
      const strategyCounts: Record<string, { count: number; totalScore: number }> = {};
      strategyResult.data?.forEach((s: any) => {
        const strategy = s.strategy || 'Unknown';
        if (!strategyCounts[strategy]) {
          strategyCounts[strategy] = { count: 0, totalScore: 0 };
        }
        strategyCounts[strategy].count++;
        strategyCounts[strategy].totalScore += s.score || 0;
      });
      const strategyUsage = Object.entries(strategyCounts)
        .map(([strategy, data]) => ({
          strategy,
          count: data.count,
          avgScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 10) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Process output type distribution
      const outputCounts: Record<string, number> = {};
      outputTypeResult.data?.forEach((o: any) => {
        const outputType = o.output_type || 'general';
        outputCounts[outputType] = (outputCounts[outputType] || 0) + 1;
      });
      const outputTypeDistribution = Object.entries(outputCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setMetrics({
        totalPrompts: promptsResult.count || 0,
        totalOptimizations: optimizationsResult.count || 0,
        totalAnalysis: analysisResult.count || 0,
        totalTemplates: templatesResult.count || 0,
        totalPatterns: patternsResult.count || 0,
        totalResearchResults: researchResult.count || 0,
        providerDistribution,
        modelDistribution,
        dailyActivity,
        strategyUsage,
        outputTypeDistribution
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Collection</h1>
          <p className="text-muted-foreground mt-1">Monitor all system data collection across PrompTek</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalPrompts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Prompts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalOptimizations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Optimizations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalAnalysis.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Database className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalTemplates.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Brain className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalPatterns.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Activity className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalResearchResults.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Research Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="providers">Providers & Models</TabsTrigger>
          <TabsTrigger value="strategies">Strategy Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Activity (Last 14 Days)
              </CardTitle>
              <CardDescription>Prompt submissions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.dailyActivity || []}>
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
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="prompts" 
                      stroke="#6ee7ff" 
                      strokeWidth={2}
                      dot={{ fill: '#6ee7ff', strokeWidth: 2 }}
                      name="Prompts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Provider Distribution
                </CardTitle>
                <CardDescription>Usage by AI provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={metrics?.providerDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {metrics?.providerDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Model Usage
                </CardTitle>
                <CardDescription>Most used models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.modelDistribution || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Type Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Output Type Distribution</CardTitle>
              <CardDescription>How users are categorizing their prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics?.outputTypeDistribution.map((item, index) => (
                  <Badge 
                    key={item.name} 
                    variant="outline" 
                    className="px-3 py-1"
                    style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                  >
                    {item.name}: {item.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Strategy Performance
              </CardTitle>
              <CardDescription>Optimization strategies usage and average scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.strategyUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="strategy" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                    />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#6ee7ff" name="Usage Count" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avgScore" fill="#22c55e" name="Avg Score %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Strategy List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Strategy Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.strategyUsage.map((strategy, index) => (
                  <div 
                    key={strategy.strategy} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{strategy.strategy}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{strategy.count} uses</Badge>
                      <Badge 
                        className={
                          strategy.avgScore >= 80 ? 'bg-green-500/20 text-green-500' :
                          strategy.avgScore >= 60 ? 'bg-amber-500/20 text-amber-500' :
                          'bg-red-500/20 text-red-500'
                        }
                      >
                        {strategy.avgScore}% avg
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDataCollection;
