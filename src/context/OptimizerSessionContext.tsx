import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePromptData } from '@/context/PromptDataContext';

export type OptimizationMode = 'speed' | 'deep';

export interface OptimizerPayload {
  originalPrompt: string;
  taskDescription: string;
  aiProvider: string;
  modelName: string;
  outputType: string;
  variants: number;
  maxTokens: number;
  temperature: number;
  influence: string;
  influenceWeight: number;
  mode: OptimizationMode;
}

export interface OptimizationResult {
  promptId: string;
  originalPrompt: string;
  bestOptimizedPrompt: string;
  bestScore: number;
  variants: any[];
  summary?: any;
}

interface OptimizerSessionState {
  isOptimizing: boolean;
  optimizationStartTime: number | null;
  payload: OptimizerPayload | null;
  result: OptimizationResult | null;
  speedResult: any | null;
  error: string | null;
}

interface OptimizerSessionContextValue extends OptimizerSessionState {
  startOptimization: (payload: OptimizerPayload, opts?: { resume?: boolean }) => Promise<void>;
  setIsOptimizing: React.Dispatch<React.SetStateAction<boolean>>;
  setResult: React.Dispatch<React.SetStateAction<OptimizationResult | null>>;
  setSpeedResult: React.Dispatch<React.SetStateAction<any | null>>;
}

const OptimizerSessionContext = createContext<OptimizerSessionContextValue | undefined>(undefined);

