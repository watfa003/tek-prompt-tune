import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Star, Loader2, Award, TrendingUp, Target, BarChart3, Zap, ChevronDown, ChevronUp, HelpCircle, Play, Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useSettings } from "@/hooks/use-settings";
import { formatOutput, getOutputTypeConfig, OutputType } from '@/lib/output-formatters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PromptResultsProps {
  taskDescription: string;
  aiProvider: string;
  llmModel: string;
  outputType: string;
  influence?: string;
  influenceType?: string;
  influenceWeight?: number;
  variants?: number;
  maxTokens?: number;
  temperature?: number;
  optimizationMode?: 'speed' | 'deep';
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
  influenceWeight,
  variants = 3,
  maxTokens = null,
  temperature = 0.7,
  optimizationMode = 'deep'
}: PromptResultsProps) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      generateOptimizedPrompts();
    }
  }, []);

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
          variants,
          userId: user.id,
          maxTokens,
          temperature,
          influence: influence || '',
          influenceWeight: influenceWeight || 0,
          mode: optimizationMode
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate optimized prompts');
      }

      if (!data) {
        throw new Error('No data returned from optimization');
      }

      // Set result in a single state update to prevent intermediate renders
      setResult(data);
      setIsLoading(false);
      
      toast({
        title: "Success!",
        description: `Generated ${data.variants?.length || 0} optimized prompt variants`,
      });

    } catch (error) {
      console.error('Error generating prompts:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  const getStrategySummary = () => {
    const strategies = [];
    const outputTypeStrategy = {
      name: outputType === 'text' ? 'CLARITY & TONE' :
            outputType === 'essay' ? 'STRUCTURE & STEPS' :
            outputType === 'list' ? 'STRUCTURED ENUMERATION' :
            outputType === 'code' ? 'CODE DIRECTIVES' :
            'SCHEMA-FORMATTED OUTPUT',
      description: outputType === 'text' ? 'Concise, natural language responses in paragraph format' :
                   outputType === 'essay' ? 'Introduction → Body → Conclusion format with logical progression' :
                   outputType === 'list' ? 'Numbered or bulleted lists of ideas, facts, or steps' :
                   outputType === 'code' ? 'Clean, executable code in a defined language' :
                   'Valid JSON object/array with defined keys',
      isPrimary: true
    };

    strategies.push(outputTypeStrategy);

    // Add supporting strategies based on best strategy
    if (result?.summary.bestStrategy) {
      strategies.push({
        name: result.summary.bestStrategy,
        description: 'Applied for maximum effectiveness',
        isPrimary: false
      });
    }

    // Infer additional strategies
    const promptLength = taskDescription.length;
    if (promptLength < 50) {
      strategies.push({
        name: 'ELABORATION & CONTEXT',
        description: 'Enriches brief prompts with necessary context',
        isPrimary: false
      });
    }
    if (maxTokens) {
      strategies.push({
        name: 'EFFICIENCY OPTIMIZATION',
        description: 'Optimizes token usage within specified limits',
        isPrimary: false
      });
    }

    return strategies;
  };

  const getStrategyExplanation = () => {
    const promptLength = taskDescription.length;
    const reasons = [];

    if (outputType !== 'text') {
      reasons.push(`structured ${outputType} formatting`);
    }
    if (promptLength < 50) {
      reasons.push('limited clarity in the original task');
    }
    if (maxTokens) {
      reasons.push(`token optimization (${maxTokens} max)`);
    }
    if (result?.summary.improvementScore && result.summary.improvementScore > 20) {
      reasons.push('significant optimization potential detected');
    }

    return `These strategies were chosen because your prompt required ${reasons.join(', ')}.`;
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
            {settings.showScores && (
              <>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Best Score</div>
                  <div className={`text-lg font-bold ${getScoreColor(result.bestScore)}`}>
                    {Math.round(result.bestScore * 100)}%
                  </div>
                </div>
                {getScoreBadge(result.bestScore)}
              </>
            )}
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
            <div className="flex items-center gap-2 justify-center">
              <div className="font-semibold capitalize">{outputType}</div>
              {(() => {
                const Icon = getOutputTypeConfig(outputType as OutputType).icon;
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
            </div>
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
            <div className="text-lg font-bold">+{result.summary.improvementScore}%</div>
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

        {/* Strategy Summary Section */}
        <Collapsible open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
          <Card className="p-4 bg-muted/30 border-primary/20">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🧠</span>
                  <h4 className="font-semibold">Strategy Summary</h4>
                  <Badge variant="outline" className="ml-2">{getStrategySummary().length} active</Badge>
                </div>
                {isStrategyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4 animate-accordion-down">
              <div className="space-y-2">
                {getStrategySummary().map((strategy, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-3 p-3 rounded-md transition-all ${
                      strategy.isPrimary 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-background/50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{strategy.name}</span>
                        {strategy.isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{strategy.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-primary/5 rounded-md border-l-2 border-primary">
                <p className="text-sm text-muted-foreground italic">
                  {getStrategyExplanation()}
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
                  Copy Prompt
                </Button>
              </div>
              <div className="bg-background/50 p-3 rounded-md mb-4">
                <p className="text-sm whitespace-pre-wrap">{result.bestOptimizedPrompt}</p>
              </div>
              {settings.showScores && (
                <div className="mt-3 flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">Score:</span>
                    <span className={`text-sm font-bold ${getScoreColor(result.bestScore)}`}>
                      {Math.round(result.bestScore * 100)}%
                    </span>
                  </div>
                  {getScoreBadge(result.bestScore)}
                </div>
              )}

              {/* Smart Next-Step Actions */}
              <div className="flex flex-wrap gap-2 mt-4 p-3 bg-muted/30 rounded-lg border border-primary/20">
                <Button 
                  variant="default" 
                  size="sm"
                  className="hover-scale"
                  onClick={() => {
                    toast({
                      title: "Model Tester",
                      description: "Testing feature coming soon!",
                    });
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test on {aiProvider}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover-scale"
                  onClick={() => {
                    // TODO: Implement save as template
                    toast({
                      title: "Save Template",
                      description: "Template saving feature coming soon!",
                    });
                  }}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save as Template
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover-scale"
                  onClick={() => {
                    generateOptimizedPrompts();
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Reoptimize
                </Button>
              </div>
            </Card>
            
            {/* Sample Output from Best Prompt */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Sample Output</span>
                  <span className="text-xs text-muted-foreground">AI response to the optimized prompt</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.variants.find(v => v.score === result.bestScore)?.response || '')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Output
                </Button>
              </div>
              <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                <p className="text-sm whitespace-pre-wrap">
                  {formatOutput(
                    result.variants.find(v => v.score === result.bestScore)?.response || 'No response available',
                    outputType as OutputType
                  )}
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {result.variants.map((variant, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {settings.showScores && (
                      <span className={`text-sm font-medium ${getScoreColor(variant.score)}`}>
                        {Math.round(variant.score * 100)}%
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(variant.prompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Prompt
                  </Button>
                </div>
                
                {/* Optimized Prompt */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Optimized Prompt:</h4>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{variant.prompt}</p>
                  </div>
                </div>
                
                {/* Sample Output - AI Response */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Sample Output:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(variant.response)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Output
                    </Button>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                    <p className="text-sm whitespace-pre-wrap">
                      {formatOutput(variant.response, outputType as OutputType)}
                    </p>
                  </div>
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