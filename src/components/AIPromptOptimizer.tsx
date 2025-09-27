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
  Settings,
  Star,
  Sparkles,
  Brain,
  Clock,
  Crown,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { usePromptData } from '@/context/PromptDataContext';

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

// Shared UI Component for optimization
const PromptOptimizerForm = ({ 
  taskDescription, 
  setTaskDescription,
  originalPrompt,
  setOriginalPrompt,
  selectedProvider,
  setSelectedProvider,
  selectedLLM,
  setSelectedLLM,
  selectedOutputType,
  setSelectedOutputType,
  variants,
  setVariants,
  maxTokens,
  setMaxTokens,
  temperature,
  setTemperature,
  selectedInfluence,
  setSelectedInfluence,
  influenceType,
  setInfluenceType,
  influenceWeight,
  setInfluenceWeight,
  advancedOpen,
  setAdvancedOpen,
  optimizationMode,
  setOptimizationMode,
  onSubmit,
  isLoading
}: {
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  originalPrompt?: string;
  setOriginalPrompt?: (value: string) => void;
  selectedProvider: string;
  setSelectedProvider: (value: string) => void;
  selectedLLM: string;
  setSelectedLLM: (value: string) => void;
  selectedOutputType: string;
  setSelectedOutputType: (value: string) => void;
  variants: number;
  setVariants: (value: number) => void;
  maxTokens: number[];
  setMaxTokens: (value: number[]) => void;
  temperature: number[];
  setTemperature: (value: number[]) => void;
  selectedInfluence: string;
  setSelectedInfluence: (value: string) => void;
  influenceType: string;
  setInfluenceType: (value: string) => void;
  influenceWeight: number[];
  setInfluenceWeight: (value: number[]) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (value: boolean) => void;
  optimizationMode?: 'speed' | 'deep';
  setOptimizationMode?: (value: 'speed' | 'deep') => void;
  onSubmit: () => void;
  isLoading: boolean;
}) => {

  const clearInfluence = () => {
    setInfluenceType("");
    setSelectedInfluence("");
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Optimize Existing Prompt
          </h2>
          <p className="text-muted-foreground">
            Optimize your existing prompt using advanced AI techniques and multiple strategies.
          </p>
        </div>

        {/* Original Prompt */}
        <div className="space-y-2">
          <Label htmlFor="original-prompt" className="text-sm font-medium">Original Prompt</Label>
          <Textarea
            id="original-prompt"
            placeholder="Enter your existing prompt to optimize..."
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt?.(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <Label htmlFor="task" className="text-sm font-medium">
            Task Description (Optional)
          </Label>
          <Textarea
            id="task"
            placeholder="Describe the context or goal for this prompt..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Optimization Mode */}
        {setOptimizationMode && optimizationMode && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Optimization Mode</Label>
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
                    <div className="text-sm opacity-90 mt-1">Ultra-fast optimization</div>
                    <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Under 12 seconds • Cached patterns • Quick results
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
        )}

        {/* Influence Section */}
        <div className="space-y-4">
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
                      {influenceType === "template" ? "Template" : influenceType === "favorite" ? "Favorite Prompt" : "Saved Prompt"}
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

        {/* Provider and Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Variants Selection */}
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

        {/* Advanced Settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{maxTokens[0]}</span>
                </div>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  max={8192}
                  min={512}
                  step={256}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Temperature</Label>
                  <span className="text-sm text-muted-foreground">{temperature[0]}</span>
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
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={isLoading || !originalPrompt?.trim()}
          className="w-full bg-gradient-primary"
        >
          {isLoading ? (
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
  );
};

export const AIPromptOptimizer: React.FC = () => {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
const navigate = useNavigate();
  const { addPromptToHistory } = usePromptData();

  // State for the optimizer functionality
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizerTaskDescription, setOptimizerTaskDescription] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [outputType, setOutputType] = useState('text');
  const [variants, setVariants] = useState(3);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [temperature, setTemperature] = useState([0.7]);
  const [selectedInfluence, setSelectedInfluence] = useState('');
  const [influenceType, setInfluenceType] = useState('');
  const [influenceWeight, setInfluenceWeight] = useState([75]);
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
      setAiProvider(settings.defaultProvider.toLowerCase().includes('openai') ? 'openai' : 
                    settings.defaultProvider.toLowerCase().includes('anthropic') ? 'anthropic' :
                    settings.defaultProvider.toLowerCase().includes('google') ? 'google' : 'openai');
      setOutputType(settings.defaultOutputType.toLowerCase());
      setVariants(settings.defaultVariants);
      setMaxTokens([settings.defaultMaxTokens]);
      setTemperature([settings.defaultTemperature]);
    }
  }, [settings]);

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
          influence: selectedInfluence,
          influenceWeight: influenceWeight[0],
          mode: optimizationMode
        }
      });

      if (error) throw error;

      if (optimizationMode === 'speed') {
        setSpeedResult(data);
      } else {
        setResult(data);
        setShowRating(true);
      }

      // Append to history immediately (local-first)
      try {
        const d: any = data;
        // Find the best variant with actual output
        const bestVariant = d?.variants?.reduce((best: any, current: any) => {
          return (!best || (current.score > best.score)) ? current : best;
        }, null);
        
        const historyItem = {
          id: d?.promptId,
          title: `${aiProvider} ${modelName} Optimization`,
          description: `${(d?.bestScore ?? 0) >= 0.8 ? 'High-performance' : (d?.bestScore ?? 0) >= 0.6 ? 'Good-quality' : (d?.bestScore ?? 0) >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
          prompt: d?.originalPrompt || originalPrompt,
          output: d?.bestOptimizedPrompt || d?.variants?.[0]?.prompt || '',
          sampleOutput: bestVariant?.actualOutput || d?.bestActualOutput || '',
          provider: aiProvider,
          outputType: outputType || 'Code',
          score: d?.bestScore ?? 0,
          timestamp: new Date().toLocaleString(),
          tags: [aiProvider?.toLowerCase?.() || 'provider', (modelName || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
          isFavorite: false,
          isBestVariant: true,
        } as const;
        if (historyItem.id) {
          await addPromptToHistory(historyItem as any);
        }
      } catch (e) {
        console.error('Failed to append to local history', e);
      }

      toast({
        title: "Success",
        description: `Prompt optimized successfully using ${optimizationMode} mode!`,
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
      description: "Text copied to clipboard",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return <Badge className="bg-green-500 text-white">Excellent</Badge>;
    if (score >= 0.8) return <Badge className="bg-blue-500 text-white">Great</Badge>;
    if (score >= 0.7) return <Badge className="bg-yellow-500 text-white">Good</Badge>;
    if (score >= 0.6) return <Badge className="bg-orange-500 text-white">Fair</Badge>;
    return <Badge className="bg-red-500 text-white">Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      <PromptOptimizerForm
        taskDescription={optimizerTaskDescription}
        setTaskDescription={setOptimizerTaskDescription}
        originalPrompt={originalPrompt}
        setOriginalPrompt={setOriginalPrompt}
        selectedProvider={aiProvider}
        setSelectedProvider={setAiProvider}
        selectedLLM={modelName}
        setSelectedLLM={setModelName}
        selectedOutputType={outputType}
        setSelectedOutputType={setOutputType}
        variants={variants}
        setVariants={setVariants}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        temperature={temperature}
        setTemperature={setTemperature}
        selectedInfluence={selectedInfluence}
        setSelectedInfluence={setSelectedInfluence}
        influenceType={influenceType}
        setInfluenceType={setInfluenceType}
        influenceWeight={influenceWeight}
        setInfluenceWeight={setInfluenceWeight}
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        optimizationMode={optimizationMode}
        setOptimizationMode={setOptimizationMode}
        onSubmit={optimizePrompt}
        isLoading={isOptimizing}
      />

      {/* Speed Mode Results */}
      {speedResult && (
        <div className="space-y-4">
          {/* Speed Mode Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-lg font-bold">{(speedResult.processingTimeMs / 1000).toFixed(1)}s</div>
                  <div className="text-xs text-muted-foreground">Processing Time</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg font-bold">{speedResult.variants?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Variants</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg font-bold">{speedResult.strategy}</div>
                  <div className="text-xs text-muted-foreground">Best Strategy</div>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Speed Mode: Fast optimization under 12 seconds
              </div>
            </CardContent>
          </Card>
          
          {(speedResult.variants || []).map((variant: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="relative">
                  <Textarea
                    value={variant.prompt}
                    readOnly
                    className="min-h-[120px] resize-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(variant.prompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
};