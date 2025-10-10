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
  maxTokens: number | null;
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
    // Cancel any ongoing optimization and start fresh
    if (runningRef.current && !opts?.resume) {
      console.log('Canceling ongoing optimization to start new one');
      runningRef.current = false;
      setIsOptimizing(false);
      setResult(null);
      setSpeedResult(null);
      setError(null);
      // Clear any stored results from previous optimization
      localStorage.removeItem('promptOptimizer_result_speed');
      localStorage.removeItem('promptOptimizer_result_deep');
    }
    
    // If resuming, check BOTH localStorage AND database for results
    if (opts?.resume) {
      // First check localStorage
      const storedResult = localStorage.getItem(`promptOptimizer_result_${p.mode}`);
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult);
          console.log('Found completed results from localStorage');
          if (p.mode === 'speed') {
            setSpeedResult(parsedResult);
          } else {
            setResult(parsedResult);
          }
          await appendToHistory(parsedResult, p.aiProvider, p.modelName, p.outputType, p.originalPrompt);
          localStorage.removeItem(`promptOptimizer_result_${p.mode}`);
          setIsOptimizing(false);
          runningRef.current = false;
          return;
        } catch (e) {
          console.error('Error parsing stored result:', e);
        }
      }

      // If not in localStorage, check database for completed prompt
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Checking database for completed optimization...');
          const { data: completedPrompts } = await supabase
            .from('prompts')
            .select('*')
            .eq('user_id', user.id)
            .eq('original_prompt', p.originalPrompt)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);

          if (completedPrompts && completedPrompts.length > 0) {
            const dbPrompt = completedPrompts[0];
            console.log('✅ Found completed optimization in database!');
            
            // Reconstruct result object from database
            const dbResult = {
              promptId: dbPrompt.id,
              originalPrompt: dbPrompt.original_prompt,
              bestOptimizedPrompt: dbPrompt.optimized_prompt,
              bestScore: dbPrompt.score || 0,
              variants: [], // We don't store full variants in prompts table
              summary: dbPrompt.performance_metrics
            };

            if (p.mode === 'speed') {
              setSpeedResult(dbResult);
            } else {
              setResult(dbResult);
            }
            
            await appendToHistory(dbResult, p.aiProvider, p.modelName, p.outputType, p.originalPrompt);
            setIsOptimizing(false);
            runningRef.current = false;
            return;
          }
        }
      } catch (dbError) {
        console.error('Error checking database for results:', dbError);
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
      } else {
        console.log('Deep optimization completed:', data);
        setResult(data);
      }

      // CRITICAL: Await ALL async operations before clearing isOptimizing
      // This prevents the loading state from stopping prematurely
      try {
        await appendToHistory(data, p.aiProvider, p.modelName, p.outputType, p.originalPrompt);
      } catch (historyError) {
        console.error('Failed to append to history:', historyError);
        // Don't throw - we still want to show results even if history fails
      }
      
      // Now that all processing is done, store result for background completion detection
      localStorage.setItem(`promptOptimizer_result_${p.mode}`, JSON.stringify(data));

      // Clear draft prompt fields after success, but keep results for viewing
      localStorage.removeItem('promptOptimizer_originalPrompt');
      localStorage.removeItem('promptOptimizer_taskDescription');

      if (!opts?.resume) {
        // Only toast when user initiated, not on resume
        toast({ title: 'Success', description: `Prompt optimized successfully using ${p.mode} mode!` });
      }
      
      // CRITICAL: Only clear isOptimizing AFTER all async work is complete
      setIsOptimizing(false);
      runningRef.current = false;
    } catch (err: any) {
      console.error('Error optimizing prompt:', err);
      setError(err?.message || 'Unknown error');
      toast({ title: 'Error', description: 'Failed to optimize prompt. Please try again.', variant: 'destructive' });
      
      // Clear loading state on error
      setIsOptimizing(false);
      runningRef.current = false;
    }
  }, [appendToHistory, toast]);

  // Re-sync state on mount to check if results already exist
  useEffect(() => {
    const cachedSpeedResult = localStorage.getItem('promptOptimizer_result_speed');
    const cachedDeepResult = localStorage.getItem('promptOptimizer_result_deep');
    const isRunning = localStorage.getItem('promptOptimizer_isOptimizing');
    
    // If we already have results, force-finish the loading state
    if (cachedSpeedResult || cachedDeepResult) {
      try {
        if (cachedSpeedResult) {
          const parsed = JSON.parse(cachedSpeedResult);
          if (parsed?.bestOptimizedPrompt) {
            console.log('✅ Found completed speed result on mount - ending loading state');
            setIsOptimizing(false);
            setSpeedResult(parsed);
            localStorage.removeItem('promptOptimizer_result_speed');
          }
        }
        if (cachedDeepResult) {
          const parsed = JSON.parse(cachedDeepResult);
          if (parsed?.bestOptimizedPrompt) {
            console.log('✅ Found completed deep result on mount - ending loading state');
            setIsOptimizing(false);
            setResult(parsed);
            localStorage.removeItem('promptOptimizer_result_deep');
          }
        }
      } catch (e) {
        console.error('Error parsing cached results on mount:', e);
      }
    } else if (isRunning === 'true' && isOptimizing && payload && !result && !speedResult && !runningRef.current) {
      // Only show optimizing if nothing has completed yet
      console.log('Resume check: isOptimizing=true, checking for cached results...');
      
      // CRITICAL: Check localStorage for completed results FIRST before resuming
      const storedSpeedResult = localStorage.getItem(`promptOptimizer_result_speed`);
      const storedDeepResult = localStorage.getItem(`promptOptimizer_result_deep`);
      
      const hasStoredResult = (payload.mode === 'speed' && storedSpeedResult) || 
                              (payload.mode === 'deep' && storedDeepResult);
      
      if (hasStoredResult) {
        console.log('✅ Found completed results from background optimization, loading immediately');
        try {
          const storedData = payload.mode === 'speed' ? storedSpeedResult! : storedDeepResult!;
          const parsedResult = JSON.parse(storedData);
          
          // Set the result immediately
          if (payload.mode === 'speed') {
            setSpeedResult(parsedResult);
          } else {
            setResult(parsedResult);
          }
          
          // Add to history
          appendToHistory(parsedResult, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
          
          // Clean up localStorage
          localStorage.removeItem(`promptOptimizer_result_${payload.mode}`);
          
          // CRITICAL: Clear isOptimizing immediately to stop loading state
          console.log('✅ Clearing isOptimizing flag - results loaded from cache');
          setIsOptimizing(false);
          runningRef.current = false;
          
          return; // Exit early - don't resume
        } catch (e) {
          console.error('❌ Error parsing stored result:', e);
          // Fall through to resume logic if parsing fails
        }
      }
      
      // No stored results found, need to actually resume the API call
      console.log('⏳ No cached results, resuming optimization API call...');
      const timeoutId = setTimeout(() => {
        if (!runningRef.current) {
          startOptimization(payload, { resume: true });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (!isRunning || isRunning !== 'true') {
      // Ensure we're not stuck in loading state
      setIsOptimizing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety: timeout long-running sessions (2 minutes max)
  useEffect(() => {
    const checkStale = () => {
      // Do not enforce timeout while the tab is hidden to avoid false cancellations
      if (document.hidden) return;
      if (isOptimizing && optimizationStartTime) {
        const elapsed = Date.now() - optimizationStartTime;
        // Reduced to 2 minutes timeout for better UX
        if (elapsed > 2 * 60 * 1000) {
          console.warn('⚠️ Optimization timeout after 2 minutes - auto-clearing');
          setIsOptimizing(false);
          runningRef.current = false;
          localStorage.removeItem('promptOptimizer_isOptimizing');
          localStorage.removeItem('promptOptimizer_startTime');
          toast({ 
            title: 'Optimization Timeout', 
            description: 'The optimization took too long and was cancelled. Please try again.', 
            variant: 'destructive' 
          });
        }
      }
    };

    const id = setInterval(checkStale, 10000); // Check every 10 seconds
    return () => clearInterval(id);
  }, [isOptimizing, optimizationStartTime, toast]);

  // Phase 3: Add visibility change detection for background optimization safety
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isOptimizing && payload) {
        console.log('🔄 User returned to page - checking for background completion...');
        
        // Check if optimization completed while away
        const storedResult = localStorage.getItem(`promptOptimizer_result_${payload.mode}`);
        if (storedResult) {
          console.log('✅ Found background-completed results in localStorage');
          try {
            const parsedResult = JSON.parse(storedResult);
            
            setIsOptimizing(false);
            runningRef.current = false;
            
            if (payload.mode === 'speed') {
              setSpeedResult(parsedResult);
            } else {
              setResult(parsedResult);
            }
            
            appendToHistory(parsedResult, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
            localStorage.removeItem(`promptOptimizer_result_${payload.mode}`);
            return;
          } catch (e) {
            console.error('❌ Error parsing background result:', e);
          }
        }

        // Also check database for completed prompts
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('Checking database for completed optimization...');
            const { data: completedPrompts } = await supabase
              .from('prompts')
              .select('*')
              .eq('user_id', user.id)
              .eq('original_prompt', payload.originalPrompt)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1);

            if (completedPrompts && completedPrompts.length > 0) {
              const dbPrompt = completedPrompts[0];
              console.log('✅ Found completed optimization in database from background!');
              
              const dbResult = {
                promptId: dbPrompt.id,
                originalPrompt: dbPrompt.original_prompt,
                bestOptimizedPrompt: dbPrompt.optimized_prompt,
                bestScore: dbPrompt.score || 0,
                variants: [],
                summary: dbPrompt.performance_metrics
              };

              setIsOptimizing(false);
              runningRef.current = false;
              
              if (payload.mode === 'speed') {
                setSpeedResult(dbResult);
              } else {
                setResult(dbResult);
              }
              
              appendToHistory(dbResult, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
            }
          }
        } catch (dbError) {
          console.error('❌ Error checking database for background results:', dbError);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOptimizing, payload, appendToHistory]);

  // Cross-tab/background sync: react to localStorage updates from other tabs/windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      try {
        if (!e.key) return;
        if (payload && e.key === `promptOptimizer_result_${payload.mode}` && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.bestOptimizedPrompt) {
            console.log('📥 Storage event: loaded background result');
            setIsOptimizing(false);
            runningRef.current = false;
            if (payload.mode === 'speed') setSpeedResult(parsed); else setResult(parsed);
            appendToHistory(parsed, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
            localStorage.removeItem(`promptOptimizer_result_${payload.mode}`);
          }
        }
        if (e.key === 'promptOptimizer_isOptimizing' && e.newValue === 'false') {
          setIsOptimizing(false);
          runningRef.current = false;
        }
      } catch (err) {
        console.error('Error handling storage event:', err);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [payload, appendToHistory]);

  // Robust polling while optimizing: periodically check cache and DB so state never gets stuck
  useEffect(() => {
    if (!isOptimizing || !payload) return;

    let active = true;
    const check = async () => {
      if (!active) return;
      try {
        const key = `promptOptimizer_result_${payload.mode}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.bestOptimizedPrompt) {
            console.log('⏱️ Poll: found cached result, finalizing');
            setIsOptimizing(false);
            runningRef.current = false;
            if (payload.mode === 'speed') setSpeedResult(parsed); else setResult(parsed);
            appendToHistory(parsed, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
            localStorage.removeItem(key);
            return;
          }
        }
        // DB fallback
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: completedPrompts } = await supabase
            .from('prompts')
            .select('*')
            .eq('user_id', user.id)
            .eq('original_prompt', payload.originalPrompt)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);
          if (completedPrompts && completedPrompts.length > 0) {
            const dbPrompt = completedPrompts[0];
            const dbResult = {
              promptId: dbPrompt.id,
              originalPrompt: dbPrompt.original_prompt,
              bestOptimizedPrompt: dbPrompt.optimized_prompt,
              bestScore: dbPrompt.score || 0,
              variants: [],
              summary: dbPrompt.performance_metrics
            };
            console.log('⏱️ Poll: found DB-completed result, finalizing');
            setIsOptimizing(false);
            runningRef.current = false;
            if (payload.mode === 'speed') setSpeedResult(dbResult); else setResult(dbResult);
            appendToHistory(dbResult, payload.aiProvider, payload.modelName, payload.outputType, payload.originalPrompt);
            return;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // initial check + interval
    check();
    const id = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isOptimizing, payload, appendToHistory]);

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
