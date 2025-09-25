import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Zap, BarChart3, Calendar } from "lucide-react";

// Mock data for demonstration
const mockMetrics = {
  totalPrompts: 247,
  avgScore: 2.7,
  bestProvider: "OpenAI GPT-4",
  improvementRate: 23,
  recentTests: [
    { date: "2024-01-15", provider: "OpenAI GPT-4", score: 3, task: "Python function optimization" },
    { date: "2024-01-15", provider: "Claude", score: 2, task: "JSON data generation" },
    { date: "2024-01-14", provider: "Gemini", score: 3, task: "Essay writing" },
    { date: "2024-01-14", provider: "Groq", score: 2, task: "Code documentation" },
    { date: "2024-01-13", provider: "OpenAI GPT-4", score: 3, task: "Data analysis" },
  ],
  providerStats: [
    { name: "OpenAI GPT-4", tests: 89, avgScore: 2.8, success: 78 },
    { name: "Claude", tests: 67, avgScore: 2.6, success: 71 },
    { name: "Gemini", tests: 52, avgScore: 2.5, success: 65 },
    { name: "Groq", tests: 39, avgScore: 2.4, success: 61 },
  ],
  categoryPerformance: [
    { category: "Code", score: 2.9, tests: 98 },
    { category: "JSON", score: 2.7, tests: 76 },
    { category: "Essays", score: 2.6, tests: 45 },
    { category: "Analysis", score: 2.8, tests: 28 },
  ]
};

export const PerformanceDashboard = () => {
  const getScoreColor = (score: number) => {
    if (score >= 2.8) return "text-success";
    if (score >= 2.4) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score === 2) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Prompts</p>
              <p className="text-2xl font-bold">{mockMetrics.totalPrompts}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(mockMetrics.avgScore)}`}>
                {mockMetrics.avgScore.toFixed(1)}/3.0
              </p>
            </div>
            <Target className="h-8 w-8 text-accent" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Best Provider</p>
              <p className="text-lg font-semibold">{mockMetrics.bestProvider}</p>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Improvement</p>
              <p className="text-2xl font-bold text-success">+{mockMetrics.improvementRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Provider Performance */}
        <Card className="p-6 shadow-card">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Provider Performance
          </h3>
          <div className="space-y-4">
            {mockMetrics.providerStats.map((provider) => (
              <div key={provider.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{provider.name}</span>
                  <span className={`font-semibold ${getScoreColor(provider.avgScore)}`}>
                    {provider.avgScore.toFixed(1)}/3.0
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={provider.success} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{provider.success}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {provider.tests} tests completed
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Performance */}
        <Card className="p-6 shadow-card">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-accent" />
            Category Performance
          </h3>
          <div className="space-y-4">
            {mockMetrics.categoryPerformance.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.category}</span>
                  <span className={`font-semibold ${getScoreColor(category.score)}`}>
                    {category.score.toFixed(1)}/3.0
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(category.score / 3) * 100} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{category.tests} tests</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Recent Test Results
        </h3>
        <div className="space-y-3">
          {mockMetrics.recentTests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-sm text-muted-foreground">{test.date}</div>
                <Badge variant="outline">{test.provider}</Badge>
                {getScoreBadge(test.score)}
              </div>
              <div className="text-sm font-medium">{test.task}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Trends */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-success" />
          Performance Trends
        </h3>
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chart visualization coming soon</p>
            <p className="text-sm">Historical performance data and trends</p>
          </div>
        </div>
      </Card>
    </div>
  );
};