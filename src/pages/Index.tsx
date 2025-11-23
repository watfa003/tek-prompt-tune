import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  History, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Rocket
} from "lucide-react";
import { usePromptData } from "@/context/PromptDataContext";
import { motion } from "framer-motion";
import { useMemo } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { historyItems, analytics } = usePromptData();

  // Group by prompt and show only the best variant for each unique prompt
  const recentItems = useMemo(() => {
    const promptGroups = new Map<string, typeof historyItems>();
    
    historyItems.forEach(item => {
      const key = item.groupId || item.id;
      if (!promptGroups.has(key)) {
        promptGroups.set(key, []);
      }
      promptGroups.get(key)!.push(item);
    });
    
    // Get best variant from each group, sort by latest timestamp
    return Array.from(promptGroups.values())
      .map(group => group.reduce((best, curr) => 
        (curr.score || 0) > (best.score || 0) ? curr : best
      ))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [historyItems]);

  const quickActions = [
    {
      title: "Create New Prompt",
      description: "Start optimizing with AI",
      icon: Zap,
      gradient: "from-primary to-accent",
      action: () => navigate("/app/ai-agent"),
    },
    {
      title: "Optimize Existing",
      description: "Improve your prompts",
      icon: Target,
      gradient: "from-accent to-[hsl(330,100%,69%)]",
      action: () => navigate("/app/ai-agent"),
    },
    {
      title: "View Analytics",
      description: "Track performance",
      icon: BarChart3,
      gradient: "from-[hsl(330,100%,69%)] to-primary",
      action: () => navigate("/app/history"),
    },
    {
      title: "Explore Templates",
      description: "Browse community",
      icon: FileText,
      gradient: "from-primary via-accent to-primary",
      action: () => navigate("/app/templates"),
    },
  ];

  const stats = [
    {
      label: "Total Optimizations",
      value: historyItems.length || "0",
      change: "+12%",
      icon: Rocket,
    },
    {
      label: "Avg Success Rate",
      value: analytics.averageScore ? `${(analytics.averageScore * 100).toFixed(0)}%` : "—",
      change: "+8%",
      icon: TrendingUp,
    },
    {
      label: "Templates Used",
      value: historyItems.filter(item => item.outputType).length || "0",
      change: "+5%",
      icon: FileText,
    },
    {
      label: "Recent Activity",
      value: historyItems.slice(0, 7).length || "0",
      change: "This week",
      icon: History,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Block */}
      <div 
        className="relative overflow-hidden rounded-[24px] glass-card p-6 md:p-8 neon-glow"
      >
        <div className="absolute inset-0 gradient-bg-animated opacity-30 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
            <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-xs md:text-sm">
              Welcome Back
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 gradient-text leading-tight">
            Command Center
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            Your AI prompt optimization workspace. Create, test, and refine prompts with intelligent assistance.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action, index) => (
            <div
              key={action.title}
            >
              <Card 
                className="glass-card interactive-card cursor-pointer group p-4 md:p-6 hover:neon-border"
                onClick={action.action}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">{action.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">{action.description}</p>
                <div className="flex items-center text-primary text-xs md:text-sm font-medium group-hover:gap-2 transition-all">
                  Get Started
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
            >
              <Card className="glass-card p-4 md:p-6 hover:neon-border transition-all">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center`}>
                    <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30 whitespace-nowrap">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1 gradient-text">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Recent Activity
          </h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/app/history")}
            className="group text-sm"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        {historyItems.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No optimizations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first prompt optimization to see results here
                </p>
                <Button 
                  onClick={() => navigate("/app/ai-agent")}
                  className="btn-sheen bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create First Prompt
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item, index) => (
              <div
                key={item.id}
              >
                <Card 
                  className="glass-card p-3 md:p-4 hover:neon-border transition-all cursor-pointer group"
                  onClick={() => navigate("/app/history")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base truncate">
                          {item.title || item.description || 'Untitled'}
                        </h3>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{item.provider}</Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 ml-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold gradient-text">
                          {(item.score * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Score</div>
                      </div>
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
