import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Copy, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Award,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimizationResult {
  promptId: string;
  originalPrompt: string;
  bestOptimizedPrompt: string;
  bestScore: number;
  variants: Array<{
    prompt: string;
    strategy: string;
    score: number;
    response: string;
    metrics: {
      tokens_used: number;
      response_length: number;
      prompt_length: number;
      strategy_weight: number;
    };
  }>;
  summary: {
    improvementScore: number;
    bestStrategy: string;
    totalVariants: number;
    processingTimeMs: number;
  };
}

export const AIPromptOptimizer: React.FC = () => {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4');
  const [outputType, setOutputType] = useState('text');
  const [variants, setVariants] = useState(3);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const { toast } = useToast();

  const optimizePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to optimize",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          originalPrompt,
          taskDescription,
          aiProvider,
          modelName,
          outputType,
          variants,
          userId: user.id
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Optimization Complete!",
        description: `Generated ${data.variants.length} optimized variants`,
      });

    } catch (error) {
      console.error('Error optimizing prompt:', error);
      toast({
        title: "Error",
        description: "Failed to optimize prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score >= 0.6) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    if (score >= 0.4) return <Badge variant="secondary">Average</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-warning';
    if (score >= 0.4) return 'text-muted-foreground';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <span>AI Prompt Optimizer</span>
            </h2>
            <p className="text-muted-foreground">
              Let our AI agent analyze and optimize your prompts for maximum effectiveness across different models.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="original-prompt" className="text-sm font-medium">Original Prompt</Label>
              <Textarea
                id="original-prompt"
                placeholder="Enter your prompt here..."
                value={originalPrompt}
                onChange={(e) => setOriginalPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description" className="text-sm font-medium">Task Description (Optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Describe what you want the AI to accomplish..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Model</Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Output Type</Label>
              <Select value={outputType} onValueChange={setOutputType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Variants to Generate</Label>
              <Select value={variants.toString()} onValueChange={(value) => setVariants(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Variants</SelectItem>
                  <SelectItem value="3">3 Variants</SelectItem>
                  <SelectItem value="4">4 Variants</SelectItem>
                  <SelectItem value="5">5 Variants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={optimizePrompt}
            disabled={!originalPrompt.trim() || isOptimizing}
            className="w-full bg-gradient-primary"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimizing Prompt...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Optimize Prompt
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Optimization Results</span>
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Best Score</div>
                  <div className={`text-lg font-bold ${getScoreColor(result.bestScore)}`}>
                    {Math.round(result.bestScore * 100)}%
                  </div>
                </div>
                {getScoreBadge(result.bestScore)}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-lg font-bold">+{Math.round(result.summary.improvementScore * 100)}%</div>
                <div className="text-xs text-muted-foreground">Improvement</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-lg font-bold">{result.summary.totalVariants}</div>
                <div className="text-xs text-muted-foreground">Variants</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-lg font-bold">{result.summary.bestStrategy}</div>
                <div className="text-xs text-muted-foreground">Best Strategy</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-lg font-bold">{Math.round(result.summary.processingTimeMs / 1000)}s</div>
                <div className="text-xs text-muted-foreground">Processing Time</div>
              </div>
            </div>

            <Separator />

            {/* Tabs for Results */}
            <Tabs defaultValue="best" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="best">Best Result</TabsTrigger>
                <TabsTrigger value="variants">All Variants</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="best" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Optimized Prompt</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.bestOptimizedPrompt)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                      <div className="whitespace-pre-wrap text-sm">
                        {result.bestOptimizedPrompt}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Score Breakdown</Label>
                      <Progress 
                        value={result.bestScore * 100} 
                        className="h-2 mb-2"
                      />
                      <div className="text-sm text-muted-foreground">
                        {Math.round(result.bestScore * 100)}% effectiveness score
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Strategy Used</Label>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {result.summary.bestStrategy}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="variants" className="space-y-4">
                {result.variants.map((variant, index) => (
                  <Card key={index} className="p-4 border-border/40">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{variant.strategy}</Badge>
                          {getScoreBadge(variant.score)}
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(variant.score)}`}>
                          {Math.round(variant.score * 100)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Optimized Prompt</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(variant.prompt)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3 rounded bg-muted/30 text-sm">
                          {variant.prompt}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                        <div>Tokens: {variant.metrics.tokens_used}</div>
                        <div>Length: {variant.metrics.prompt_length} chars</div>
                        <div>Response: {variant.metrics.response_length} chars</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="comparison" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Original Prompt</Label>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
                      <div className="whitespace-pre-wrap text-sm">
                        {result.originalPrompt}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Length: {result.originalPrompt.length} characters
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Best Optimized</Label>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="whitespace-pre-wrap text-sm">
                        {result.bestOptimizedPrompt}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Length: {result.bestOptimizedPrompt.length} characters
                      </span>
                      <span className="text-primary">
                        +{Math.round(result.summary.improvementScore * 100)}% improvement
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      )}
    </div>
  );
};