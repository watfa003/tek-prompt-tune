import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Star, Loader2, Award, TrendingUp, Target, BarChart3, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface PromptResultsProps {
  taskDescription: string;
  aiProvider: string;
  llmModel: string;
  outputType: string;
  influence?: string;
  influenceType?: string;
  influenceWeight?: number;
}

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

export const PromptResults = ({ 
  taskDescription, 
  aiProvider, 
  llmModel, 
  outputType, 
  influence, 
  influenceType, 
  influenceWeight 
}: PromptResultsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateOptimizedPrompts();
  }, [taskDescription, aiProvider, llmModel, outputType]);

  const generateOptimizedPrompts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a comprehensive prompt based on the task description
      const originalPrompt = `Create a ${outputType} that ${taskDescription}. Make it comprehensive, well-structured, and professional.`;

      const { data, error } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          originalPrompt,
          taskDescription,
          aiProvider: aiProvider.toLowerCase(),
          modelName: llmModel,
          outputType,
          variants: 3,
          userId: user.id,
          maxTokens: 2048,
          temperature: 0.7,
          influence: influence || '',
          influenceWeight: influenceWeight || 0
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate optimized prompts');
      }

      if (!data) {
        throw new Error('No data returned from optimization');
      }

      setResult(data);
      toast({
        title: "Success!",
        description: `Generated ${data.variants?.length || 0} optimized prompt variants`,
      });

    } catch (error) {
      console.error('Error generating prompts:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    if (score >= 0.8) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 0.6) return <Badge className="bg-blue-500">Good</Badge>;
    if (score >= 0.4) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge className="bg-red-500">Needs Work</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-500";
    if (score >= 0.6) return "text-blue-500";
    if (score >= 0.4) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Generating Optimized Prompts...</h3>
            <p className="text-sm text-muted-foreground">
              Using {aiProvider} {llmModel} to create {outputType} prompts
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-card border-destructive">
        <div className="text-center space-y-4">
          <div className="text-destructive">
            <h3 className="text-lg font-semibold">Generation Failed</h3>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={generateOptimizedPrompts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="p-6 shadow-card">
        <div className="text-center">
          <p className="text-muted-foreground">No results to display</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Generated Prompts</span>
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

        {/* Configuration Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Provider</div>
            <div className="font-semibold">{aiProvider}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Model</div>
            <div className="font-semibold">{llmModel}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Output Type</div>
            <div className="font-semibold capitalize">{outputType}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Variants</div>
            <div className="font-semibold">{result.variants.length}</div>
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
            <TabsTrigger value="comparison">Original vs Optimized</TabsTrigger>
          </TabsList>

          <TabsContent value="best" className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Best Optimized Prompt</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.bestOptimizedPrompt)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-background/50 p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{result.bestOptimizedPrompt}</p>
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Score:</span>
                  <span className={`text-sm font-bold ${getScoreColor(result.bestScore)}`}>
                    {Math.round(result.bestScore * 100)}%
                  </span>
                </div>
                {getScoreBadge(result.bestScore)}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {result.variants.map((variant, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{variant.strategy}</Badge>
                    <span className={`text-sm font-medium ${getScoreColor(variant.score)}`}>
                      {Math.round(variant.score * 100)}%
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(variant.prompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted/50 p-3 rounded-md mb-3">
                  <p className="text-sm whitespace-pre-wrap">{variant.prompt}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>Tokens: {variant.metrics.tokens_used}</div>
                  <div>Response Length: {variant.metrics.response_length}</div>
                  <div>Prompt Length: {variant.metrics.prompt_length}</div>
                  <div>Strategy Weight: {variant.metrics.strategy_weight}%</div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full" />
                  <span className="font-medium">Generated From Task</span>
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{result.originalPrompt}</p>
                </div>
              </Card>
              
              <Card className="p-4 border-primary/20 bg-primary/5">
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Optimized Result</span>
                </div>
                <div className="bg-background/50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{result.bestOptimizedPrompt}</p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center">
          <Button onClick={generateOptimizedPrompts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Variants
          </Button>
        </div>
      </div>
    </Card>
  );
};