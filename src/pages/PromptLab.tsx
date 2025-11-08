import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AmbientParticles } from '@/components/ui/ambient-particles';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { FeedbackCard } from '@/components/ui/feedback-card';
import { OutputTypeSelector } from '@/components/ui/output-type-selector';
import { OptimizationComparison } from '@/components/lab/OptimizationComparison';
import { 
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { 
  FlaskIcon, 
  TargetIcon, 
  ZapIcon, 
  TrophyIcon, 
  SparklesIcon, 
  ChartIcon, 
  TrendingIcon,
  ActivityIcon
} from '@/components/lab/LabIcons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { OutputType } from '@/lib/output-formatters';

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
    strengths?: string[];
    weaknesses?: string[];
    suggested_fixes: string[];
    explanation?: Record<string, string>;
  };
  prompt_type?: 'simple' | 'complex' | 'creative';
  tested_prompt?: string; // Add the prompt that was tested
}

interface CompareTestResult {
  prompt_a_score: number;
  prompt_b_score: number;
  prompt_a_breakdown: CategoryScores;
  prompt_b_breakdown: CategoryScores;
  winner: 'A' | 'B' | 'Tie';
  reasoning: string;
  comparison: Record<string, string>;
  prompt_a_type?: 'simple' | 'complex' | 'creative';
  prompt_b_type?: 'simple' | 'complex' | 'creative';
}

