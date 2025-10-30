import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FlaskConical,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Trophy,
  Zap,
  Target,
  ChevronRight,
  Copy,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface CategoryScores {
  clarity: number;
  specificity: number;
  efficiency: number;
  structure: number;
  constraints: number;
  elaboration: number;
  intent_alignment: number;
  adaptability: number;
}

interface SingleTestResult {
  total_score: number;
  category_breakdown: CategoryScores;
  ai_analysis: {
    strengths: string[];
    weaknesses: string[];
    suggested_fixes: string[];
  };
}

interface CompareTestResult {
  prompt_a_score: number;
  prompt_b_score: number;
  prompt_a_breakdown: CategoryScores;
  prompt_b_breakdown: CategoryScores;
  winner: 'A' | 'B' | 'Tie';
  reasoning: string;
  comparison: Record<string, string>;
}

const LLM_OPTIONS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (Powerful)' },
  { value: 'openai/gpt-5-2025-08-07', label: 'GPT-5 (Latest)' },
  { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

const PromptLab = () => {
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [testTask, setTestTask] = useState('');
  const [targetLLM, setTargetLLM] = useState('openai/gpt-4o-mini');
  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<SingleTestResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareTestResult | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRunTest = async () => {
    if (!promptA.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }

    if (mode === 'compare' && !promptB.trim()) {
      toast({ title: "Error", description: "Please enter both prompts for comparison", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSingleResult(null);
    setCompareResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in to use the lab", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('prompt-lab-analyze', {
        body: {
          mode,
          target_llm: targetLLM,
          prompt_a: promptA,
          prompt_b: mode === 'compare' ? promptB : undefined,
          test_task: testTask || undefined,
        },
      });

      if (error) throw error;

      if (mode === 'single') {
        setSingleResult(data);
        toast({ title: "Analysis Complete", description: "Your prompt has been scored!" });
      } else {
        setCompareResult(data);
        toast({ title: "Battle Complete", description: `Prompt ${data.winner} wins!` });
      }
    } catch (error) {
      console.error('Lab test error:', error);
      toast({ 
        title: "Test Failed", 
        description: error instanceof Error ? error.message : "Failed to analyze prompt",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const formatChartData = (scores: CategoryScores) => {
    return Object.entries(scores).map(([key, value]) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      score: value,
      fullMark: 10,
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 fade-slide-up">
      {/* Header */}
      <div className="glass-card rounded-[24px] p-6 md:p-8 neon-glow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">PromptTek Lab 🔬</h1>
            <p className="text-muted-foreground mt-1">
              Test, score, and optimize your prompts with AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      {/* Main Lab Interface */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Prompt Testing Lab
          </CardTitle>
          <CardDescription>
            Choose a mode, select your target LLM, and run comprehensive tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'compare')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">🧠 Single Prompt Test</TabsTrigger>
              <TabsTrigger value="compare">⚖️ Battle Mode</TabsTrigger>
            </TabsList>

            {/* Single Prompt Mode */}
            <TabsContent value="single" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Your Prompt</Label>
                <Textarea
                  placeholder="Enter your prompt to test and score..."
                  value={promptA}
                  onChange={(e) => setPromptA(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target LLM</Label>
                  <Select value={targetLLM} onValueChange={setTargetLLM}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Task (Optional)</Label>
                  <Textarea
                    placeholder="e.g., 'Summarize the article' or 'Write a poem'"
                    value={testTask}
                    onChange={(e) => setTestTask(e.target.value)}
                    rows={1}
                  />
                </div>
              </div>

              <Button 
                onClick={handleRunTest} 
                disabled={isLoading || !promptA.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Testing Prompt...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Run Test & Score
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Compare Mode */}
            <TabsContent value="compare" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prompt A</Label>
                  <Textarea
                    placeholder="Enter first prompt..."
                    value={promptA}
                    onChange={(e) => setPromptA(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prompt B</Label>
                  <Textarea
                    placeholder="Enter second prompt..."
                    value={promptB}
                    onChange={(e) => setPromptB(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target LLM</Label>
                  <Select value={targetLLM} onValueChange={setTargetLLM}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Task (Optional)</Label>
                  <Textarea
                    placeholder="e.g., 'Summarize the article'"
                    value={testTask}
                    onChange={(e) => setTestTask(e.target.value)}
                    rows={1}
                  />
                </div>
              </div>

              <Button 
                onClick={handleRunTest} 
                disabled={isLoading || !promptA.trim() || !promptB.trim()}
                className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Running Battle...
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    Start Battle
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Single Test Results */}
      {singleResult && (
        <Card className="glass-card neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
              <div className="text-5xl font-bold gradient-text mb-2">
                {singleResult.total_score.toFixed(1)}/10
              </div>
              <p className="text-muted-foreground">Overall Prompt Score</p>
            </div>

            {/* Radar Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={formatChartData(singleResult.category_breakdown)}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Category Scores
              </h3>
              {Object.entries(singleResult.category_breakdown).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-semibold ${getScoreColor(value)}`}>
                      {value.toFixed(1)}/10
                    </span>
                  </div>
                  <Progress value={value * 10} className="h-2" />
                </div>
              ))}
            </div>

            <Separator />

            {/* AI Analysis */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Analysis
              </h3>

              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Strengths
                </h4>
                {singleResult.ai_analysis.strengths.map((strength, idx) => (
                  <div key={idx} className="flex gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-warning flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Areas to Improve
                </h4>
                {singleResult.ai_analysis.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="flex gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <span>{weakness}</span>
                  </div>
                ))}
              </div>

              {/* Suggested Fixes */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Suggested Fixes
                </h4>
                {singleResult.ai_analysis.suggested_fixes.map((fix, idx) => (
                  <div key={idx} className="flex gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(promptA)}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
              <Button 
                onClick={() => navigate('/app/ai-agent', { state: { prompt: promptA } })}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Optimize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Results */}
      {compareResult && (
        <Card className="glass-card neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Battle Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Winner Declaration */}
            <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
              {compareResult.winner === 'Tie' ? (
                <>
                  <div className="text-4xl mb-2">🤝</div>
                  <div className="text-3xl font-bold gradient-text mb-2">It's a Tie!</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-3xl font-bold gradient-text mb-2">
                    Prompt {compareResult.winner} Wins!
                  </div>
                </>
              )}
              <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
                {compareResult.reasoning}
              </p>
            </div>

            {/* Side-by-Side Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Prompt A</div>
                <div className={`text-3xl font-bold ${compareResult.winner === 'A' ? 'text-success' : 'text-foreground'}`}>
                  {compareResult.prompt_a_score.toFixed(1)}
                </div>
                {compareResult.winner === 'A' && (
                  <Badge className="mt-2 bg-success">Winner</Badge>
                )}
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Prompt B</div>
                <div className={`text-3xl font-bold ${compareResult.winner === 'B' ? 'text-success' : 'text-foreground'}`}>
                  {compareResult.prompt_b_score.toFixed(1)}
                </div>
                {compareResult.winner === 'B' && (
                  <Badge className="mt-2 bg-success">Winner</Badge>
                )}
              </div>
            </div>

            {/* Comparison Details */}
            <div className="space-y-2">
              <h3 className="font-semibold">Category Comparison</h3>
              {Object.entries(compareResult.comparison).map(([category, result]) => (
                <div key={category} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="capitalize text-sm">{category}</span>
                  <Badge variant="outline">{result}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromptLab;
