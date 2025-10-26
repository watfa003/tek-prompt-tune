import React from "react";
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
import { usePromptData } from "@/context/PromptDataContext";
import { useSettings } from "@/hooks/use-settings";

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
  const { analytics, loading } = usePromptData();
  const { settings } = useSettings();
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");
  const [compactMode, setCompactMode] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getBestProvider = () => {
    if (!analytics?.usage?.providerStats) return "No data";
    const providers = Object.entries(analytics.usage.providerStats);
    if (providers.length === 0) return "No data";
    
    const best = providers.reduce((best, [name, stats]: [string, any]) => 
      stats.avgScore > best.score ? { name, score: stats.avgScore } : best
    , { name: '', score: 0 });
    
    return best.name || "No data";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return { icon: "✨", label: "Excellent" };
    if (score >= 0.6) return { icon: "⚙️", label: "Good" };
    return { icon: "📝", label: "Average" };
  };

  const formatTimeSpent = () => {
    if (!analytics?.overview?.totalOptimizations) return "0m";
    const minutes = analytics.overview.totalOptimizations * 2;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Welcome! Start optimizing prompts to see your personalized dashboard.</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Prompts Generated",
      value: analytics?.overview?.totalPrompts || "0",
      change: "+12%",
      icon: Zap,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Avg Score",
      value: analytics?.overview?.averageScore ? `${(analytics.overview.averageScore * 100).toFixed(0)}%` : "—",
      change: "+8%",
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Best Provider",
      value: getBestProvider(),
      change: formatTimeSpent(),
      icon: BarChart3,
      color: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <div className={`min-h-screen safe-page ${compactMode ? 'compact-mode' : ''}`}>
      {/* Animated Particle Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '15s' }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        {/* Hero Metrics Row - Glassboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative"
            >
              <Card className="relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-[24px] p-6 md:p-8 hover:border-primary/30 transition-all duration-500">
                {/* Sweep Highlight Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600" />
                
                {/* Icon with Gradient */}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                
                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 font-heading">
                  {stat.value}
                </div>
                
                {/* Label & Change */}
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                    {stat.change}
                  </Badge>
                </div>
                
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[24px]`} />
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold gradient-text font-heading">{analytics?.overview?.successRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <Progress value={analytics?.overview?.successRate || 0} className="mt-4" />
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Optimizations</p>
                <p className="text-3xl font-bold gradient-text font-heading">{analytics?.overview?.totalOptimizations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chat Sessions</p>
                <p className="text-3xl font-bold gradient-text font-heading">{analytics?.engagement?.chatSessions || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Score Distribution */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-2xl font-bold mb-6 flex items-center font-heading">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            Score Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20">
              <div className="text-3xl font-bold gradient-text font-heading">{analytics?.performance?.scoreDistribution?.excellent || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">✨ Excellent</div>
              <div className="text-xs text-muted-foreground/60">(0.8+)</div>
            </div>
            <div className="text-center p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/20">
              <div className="text-3xl font-bold gradient-text font-heading">{analytics?.performance?.scoreDistribution?.good || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">⚙️ Good</div>
              <div className="text-xs text-muted-foreground/60">(0.6-0.8)</div>
            </div>
            <div className="text-center p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20">
              <div className="text-3xl font-bold gradient-text font-heading">{analytics?.performance?.scoreDistribution?.average || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">📝 Average</div>
              <div className="text-xs text-muted-foreground/60">(0.4-0.6)</div>
            </div>
            <div className="text-center p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/20">
              <div className="text-3xl font-bold gradient-text font-heading">{analytics?.performance?.scoreDistribution?.poor || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">⚠️ Poor</div>
              <div className="text-xs text-muted-foreground/60">(0-0.4)</div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center font-heading">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Recent Activity
            </h3>
            <Button variant="ghost" size="sm" className="hover:bg-white/5">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto content-scroll">
              {analytics.recentActivity.slice(0, 5).map((activity) => {
                const scoreData = getScoreIcon(activity.score);
                return (
                  <div key={activity.id} className="p-4 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Score Icon */}
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {scoreData.icon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm font-heading">
                              Prompt Optimization
                            </h4>
                            <Badge variant="outline" className="text-xs border-white/20">
                              {activity.provider}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-white/20">
                              {activity.model}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs mt-2">
                            {scoreData.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Score Display */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-2xl font-bold gradient-text font-heading">
                            {(activity.score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <Button variant="ghost" size="sm" className="hover:bg-white/5">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2 font-heading">No activity yet</h4>
              <p className="text-muted-foreground">Start optimizing prompts to see your activity here!</p>
            </div>
          )}
        </Card>

        {/* Insights */}
        {analytics?.insights && analytics.insights.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-6 flex items-center font-heading">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Personalized Insights
            </h3>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="p-4 rounded-xl backdrop-blur-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all">
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};