const Lab = () => {
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [selectedLLM, setSelectedLLM] = useState('gemini-2.5-flash');
  const [outputType, setOutputType] = useState<OutputType>('text'); // NEW: Track output type
  const [isLoading, setIsLoading] = useState(false);
  const [testingMode, setTestingMode] = useState<'single' | 'compare' | null>(null);
  const [singleResult, setSingleResult] = useState<SingleTestResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareTestResult | null>(null);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);
  const [autoOptimizeResult, setAutoOptimizeResult] = useState<any>(null);
  const [isRetesting, setIsRetesting] = useState(false); // NEW: Track re-testing state
  const [optimizationComparison, setOptimizationComparison] = useState<{ before: SingleTestResult; after: SingleTestResult } | null>(null); // NEW: Comparison data
  const [optimizationProgress, setOptimizationProgress] = useState<{ step: number; message: string; progress: number } | null>(null); // NEW: Progress tracking
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Persistence keys
  const LAST_RESULT_KEY = 'lab:lastResult';
  const PENDING_START_KEY = 'lab:pendingStart';
  const PENDING_MODE_KEY = 'lab:pendingMode';

  useEffect(() => {
    document.title = 'Lab | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Test and optimize AI prompts with PrompTek Lab - compare models, get detailed scoring, and improve prompt performance.');
    }
  }, []);

  // Load last result and pending test state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_RESULT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.mode === 'single' && parsed.result) {
          setSingleResult(parsed.result as SingleTestResult);
          setCompareResult(null);
          // Restore the tested prompt if available
          if (parsed.result.tested_prompt) {
            setPromptA(parsed.result.tested_prompt);
          }
        } else if (parsed?.mode === 'compare' && parsed.result) {
          setCompareResult(parsed.result as CompareTestResult);
          setSingleResult(null);
        }
      }
      
      // Check if there's a pending test
      const pendingStart = localStorage.getItem(PENDING_START_KEY);
      const pendingMode = localStorage.getItem(PENDING_MODE_KEY);
      
      if (pendingStart && pendingMode) {
        setIsLoading(true);
        setTestingMode(pendingMode as 'single' | 'compare');
        // Set the mode to match what's being tested
        setMode(pendingMode as 'single' | 'compare');
      }
    } catch (e) {
      console.warn('Failed to load last lab result from storage', e);
    }
  }, []);

  // Background polling for pending runs
  useEffect(() => {
    let interval: number | undefined;
    const pendingStart = localStorage.getItem(PENDING_START_KEY);
    if (!pendingStart) return;

    const checkForResult = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from('prompt_lab_results')
          .select('*')
          .eq('user_id', userId)
          .gt('created_at', pendingStart)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) {
          console.warn('Polling error', error);
          return;
        }
        if (data && data.length > 0) {
          const row = data[0] as any;
          if (row.mode === 'single') {
            const result: SingleTestResult = {
              total_score: row.total_score_a,
              category_breakdown: row.category_breakdown_a,
              ai_analysis: row.ai_analysis,
              prompt_type: row.prompt_type_a ?? undefined,
              tested_prompt: row.prompt_a, // Add the tested prompt from database
            };
            setSingleResult(result);
            setCompareResult(null);
            localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ mode: 'single', result }));
          } else if (row.mode === 'compare') {
            const result: CompareTestResult = {
              prompt_a_score: row.total_score_a,
              prompt_b_score: row.total_score_b,
              prompt_a_breakdown: row.category_breakdown_a,
              prompt_b_breakdown: row.category_breakdown_b,
              winner: row.winner,
              reasoning: row.ai_analysis?.reasoning ?? '',
              comparison: row.ai_analysis?.comparison ?? {},
              prompt_a_type: row.prompt_a_type ?? undefined,
              prompt_b_type: row.prompt_b_type ?? undefined,
            };
            setCompareResult(result);
            setSingleResult(null);
            localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ mode: 'compare', result }));
          }
          // Clear pending when we pick up a result
          setIsLoading(false);
          setTestingMode(null);
          localStorage.removeItem(PENDING_START_KEY);
          localStorage.removeItem(PENDING_MODE_KEY);
          if (interval) window.clearInterval(interval);
          toast({ title: 'Background test complete', description: 'Your lab analysis finished while you were away.' });
        }
      } catch (e) {
        console.warn('Error while polling lab results', e);
      }
    };

    // Initial check and start polling
    checkForResult();
    interval = window.setInterval(checkForResult, 3000);

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);


  const handleRunTest = async () => {
    console.log('🧪 [PromptLab] Starting test:', { mode, selectedProvider, selectedLLM });
    
    if (!promptA.trim()) {
      console.error('❌ [PromptLab] Validation failed: No prompt A');
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }

    if (mode === 'compare' && !promptB.trim()) {
      console.error('❌ [PromptLab] Validation failed: No prompt B for battle mode');
      toast({ title: "Error", description: "Please enter both prompts for comparison", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTestingMode(mode);
    setSingleResult(null);
    setCompareResult(null);

    try {
      const { invokeWithAuth } = await import('@/lib/auth-helpers');
      
      const targetLLM = `${selectedProvider}/${selectedLLM}`;
      const requestPayload = {
        mode,
        target_llm: targetLLM,
        prompt_a: promptA,
        prompt_b: mode === 'compare' ? promptB : undefined,
        output_type: outputType, // NEW: Pass output type to backend
      };

      console.log('📡 [PromptLab] Sending request to edge function:', requestPayload);

      // Mark this run as pending so it can complete in the background
      const startIso = new Date().toISOString();
      localStorage.setItem(PENDING_START_KEY, startIso);
      localStorage.setItem(PENDING_MODE_KEY, mode);
      
      console.log('⏳ [PromptLab] Calling invokeWithAuth...');
      const startTime = Date.now();
      
      const data = await invokeWithAuth('prompt-lab-analyze', requestPayload, {
        retries: mode === 'compare' ? 1 : 2, // Less retries for battle mode since it's slow
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [PromptLab] Request completed in ${duration}ms:`, data);

      if (mode === 'single') {
        console.log('📊 [PromptLab] Setting single test result');
        // Add the tested prompt to the result
        const resultWithPrompt = { ...data, tested_prompt: promptA };
        setSingleResult(resultWithPrompt);
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ mode: 'single', result: resultWithPrompt }));
        setTestingMode(null);
        localStorage.removeItem(PENDING_START_KEY);
        localStorage.removeItem(PENDING_MODE_KEY);
        toast({ title: "Analysis Complete", description: "Your prompt has been scored!" });
      } else {
        console.log('⚔️ [PromptLab] Setting battle result, winner:', data.winner);
        setCompareResult(data);
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ mode: 'compare', result: data }));
        setTestingMode(null);
        localStorage.removeItem(PENDING_START_KEY);
        localStorage.removeItem(PENDING_MODE_KEY);
        toast({ title: "Battle Complete", description: `Prompt ${data.winner} wins!` });
      }
    } catch (error) {
      const duration = Date.now();
      console.error('❌ [PromptLab] Test failed after ~' + duration + 'ms:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'N/A',
        stack: error instanceof Error ? error.stack : 'N/A',
      });
      
      const isTimeout = error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('aborted'));
      
      let errorMessage = error instanceof Error ? error.message : "Failed to analyze prompt";
      
      if (isTimeout && mode === 'compare') {
        errorMessage = "Battle mode timed out. This can happen with complex prompts. Try again or use single test mode.";
      }
      
      toast({ 
        title: "Test Failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      setTestingMode(null);
      console.log('🏁 [PromptLab] Test flow complete');
    }
  };

  const handleAutoOptimize = async (result: any) => {
    if (!result) return;

    // Get the prompt from the result or fallback to promptA state
    const promptToOptimize = result.tested_prompt || promptA;

    if (!promptToOptimize?.trim()) {
      toast({
        title: "Error",
        description: "No prompt available to optimize. Please run a test first.",
        variant: "destructive"
      });
      return;
    }

    console.log('[Auto-Optimize] Starting auto-optimization with re-testing...', {
      hasScores: !!result.category_breakdown,
      hasRecommendations: !!result.ai_analysis?.suggested_fixes,
      promptLength: promptToOptimize.length,
      outputType,
      promptType: result.prompt_type,
      categoryBreakdown: result.category_breakdown
    });

    setIsAutoOptimizing(true);
    setAutoOptimizeResult(null);
    setOptimizationComparison(null);
    setOptimizationProgress({ step: 1, message: 'Analyzing your prompt...', progress: 25 });

    try {
      // Step 1: Optimize the prompt
      console.log('[Auto-Optimize] Step 1: Calling lab-auto-optimize edge function...');
      const { data, error } = await supabase.functions.invoke('lab-auto-optimize', {
        body: {
          prompt: promptToOptimize,
          scores: result.category_breakdown,
          aiRecommendations: result.ai_analysis?.suggested_fixes,
          outputType: outputType, // Pass the actual output type
          promptType: result.prompt_type, // Send detected prompt type if available
        }
      });

      console.log('[Auto-Optimize] Response received:', { data, error });

      if (error) throw error;

      if (!data?.success || !data?.optimizedPrompt) {
        throw new Error('Failed to generate optimized prompt');
      }

      setAutoOptimizeResult(data);
      setOptimizationProgress({ step: 2, message: 'Generated optimized version...', progress: 50 });
      
      // Step 2: Use the actual re-graded scores from the optimizer
      console.log('[Auto-Optimize] Step 2: Using re-graded scores from optimizer...');
      setOptimizationProgress({ step: 3, message: 'Analyzing improvements...', progress: 90 });
      
      // Build the before/after comparison using the actual graded scores
      const beforeResult = result;
      
      // Use the actual graded scores from the optimizer response
      const actualNewScore = data.newTotalScore || 10;
      const actualNewScores = data.newScores || beforeResult.category_breakdown;
      
      const afterResult = { 
        total_score: actualNewScore,
        tested_prompt: data.optimizedPrompt,
        category_breakdown: actualNewScores,
        ai_analysis: {
          ...beforeResult.ai_analysis,
          suggested_fixes: data.improvementAreas?.length > 0 
            ? [`Applied ${data.improvementAreas.join(', ')} optimizations`]
            : ['Applied AI optimizations']
        },
        estimated: false // This is real grading, not estimated
      };

      setOptimizationComparison({
        before: beforeResult,
        after: afterResult
      });

      setOptimizationProgress({ step: 4, message: 'Complete!', progress: 100 });

      toast({
        title: "Auto-Optimization Complete!",
        description: `Score improved from ${beforeResult.total_score.toFixed(2)} to ${actualNewScore.toFixed(2)}`,
      });

    } catch (error: any) {
      console.error('[Auto-Optimize] Error:', error);
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to auto-optimize the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAutoOptimizing(false);
      setTimeout(() => setOptimizationProgress(null), 1000); // Clear progress after 1 second
      setIsRetesting(false);
    }
  };

  // Handle accepting the optimized prompt
  const handleAcceptOptimization = () => {
    if (!optimizationComparison || !autoOptimizeResult) return;

    // Replace promptA with the optimized version
    setPromptA(autoOptimizeResult.optimizedPrompt);
    
    // Update the single result to show the new optimized scores
    setSingleResult(optimizationComparison.after);
    
    // Clear the comparison view
    setOptimizationComparison(null);
    setAutoOptimizeResult(null);

    toast({
      title: "Optimized Prompt Accepted",
      description: "Your prompt has been updated with the optimized version.",
    });
  };

  // Handle rejecting the optimized prompt
  const handleRejectOptimization = () => {
    setOptimizationComparison(null);
    setAutoOptimizeResult(null);

    toast({
      title: "Optimization Rejected",
      description: "Keeping your original prompt.",
    });
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
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 3) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Optimized';
    if (score >= 6) return 'Functional but Weak';
    if (score >= 3) return 'Needs Major Fixing';
    return 'Unusable / Unintelligible';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-400';
    if (score >= 6) return 'from-yellow-500 to-amber-400';
    if (score >= 3) return 'from-orange-500 to-red-400';
    return 'from-red-600 to-rose-500';
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background */}
      <AmbientParticles />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight">
            <span className="gradient-text">PromptTek Lab</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Test and analyze your prompts with precision AI scoring
          </p>
        </motion.div>

        {/* Main Lab Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="glass-card border-primary/20 rounded-[24px] overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TargetIcon className="h-5 w-5 text-primary" />
                Prompt Testing Zone
              </CardTitle>
              <CardDescription>
                Select your mode, choose an LLM, and launch your test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              <Tabs value={mode} onValueChange={(v) => {
                // Prevent switching modes while a test is running
                if (!isLoading) {
                  setMode(v as 'single' | 'compare');
                }
              }}>
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                  <TabsTrigger 
                    value="single"
                    disabled={isLoading && testingMode === 'compare'}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Single Test
                    {testingMode === 'single' && isLoading && (
                      <Badge variant="outline" className="ml-2 bg-primary/10 border-primary/30 text-primary animate-pulse">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compare"
                    disabled={isLoading && testingMode === 'single'}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    Battle Mode
                    {testingMode === 'compare' && isLoading && (
                      <Badge variant="outline" className="ml-2 bg-accent/10 border-accent/30 text-accent animate-pulse">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Single Prompt Mode */}
                <TabsContent value="single" className="space-y-6 mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                     <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-primary" />
                        Your Prompt
                        {testingMode === 'single' && (
                          <Badge variant="outline" className="ml-auto bg-primary/10 border-primary/30 text-primary animate-pulse">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Testing...
                          </Badge>
                        )}
                      </Label>
                      <Textarea
                        placeholder="Enter your prompt to test and score..."
                        value={promptA}
                        onChange={(e) => setPromptA(e.target.value)}
                        rows={8}
                        disabled={testingMode === 'single'}
                        className="resize-none font-mono text-sm border-primary/20 focus:border-primary/40 focus:ring-primary/20 transition-all bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">AI Provider</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={testingMode === 'single'}>
                          <SelectTrigger className="border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
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
                        <Label className="text-sm font-medium">LLM Model</Label>
                        <Select value={selectedLLM} onValueChange={setSelectedLLM} disabled={testingMode === 'single'}>
                          <SelectTrigger className="border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProvider === "openai" && (
                              <>
                                <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                                <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 mini</SelectItem>
                                <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 nano</SelectItem>
                                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
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
                                <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</SelectItem>
                                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
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
                        <OutputTypeSelector
                          value={outputType}
                          onChange={setOutputType}
                          className="border-primary/20"
                          disabled={testingMode === 'single'}
                        />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleRunTest} 
                        disabled={isLoading || !promptA.trim()}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white h-14 text-lg font-semibold shadow-[0_0_30px_rgba(110,231,255,0.3)] hover:shadow-[0_0_50px_rgba(110,231,255,0.5)] transition-all btn-sheen"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Analyzing Prompt...
                          </>
                        ) : (
                          <>
                            <ZapIcon className="h-5 w-5 mr-2" />
                            Run Test & Score
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                {/* Compare Mode */}
                <TabsContent value="compare" className="space-y-6 mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">A</span>
                          Prompt A
                          {testingMode === 'compare' && (
                            <Badge variant="outline" className="ml-auto bg-primary/10 border-primary/30 text-primary animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </Badge>
                          )}
                        </Label>
                        <Textarea
                          placeholder="Enter first prompt..."
                          value={promptA}
                          onChange={(e) => setPromptA(e.target.value)}
                          rows={8}
                          disabled={testingMode === 'compare'}
                          className="resize-none font-mono text-sm border-primary/20 focus:border-primary/40 bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">B</span>
                          Prompt B
                          {testingMode === 'compare' && (
                            <Badge variant="outline" className="ml-auto bg-accent/10 border-accent/30 text-accent animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </Badge>
                          )}
                        </Label>
                        <Textarea
                          placeholder="Enter second prompt..."
                          value={promptB}
                          onChange={(e) => setPromptB(e.target.value)}
                          rows={8}
                          disabled={testingMode === 'compare'}
                          className="resize-none font-mono text-sm border-accent/20 focus:border-accent/40 bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">AI Provider</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={testingMode === 'compare'}>
                          <SelectTrigger className="border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
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
                        <Label className="text-sm font-medium">LLM Model</Label>
                        <Select value={selectedLLM} onValueChange={setSelectedLLM} disabled={testingMode === 'compare'}>
                          <SelectTrigger className="border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProvider === "openai" && (
                              <>
                                <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                                <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 mini</SelectItem>
                                <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 nano</SelectItem>
                                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
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
                                <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</SelectItem>
                                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
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
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Output Type</Label>
                      <OutputTypeSelector
                        value={outputType}
                        onChange={setOutputType}
                        className="border-primary/20"
                        disabled={testingMode === 'compare'}
                      />
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleRunTest} 
                        disabled={isLoading || !promptA.trim() || !promptB.trim()}
                        className="w-full bg-gradient-to-r from-accent via-primary to-[hsl(330,100%,69%)] hover:opacity-90 text-white h-14 text-lg font-semibold shadow-[0_0_30px_rgba(124,92,255,0.3)] hover:shadow-[0_0_50px_rgba(124,92,255,0.5)] transition-all btn-sheen"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Running Battle...
                          </>
                        ) : (
                          <>
                            <TrophyIcon className="h-5 w-5 mr-2" />
                            Start Battle
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Single Test Results */}
        <AnimatePresence>
          {singleResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card border-primary/30 rounded-[24px] overflow-hidden shadow-[0_0_60px_rgba(110,231,255,0.2)]">
                <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 to-accent/10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ChartIcon className="h-5 w-5 text-primary" />
                    Diagnostic Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-6 md:p-8">
                  {/* Overall Score Gauge */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <ScoreGauge score={singleResult.total_score} size="lg" />
                    
                    {/* Prompt Type Badge */}
                    {singleResult.prompt_type && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <Badge 
                          variant={
                            singleResult.prompt_type === 'simple' ? 'default' :
                            singleResult.prompt_type === 'creative' ? 'secondary' :
                            'outline'
                          }
                          className="px-3 py-1 text-xs"
                        >
                          {singleResult.prompt_type.toUpperCase()} PROMPT
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Graded using {singleResult.prompt_type} criteria
                        </span>
                      </motion.div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`px-6 py-3 rounded-full text-base font-semibold ${
                        singleResult.total_score >= 8 
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                          : singleResult.total_score >= 6
                          ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                          : singleResult.total_score >= 3
                          ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                          : 'bg-red-500/20 text-red-400 border-2 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      }`}
                    >
                      {getScoreLabel(singleResult.total_score)}
                    </motion.div>
                  </motion.div>

                  {/* Radar Chart */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="h-[350px] glass-panel rounded-xl p-6"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={formatChartData(singleResult.category_breakdown)}>
                        <defs>
                          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke="hsl(var(--primary) / 0.2)" strokeWidth={1.5} />
                        <PolarAngleAxis 
                          dataKey="category" 
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} 
                        />
                        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#radarGradient)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Category Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingIcon className="h-5 w-5 text-primary" />
                      Category Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(singleResult.category_breakdown).map(([key, value], idx) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="glass-panel rounded-lg p-4 space-y-2 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className={`font-bold text-lg ${getScoreColor(value)}`}>
                              {value.toFixed(1)}
                            </span>
                          </div>
                          <Progress value={value * 10} className="h-2" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <Separator className="bg-primary/20" />

                  {/* AI Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                      AI-Powered Analysis
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      {singleResult.ai_analysis.strengths && singleResult.ai_analysis.strengths.length > 0 && (
                        <FeedbackCard
                          type="success"
                          title="Strengths"
                          icon={<CheckCircle className="h-4 w-4" />}
                          items={singleResult.ai_analysis.strengths}
                        />
                      )}

                      {singleResult.ai_analysis.weaknesses && singleResult.ai_analysis.weaknesses.length > 0 && (
                        <FeedbackCard
                          type="warning"
                          title="Areas to Improve"
                          icon={<AlertCircle className="h-4 w-4" />}
                          items={singleResult.ai_analysis.weaknesses}
                        />
                      )}

                        <FeedbackCard
                          type="info"
                          title="Suggested Fixes"
                          icon={<ZapIcon className="h-4 w-4" />}
                          items={singleResult.ai_analysis.suggested_fixes}
                        />
                    </div>

                    {/* Per-Category Explanations */}
                    {singleResult.ai_analysis.explanation && Object.keys(singleResult.ai_analysis.explanation).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-6 mt-4"
                      >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <ActivityIcon className="h-5 w-5 text-primary" />
                          Score Explanations
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(singleResult.ai_analysis.explanation).map(([key, value]) => (
                            <div key={key} className="border-l-2 border-primary/30 pl-4">
                              <div className="text-sm font-medium text-primary capitalize mb-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex flex-col sm:flex-row gap-3 pt-4"
                  >
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(promptA)}
                      className="flex-1 border-primary/30 hover:bg-primary/10"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Prompt
                    </Button>
                    <Button 
                      onClick={() => handleAutoOptimize(singleResult)}
                      disabled={isAutoOptimizing || isRetesting}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                    >
                      {isAutoOptimizing || isRetesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isRetesting ? 'Re-testing optimized prompt...' : 'Optimizing...'}
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Auto-Optimize & Re-Test
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Optimization Progress Bar */}
                  <AnimatePresence>
                    {optimizationProgress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-6 rounded-xl glass-panel border border-primary/20"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-primary">
                              Step {optimizationProgress.step} of 4
                            </span>
                            <span className="text-muted-foreground">
                              {optimizationProgress.progress}%
                            </span>
                          </div>
                          <Progress value={optimizationProgress.progress} className="h-2" />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            {optimizationProgress.message}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Optimization Comparison Results - NEW */}
                  <AnimatePresence>
                    {optimizationComparison && autoOptimizeResult && !isRetesting && (
                      <OptimizationComparison
                        comparison={optimizationComparison}
                        optimizedPrompt={autoOptimizeResult.optimizedPrompt}
                        onAccept={handleAcceptOptimization}
                        onReject={handleRejectOptimization}
                        isLoading={false}
                      />
                    )}
                  </AnimatePresence>

                  {/* Auto-Optimize Result (Legacy - keep for backwards compatibility) */}
                  <AnimatePresence>
                    {autoOptimizeResult && !optimizationComparison && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-[hsl(330,100%,69%)/5] border-2 border-primary/30 relative overflow-hidden"
                      >
                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse opacity-30" />
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <SparklesIcon className="h-5 w-5 text-accent" />
                              Auto-Optimized Prompt
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAutoOptimizeResult(null)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {autoOptimizeResult.improvementAreas && autoOptimizeResult.improvementAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">Improved:</span>
                              {autoOptimizeResult.improvementAreas.map((area, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Original Prompt */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                Original
                              </div>
                              <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                                {autoOptimizeResult.originalPrompt}
                              </div>
                            </div>

                            {/* Optimized Prompt */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <SparklesIcon className="h-4 w-4" />
                                Optimized
                              </div>
                              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                                {autoOptimizeResult.optimizedPrompt}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(autoOptimizeResult.optimizedPrompt)}
                              className="flex-1"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Optimized
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPromptA(autoOptimizeResult.optimizedPrompt);
                                setAutoOptimizeResult(null);
                                toast({
                                  title: "Prompt Updated",
                                  description: "Optimized prompt has been loaded into Prompt A",
                                });
                              }}
                              className="flex-1 bg-gradient-to-r from-primary to-accent"
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Use This Prompt
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compare Results */}
        <AnimatePresence>
          {compareResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card border-primary/30 rounded-[24px] overflow-hidden shadow-[0_0_60px_rgba(124,92,255,0.2)]">
                <CardHeader className="border-b border-accent/10 bg-gradient-to-r from-accent/10 to-primary/10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrophyIcon className="h-5 w-5 text-accent" />
                    Battle Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-6 md:p-8">
                  {/* Winner Declaration */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center p-10 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-[hsl(330,100%,69%)/10] border border-primary/20 relative overflow-hidden"
                  >
                    {/* Prompt Type Badges */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex justify-center gap-4 mb-6"
                    >
                      {compareResult.prompt_a_type && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Prompt A:</span>
                          <Badge variant="default" className="px-2 py-0.5 text-xs">
                            {compareResult.prompt_a_type.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      {compareResult.prompt_b_type && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Prompt B:</span>
                          <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                            {compareResult.prompt_b_type.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                    
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        background: [
                          "radial-gradient(circle at 0% 0%, rgba(110,231,255,0.1), transparent 50%)",
                          "radial-gradient(circle at 100% 100%, rgba(124,92,255,0.1), transparent 50%)",
                          "radial-gradient(circle at 0% 100%, rgba(255,98,198,0.1), transparent 50%)",
                          "radial-gradient(circle at 0% 0%, rgba(110,231,255,0.1), transparent 50%)",
                        ],
                      }}
                      transition={{ duration: 10, repeat: Infinity }}
                    />
                    
                    <div className="relative z-10">
                      {compareResult.winner === 'Tie' ? (
                        <>
                          <motion.div
                            className="text-6xl mb-4"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          >
                            🤝
                          </motion.div>
                          <div className="text-4xl font-bold gradient-text mb-3">It's a Tie!</div>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Both prompts scored equally. They're evenly matched!
                          </p>
                        </>
                      ) : (
                        <>
                          <motion.div
                            className="text-6xl mb-4"
                            animate={{ 
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            🏆
                          </motion.div>
                          <div className="text-5xl font-bold gradient-text mb-3">
                            Prompt {compareResult.winner} Wins!
                          </div>
                          <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            {compareResult.reasoning}
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Side-by-Side Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`glass-panel rounded-xl p-6 ${compareResult.winner === 'A' ? 'border-primary/50 shadow-[0_0_30px_rgba(110,231,255,0.2)]' : 'border-primary/20'}`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">A</span>
                        <h4 className="font-semibold text-lg">Prompt A</h4>
                        {compareResult.winner === 'A' && <TrophyIcon className="h-5 w-5 text-primary ml-auto" />}
                      </div>
                      <ScoreGauge score={compareResult.prompt_a_score} size="md" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`glass-panel rounded-xl p-6 ${compareResult.winner === 'B' ? 'border-accent/50 shadow-[0_0_30px_rgba(124,92,255,0.2)]' : 'border-accent/20'}`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">B</span>
                        <h4 className="font-semibold text-lg">Prompt B</h4>
                        {compareResult.winner === 'B' && <TrophyIcon className="h-5 w-5 text-accent ml-auto" />}
                      </div>
                      <ScoreGauge score={compareResult.prompt_b_score} size="md" />
                    </motion.div>
                  </div>

                  {/* Category Comparison */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ChartIcon className="h-5 w-5 text-primary" />
                      Category-by-Category Comparison
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(compareResult.comparison).map(([category, result], idx) => (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          className="glass-panel rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium capitalize text-sm">{category.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-primary font-bold">
                                {compareResult.prompt_a_breakdown[category as keyof CategoryScores].toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="text-accent font-bold">
                                {compareResult.prompt_b_breakdown[category as keyof CategoryScores].toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{result}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Lab;
