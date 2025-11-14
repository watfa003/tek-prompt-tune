import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressState {
  step: number;
  message: string;
  progress: number;
}

interface UseOptimizationProgressProps {
  sessionKey: string | null;
  userId: string | null;
  mode: 'speed' | 'deep';
  isActive: boolean;
}

interface UseOptimizationProgressReturn {
  displayedProgress: number;
  step: number;
  message: string;
  phase: string;
  indeterminate: boolean;
}

export const useOptimizationProgress = ({
  sessionKey,
  userId,
  mode,
  isActive,
}: UseOptimizationProgressProps): UseOptimizationProgressReturn => {
  const [dbProgress, setDbProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('Initializing...');
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(false);
  
  const lastDbUpdateRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const channelRef = useRef<any>(null);

  // Mode-aware total seconds
  const totalSeconds = mode === 'speed' ? 15 : 40;

  // Calculate perceived floor based on elapsed time
  const getPerceivedFloor = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const progress = elapsed / totalSeconds;
    
    if (mode === 'speed') {
      if (elapsed < 8) return Math.min(50, progress * 50 * 8);
      if (elapsed < 14) return 50 + Math.min(40, ((elapsed - 8) / 6) * 40);
      return 90;
    } else {
      if (elapsed < 18) return Math.min(50, (elapsed / 18) * 50);
      if (elapsed < 38) return 50 + Math.min(40, ((elapsed - 18) / 20) * 40);
      return 90;
    }
  }, [mode, totalSeconds]);

  // Get phase and message based on progress
  const getPhaseInfo = useCallback((progress: number) => {
    if (progress < 35) {
      return { phase: 'Creating variants...', step: 1 };
    } else if (progress < 90) {
      return { phase: 'Evaluating variants...', step: 2 };
    } else {
      return { phase: 'Finalizing...', step: 3 };
    }
  }, []);

  // Smooth animation loop
  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const perceivedFloor = getPerceivedFloor();
      const target = Math.min(95, Math.max(perceivedFloor, dbProgress));
      
      setDisplayedProgress(current => {
        const diff = target - current;
        const increment = diff * 0.1; // Ease-out
        const next = current + increment;
        
        // Only update if meaningful change
        if (Math.abs(diff) < 0.1) return current;
        return Math.min(95, Math.max(current, next));
      });

      // Check for stall
      const timeSinceLastUpdate = Date.now() - lastDbUpdateRef.current;
      setIndeterminate(timeSinceLastUpdate > 7000 && dbProgress < 90);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, dbProgress, getPerceivedFloor]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionKey || !userId || !isActive) {
      return;
    }

    startTimeRef.current = Date.now();
    lastDbUpdateRef.current = Date.now();

    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('optimization_progress')
        .select('*')
        .eq('session_key', sessionKey)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDbProgress(data.progress);
        setStep(data.step);
        setMessage(data.message);
        lastDbUpdateRef.current = Date.now();
      }
    };

    fetchInitial();

    // Set up realtime subscription
    const channel = supabase
      .channel(`optimization-progress-${sessionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'optimization_progress',
          filter: `session_key=eq.${sessionKey}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.user_id === userId) {
            const newProgress = payload.new.progress;
            
            // Only update if progress moves forward or message changes
            setDbProgress(current => Math.max(current, newProgress));
            setStep(payload.new.step);
            setMessage(payload.new.message);
            lastDbUpdateRef.current = Date.now();

            // Snap to 100 on completion
            if (newProgress >= 100) {
              setDisplayedProgress(100);
              setIndeterminate(false);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionKey, userId, isActive]);

  // Get current phase info
  const phaseInfo = getPhaseInfo(displayedProgress);
  const displayMessage = indeterminate && displayedProgress < 90
    ? `${phaseInfo.phase} (can take longer)`
    : message || phaseInfo.phase;

  return {
    displayedProgress: Math.round(displayedProgress),
    step: phaseInfo.step,
    message: displayMessage,
    phase: phaseInfo.phase,
    indeterminate,
  };
};