export const OptimizerSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { addPromptToHistory } = usePromptData();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(() => localStorage.getItem('promptOptimizer_isOptimizing') === 'true');
  const [optimizationStartTime, setOptimizationStartTime] = useState<number | null>(() => {
    const v = localStorage.getItem('promptOptimizer_startTime');
    return v ? parseInt(v) : null;
  });
  const [payload, setPayload] = useState<OptimizerPayload | null>(() => {
    const v = localStorage.getItem('promptOptimizer_payload');
    return v ? JSON.parse(v) : null;
  });
  const [result, setResult] = useState<OptimizationResult | null>(() => {
    const v = localStorage.getItem('promptOptimizer_result');
    return v ? JSON.parse(v) : null;
  });
  const [speedResult, setSpeedResult] = useState<any | null>(() => {
    const v = localStorage.getItem('promptOptimizer_speedResult');
    return v ? JSON.parse(v) : null;
  });
  const [error, setError] = useState<string | null>(null);

  const runningRef = useRef(false);

  // Reset all state when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      
      // If user changed, clear all optimizer state
      if (currentUserId && newUserId !== currentUserId) {
        console.log('User changed, clearing optimizer session');
        setIsOptimizing(false);
        setOptimizationStartTime(null);
        setPayload(null);
        setResult(null);
        setSpeedResult(null);
        setError(null);
        runningRef.current = false;
      }
      
      setCurrentUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, [currentUserId]);

  // Persist session to localStorage
  useEffect(() => {
    localStorage.setItem('promptOptimizer_isOptimizing', isOptimizing.toString());
    if (isOptimizing && !optimizationStartTime) {
      const start = Date.now();
      setOptimizationStartTime(start);
      localStorage.setItem('promptOptimizer_startTime', String(start));
    }
    if (!isOptimizing) {
      localStorage.removeItem('promptOptimizer_startTime');
      setOptimizationStartTime(null);
    }
  }, [isOptimizing]);

  useEffect(() => {
    if (payload) localStorage.setItem('promptOptimizer_payload', JSON.stringify(payload));
    else localStorage.removeItem('promptOptimizer_payload');
  }, [payload]);

  useEffect(() => {
    if (result) localStorage.setItem('promptOptimizer_result', JSON.stringify(result));
    else localStorage.removeItem('promptOptimizer_result');
  }, [result]);

  useEffect(() => {
    if (speedResult) localStorage.setItem('promptOptimizer_speedResult', JSON.stringify(speedResult));
    else localStorage.removeItem('promptOptimizer_speedResult');
  }, [speedResult]);

  const appendToHistory = useCallback(async (data: any, provider: string, modelName: string, outputType: string, originalPrompt: string) => {
    try {
      const bestVariant = data?.variants?.reduce((best: any, current: any) => {
        return (!best || (current.score > best.score)) ? current : best;
      }, null);

      // Generate unique ID for each optimization run
      const uniqueId = `${data?.promptId || 'local'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const historyItem = {
        id: uniqueId,
        title: `${provider} ${modelName} Optimization`,
        description: `${(data?.bestScore ?? 0) >= 0.8 ? 'High-performance' : (data?.bestScore ?? 0) >= 0.6 ? 'Good-quality' : (data?.bestScore ?? 0) >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
        prompt: data?.originalPrompt || originalPrompt,
        output: data?.bestOptimizedPrompt || data?.variants?.[0]?.prompt || '',
        sampleOutput: bestVariant?.actualOutput || data?.bestActualOutput || '',
        provider,
        outputType: outputType || 'Code',
        score: data?.bestScore ?? 0,
        timestamp: new Date().toLocaleString(),
        tags: [provider?.toLowerCase?.() || 'provider', (modelName || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
        isFavorite: false,
        isBestVariant: true,
      } as const;
      
      await addPromptToHistory(historyItem as any);
    } catch (e) {
      console.error('Failed to append to local history', e);
    }
  }, [addPromptToHistory]);

  const startOptimization = useCallback(async (p: OptimizerPayload, opts?: { resume?: boolean }) => {
    if (runningRef.current) return; // prevent duplicate calls
    
    // If resuming, first check if we already have results stored that came in while away
    if (opts?.resume) {
      const storedResult = localStorage.getItem(`promptOptimizer_result_${p.mode}`);
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult);
          console.log('Found completed results from background optimization');
          if (p.mode === 'speed') {
            setSpeedResult(parsedResult);
          } else {
            setResult(parsedResult);
          }
          // Also append to history when resuming
          await appendToHistory(parsedResult, p.aiProvider, p.modelName, p.outputType, p.originalPrompt);
          // Clear stored result to avoid duplicate history on next load
          localStorage.removeItem(`promptOptimizer_result_${p.mode}`);
          setIsOptimizing(false);
          runningRef.current = false;
          return;
        } catch (e) {
          console.error('Error parsing stored result:', e);
        }
      }
    }
    
    runningRef.current = true;
    setError(null);
    setPayload(p);
    setIsOptimizing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          originalPrompt: p.originalPrompt,
          taskDescription: p.taskDescription,
          aiProvider: p.aiProvider,
          modelName: p.modelName,
          outputType: p.outputType,
          variants: p.variants,
          userId: user.id,
          maxTokens: p.maxTokens,
          temperature: p.temperature,
          influence: p.influence,
          influenceWeight: p.influenceWeight,
          mode: p.mode,
        }
      });

      if (error) throw error;

      if (p.mode === 'speed') {
        console.log('Speed optimization completed:', data);
        setSpeedResult(data);
        // Store result for background completion detection
        localStorage.setItem(`promptOptimizer_result_${p.mode}`, JSON.stringify(data));
      } else {
        console.log('Deep optimization completed:', data);
        setResult(data);
        // Store result for background completion detection
        localStorage.setItem(`promptOptimizer_result_${p.mode}`, JSON.stringify(data));
      }

      await appendToHistory(data, p.aiProvider, p.modelName, p.outputType, p.originalPrompt);

      // Clear draft prompt fields after success, but keep results for viewing
      localStorage.removeItem('promptOptimizer_originalPrompt');
      localStorage.removeItem('promptOptimizer_taskDescription');

      if (!opts?.resume) {
        // Only toast when user initiated, not on resume
        toast({ title: 'Success', description: `Prompt optimized successfully using ${p.mode} mode!` });
      }
    } catch (err: any) {
      console.error('Error optimizing prompt:', err);
      setError(err?.message || 'Unknown error');
      toast({ title: 'Error', description: 'Failed to optimize prompt. Please try again.', variant: 'destructive' });
    } finally {
      setIsOptimizing(false);
      runningRef.current = false;
    }
  }, [appendToHistory, toast]);

  // Resume on load if we were optimizing and have payload but no results
  useEffect(() => {
    if (isOptimizing && payload && !result && !speedResult && !runningRef.current) {
      console.log('Resuming background optimization...');
      // Check if optimization actually completed while away
      setTimeout(() => {
        if (runningRef.current) {
          console.log('Still running, will continue...');
        } else {
          console.log('Attempting to resume optimization');
          startOptimization(payload, { resume: true });
        }
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety: timeout long-running sessions
  useEffect(() => {
    const checkStale = () => {
      if (isOptimizing && optimizationStartTime) {
        const elapsed = Date.now() - optimizationStartTime;
        if (elapsed > 5 * 60 * 1000) {
          setIsOptimizing(false);
          localStorage.removeItem('promptOptimizer_isOptimizing');
          localStorage.removeItem('promptOptimizer_startTime');
          toast({ title: 'Optimization Timeout', description: 'The previous optimization took too long and was cancelled. Please try again.', variant: 'destructive' });
        }
      }
    };

    const id = setInterval(checkStale, 30000);
    return () => clearInterval(id);
  }, [isOptimizing, optimizationStartTime, toast]);

  const value: OptimizerSessionContextValue = {
    isOptimizing,
    optimizationStartTime,
    payload,
    result,
    speedResult,
    error,
    startOptimization,
    setIsOptimizing,
    setResult,
    setSpeedResult,
  };

  return (
    <OptimizerSessionContext.Provider value={value}>
      {children}
    </OptimizerSessionContext.Provider>
  );
};

export const useOptimizerSession = () => {
  const ctx = useContext(OptimizerSessionContext);
  if (!ctx) throw new Error('useOptimizerSession must be used within OptimizerSessionProvider');
  return ctx;
};
