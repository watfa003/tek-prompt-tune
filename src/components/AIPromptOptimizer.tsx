import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  BarChart3,
  Lightbulb,
  X,
  ChevronDown,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PromptResults } from '@/components/PromptResults';

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
  const { settings } = useSettings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State for the generate functionality
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedLLM, setSelectedLLM] = useState("");
  const [selectedOutputType, setSelectedOutputType] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [influenceWeight, setInfluenceWeight] = useState([75]);
  const [selectedInfluence, setSelectedInfluence] = useState("");
  const [influenceType, setInfluenceType] = useState("");

  // State for the optimizer functionality
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizerTaskDescription, setOptimizerTaskDescription] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [outputType, setOutputType] = useState('text');
  const [variants, setVariants] = useState(3);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [temperature, setTemperature] = useState([0.7]);
  const [optimizerInfluence, setOptimizerInfluence] = useState('');
  const [optimizerInfluenceWeight, setOptimizerInfluenceWeight] = useState([75]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'speed' | 'deep'>('deep');
  const [speedResult, setSpeedResult] = useState<any>(null);
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Check for influence selection from URL params
  React.useEffect(() => {
    const selectedTemplate = searchParams.get('selectedTemplate');
    const selectedType = searchParams.get('selectedType');
    
    if (selectedTemplate && selectedType) {
      setSelectedInfluence(selectedTemplate);
      setInfluenceType(selectedType);
      // Clear the URL params
      navigate('/app/ai-agent', { replace: true });
    }
  }, [searchParams, navigate]);

  // Load default values from settings
  React.useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.defaultProvider.toLowerCase().includes('openai') ? 'openai' : 
                    settings.defaultProvider.toLowerCase().includes('anthropic') ? 'anthropic' :
                    settings.defaultProvider.toLowerCase().includes('google') ? 'google' : 'openai');
      setAiProvider(settings.defaultProvider.toLowerCase().includes('openai') ? 'openai' : 
                    settings.defaultProvider.toLowerCase().includes('anthropic') ? 'anthropic' :
                    settings.defaultProvider.toLowerCase().includes('google') ? 'google' : 'openai');
      setSelectedOutputType(settings.defaultOutputType.toLowerCase());
      setOutputType(settings.defaultOutputType.toLowerCase());
      setVariants(settings.defaultVariants);
      setMaxTokens([settings.defaultMaxTokens]);
      setTemperature([settings.defaultTemperature]);
    }
  }, [settings]);

  const handleGenerate = () => {
    if (taskDescription && selectedProvider && selectedLLM && selectedOutputType) {
      setShowResults(true);
    }
  };

  const clearInfluence = () => {
    setInfluenceType("");
    setSelectedInfluence("");
  };

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
    setSpeedResult(null);
    setShowRating(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          originalPrompt,
          taskDescription: optimizerTaskDescription,
          aiProvider,
          modelName,
          outputType,
          variants,
          userId: user.id,
          maxTokens: maxTokens[0],
          temperature: temperature[0],
          influence: optimizerInfluence || selectedInfluence,
          influenceWeight: optimizerInfluenceWeight[0] || influenceWeight[0],
          mode: optimizationMode
        }
      });

      if (error) throw error;

      // Handle Speed Mode results
      if (data.mode === 'speed') {
        setSpeedResult(data);
        setShowRating(true);
        toast({
          title: "⚡ Speed Optimization Complete!",
          description: `Optimized in ${data.processingTimeMs}ms using cached heuristics`,
        });
      } else {
        // Handle Deep Mode results
        setResult(data);
        toast({
          title: "🔍 Deep Optimization Complete!",
          description: `Generated ${data.variants?.length || 0} optimized variants`,
        });
      }

    } catch (error) {
      console.error('Error optimizing prompt:', error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const submitRating = async (rating: number) => {
    if (!speedResult?.speedResultId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('speed_optimizations')
        .update({ 
          rating, 
          feedback_type: 'stars',
          updated_at: new Date().toISOString()
        })
        .eq('id', speedResult.speedResultId)
        .eq('user_id', user.id);

      setUserRating(rating);
      setShowRating(false);
      toast({
        title: "Thank you!",
        description: "Your rating helps improve our speed optimization",
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Prompts</TabsTrigger>
          <TabsTrigger value="optimize">Optimize Existing</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card className="p-6 shadow-card">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generate Optimized Prompts</h2>
                <p className="text-muted-foreground">
                  Describe your task and let our AI optimize prompts for maximum effectiveness.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-2">
                  <Label htmlFor="task" className="text-sm font-medium">Task Description</Label>
                  <Textarea
                    id="task"
                    placeholder="Describe what you want the AI to do..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Influence Section */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Influence Optimization (Optional)</Label>
                  </div>
                  
                  {selectedInfluence ? (
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {influenceType === "template" ? "Template" : "Favorited Template"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {influenceWeight[0]}% influence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedInfluence}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearInfluence}
                          className="h-auto p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">Influence Weight</Label>
                          <span className="text-xs text-muted-foreground">{influenceWeight[0]}%</span>
                        </div>
                        <Slider
                          value={influenceWeight}
                          onValueChange={setInfluenceWeight}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Template Style</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Link to="/app/templates?selectForInfluence=true">
                            <Button variant="outline" className="w-full h-auto p-3 text-left">
                              <div className="flex flex-col items-start space-y-1">
                                <span className="font-medium">Browse Templates</span>
                                <span className="text-xs text-muted-foreground">View all available templates</span>
                              </div>
                            </Button>
                          </Link>
                          <Link to="/app/history?selectForInfluence=true">
                            <Button variant="outline" className="w-full h-auto p-3 text-left">
                              <div className="flex flex-col items-start space-y-1">
                                <span className="font-medium">My Favorited Prompts</span>
                                <span className="text-xs text-muted-foreground">Choose from saved favorites</span>
                              </div>
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Influence Weight</Label>
                          <span className="text-sm text-muted-foreground">{influenceWeight[0]}%</span>
                        </div>
                        <Slider
                          value={influenceWeight}
                          onValueChange={setInfluenceWeight}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">AI Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="mistral">Mistral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">LLM Model</Label>
                  <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LLM model" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider === "openai" && (
                        <>
                          <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        </>
                      )}
                      {selectedProvider === "anthropic" && (
                        <>
                          <SelectItem value="claude-opus-4-1-20250805">Claude 4 Opus</SelectItem>
                          <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                          <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                        </>
                      )}
                      {selectedProvider === "google" && (
                        <>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                        </>
                      )}
                      {selectedProvider === "groq" && (
                        <>
                          <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                        </>
                      )}
                      {selectedProvider === "mistral" && (
                        <>
                          <SelectItem value="mistral-large">Mistral Large</SelectItem>
                          <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                        </>
                      )}
                      {!selectedProvider && (
                        <SelectItem disabled value="none">Select a provider first</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Output Type</Label>
                  <Select value={selectedOutputType} onValueChange={setSelectedOutputType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select output type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full bg-gradient-primary"
                    disabled={!taskDescription || !selectedProvider || !selectedLLM || !selectedOutputType}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Prompts
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {showResults && (
            <PromptResults 
              taskDescription={taskDescription}
              aiProvider={selectedProvider}
              llmModel={selectedLLM}
              outputType={selectedOutputType}
              influence={selectedInfluence}
              influenceType={influenceType}
              influenceWeight={influenceWeight[0]}
            />
          )}
        </TabsContent>

        <TabsContent value="optimize">
          <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center space-x-2">
                  <Target className="h-6 w-6 text-primary" />
                  <span>AI Prompt Optimizer</span>
                </h2>
                <p className="text-muted-foreground">
                  Transform your prompts with AI-powered optimization strategies for better results
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Original Prompt</Label>
                  <Textarea
                    placeholder="Enter your prompt that needs optimization..."
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Task Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe the context or goal for this prompt..."
                    value={optimizerTaskDescription}
                    onChange={(e) => setOptimizerTaskDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Optimization Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Choose Optimization Mode
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={optimizationMode === 'speed' ? 'default' : 'outline'}
                      onClick={() => setOptimizationMode('speed')}
                      className={`h-auto p-6 justify-start text-left transition-all duration-300 ${
                        optimizationMode === 'speed' 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105' 
                          : 'hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-lg">⚡ Speed Mode</div>
                          <div className="text-sm opacity-90 mt-1">Lightning fast optimization</div>
                          <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~5 seconds • Cached heuristics • Multiple variants
                          </div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={optimizationMode === 'deep' ? 'default' : 'outline'}
                      onClick={() => setOptimizationMode('deep')}
                      className={`h-auto p-6 justify-start text-left transition-all duration-300 ${
                        optimizationMode === 'deep' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                          : 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-lg">🔍 Deep Mode</div>
                          <div className="text-sm opacity-90 mt-1">Advanced AI optimization</div>
                          <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Slower • Full AI processing • Highest quality
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
                    optimizationMode === 'speed' 
                      ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-950/20' 
                      : 'bg-blue-50 border-blue-400 dark:bg-blue-950/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {optimizationMode === 'speed' ? <Zap className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                      <span className="font-medium">
                        {optimizationMode === 'speed' ? 'Speed Mode Selected' : 'Deep Mode Selected'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {optimizationMode === 'speed' 
                        ? 'Uses cached optimization patterns and heuristics for instant results. Perfect for quick iterations and testing.'
                        : 'Leverages multiple AI models to create the highest quality optimizations. Best for final prompts and complex requirements.'
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">AI Provider</Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="google">Google (Gemini)</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="mistral">Mistral</SelectItem>
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
                        {aiProvider === "openai" && (
                          <>
                            <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          </>
                        )}
                        {aiProvider === "anthropic" && (
                          <>
                            <SelectItem value="claude-opus-4-1-20250805">Claude 4 Opus</SelectItem>
                            <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                            <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                          </>
                        )}
                        {aiProvider === "google" && (
                          <>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                          </>
                        )}
                        {aiProvider === "groq" && (
                          <>
                            <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                          </>
                        )}
                        {aiProvider === "mistral" && (
                          <>
                            <SelectItem value="mistral-large">Mistral Large</SelectItem>
                            <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
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

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Advanced Settings</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Max Tokens</Label>
                          <span className="text-sm text-muted-foreground">{maxTokens[0]}</span>
                        </div>
                        <Slider
                          value={maxTokens}
                          onValueChange={setMaxTokens}
                          max={4096}
                          min={256}
                          step={128}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Temperature</Label>
                          <span className="text-sm text-muted-foreground">{temperature[0].toFixed(1)}</span>
                        </div>
                        <Slider
                          value={temperature}
                          onValueChange={setTemperature}
                          max={2}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/40">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium">Influence Optimization (Optional)</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter an example prompt or style to influence the optimization..."
                          value={optimizerInfluence}
                          onChange={(e) => setOptimizerInfluence(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Influence Weight</Label>
                            <span className="text-sm text-muted-foreground">{optimizerInfluenceWeight[0]}%</span>
                          </div>
                          <Slider
                            value={optimizerInfluenceWeight}
                            onValueChange={setOptimizerInfluenceWeight}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

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
            </div>
          </Card>

          {/* Speed Mode Results */}
          {speedResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Speed Optimization Complete!
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {speedResult.processingTimeMs}ms
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 border-blue-200">
                    <Target className="h-3 w-3 mr-1" />
                    {speedResult.strategy}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 border-green-200">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {speedResult.variants?.length || 0} variants
                  </Badge>
                </div>
              </div>

              {/* Best Result */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Best Optimized Prompt
                    <Badge className="bg-yellow-500 text-white">
                      {Math.round((speedResult.bestScore || 0.8) * 100)}% Score
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea 
                      value={speedResult.bestOptimizedPrompt || speedResult.optimizedPrompt} 
                      readOnly 
                      className="min-h-[120px] bg-white/50 dark:bg-black/20 resize-none border-yellow-200" 
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => copyToClipboard(speedResult.bestOptimizedPrompt || speedResult.optimizedPrompt)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* All Variants */}
              {speedResult.variants && speedResult.variants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-600" />
                      All Optimization Variants ({speedResult.variants.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {speedResult.variants.map((variant: any, index: number) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                            index === 0 ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Crown className="h-4 w-4 text-yellow-600" />}
                              <Badge variant={index === 0 ? 'default' : 'secondary'}>
                                {variant.strategy}
                              </Badge>
                              <Badge variant="outline">
                                {Math.round((variant.score || 0) * 100)}%
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(variant.prompt)}
                              className="h-8"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <Textarea 
                            value={variant.prompt} 
                            readOnly 
                            className="min-h-[80px] bg-muted/20 resize-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Rating Section */}
              {showRating && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-center">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Rate This Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      How satisfied are you with this speed optimization?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="lg"
                          onClick={() => submitRating(star)}
                          className="p-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-all duration-200 hover:scale-110"
                        >
                          <Star 
                            className={`h-6 w-6 ${
                              star <= (userRating || 0) 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-gray-300 hover:text-yellow-400"
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your feedback helps improve our optimization algorithms
                    </p>
                  </CardContent>
                </Card>
              )}

              {userRating && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Thank you for your feedback!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        You rated this optimization {userRating}/5 stars
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Deep Mode Results */}
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
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
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
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Original Prompt</span>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{result.originalPrompt}</p>
                        </div>
                      </Card>
                      
                      <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Optimized Prompt</span>
                        </div>
                        <div className="bg-background/50 p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{result.bestOptimizedPrompt}</p>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};