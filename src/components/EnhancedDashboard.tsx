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
  Bookmark
} from "lucide-react";

// Enhanced mock data
const todayStats = {
  promptsGenerated: 23,
  avgScore: 2.8,
  bestProvider: "OpenAI GPT-4",
  timeSpent: "2h 14m",
  improvementRate: "+12%"
};

const recentActivity = [
  {
    id: 1,
    action: "Generated prompt",
    task: "Python merge sort function",
    provider: "OpenAI",
    score: 3,
    timestamp: "2 minutes ago"
  },
  {
    id: 2,
    action: "Optimized prompt",
    task: "API documentation template",
    provider: "Claude",
    score: 3,
    timestamp: "15 minutes ago"
  },
  {
    id: 3,
    action: "Saved template",
    task: "JSON schema generator",
    provider: "Gemini",
    score: 2,
    timestamp: "1 hour ago"
  },
  {
    id: 4,
    action: "Generated prompt",
    task: "Database schema design",
    provider: "OpenAI",
    score: 3,
    timestamp: "2 hours ago"
  }
];

const quickActions = [
  {
    title: "Generate New Prompt",
    description: "Start with a fresh prompt optimization",
    icon: Zap,
    action: "generate",
    color: "bg-primary"
  },
  {
    title: "Use Template",
    description: "Start from a proven template",
    icon: Play,
    action: "template",
    color: "bg-success"
  },
  {
    title: "View History",
    description: "Browse your saved prompts",
    icon: Bookmark,
    action: "history",
    color: "bg-warning"
  },
  {
    title: "Analytics",
    description: "Deep dive into performance",
    icon: BarChart3,
    action: "analytics",
    color: "bg-accent"
  }
];

const topPerformingPrompts = [
  {
    id: 1,
    title: "Clean Python Function Generator",
    score: 3,
    provider: "OpenAI",
    usage: 15,
    category: "Code"
  },
  {
    id: 2,
    title: "API Documentation Writer",
    score: 3,
    provider: "Claude",
    usage: 12,
    category: "Documentation"
  },
  {
    id: 3,
    title: "JSON Schema Validator",
    score: 3,
    provider: "Gemini",
    usage: 8,
    category: "Data"
  }
];

interface EnhancedDashboardProps {
  onQuickAction: (action: string) => void;
}

export const EnhancedDashboard = ({ onQuickAction }: EnhancedDashboardProps) => {
  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score === 2) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your prompt optimization overview.
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Prompts Today</p>
              <p className="text-2xl font-bold">{todayStats.promptsGenerated}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold">{todayStats.avgScore}/3</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Best Provider</p>
              <p className="text-sm font-semibold">{todayStats.bestProvider}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-2xl font-bold">{todayStats.timeSpent}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Improvement</p>
              <p className="text-2xl font-bold text-success">{todayStats.improvementRate}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.action}
                variant="outline"
                className="h-20 flex-col space-y-2 hover:shadow-card transition-shadow"
                onClick={() => onQuickAction(action.action)}
              >
                <IconComponent className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.task}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.provider}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {getScoreBadge(activity.score)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Prompts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Performing Prompts</h2>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {topPerformingPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{prompt.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {prompt.provider}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {prompt.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {prompt.usage} uses
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getScoreBadge(prompt.score)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">OpenAI</span>
              <span className="text-sm font-medium">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Claude</span>
              <span className="text-sm font-medium">88%</span>
            </div>
            <Progress value={88} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gemini</span>
              <span className="text-sm font-medium">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>
      </Card>
    </div>
  );
};