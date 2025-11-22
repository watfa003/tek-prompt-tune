import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressBarWithETAProps {
  sessionKey: string;
  userId: string;
  onComplete?: () => void;
  mode?: 'speed' | 'deep';
  className?: string;
}

interface ProgressData {
  progress: number;
  step: number;
  message: string;
  updated_at: string;
  created_at: string;
}

export const ProgressBarWithETA: React.FC<ProgressBarWithETAProps> = ({
  sessionKey,
  userId,
  onComplete,
  mode = 'deep',
  className = '',
}) => {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [status, setStatus] = useState<string>('starting');
  const [message, setMessage] = useState('Starting optimization...');
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();

  // Fetch progress from database (single source of truth)
  const fetchProgress = useCallback(async () => {
    if (!sessionKey || !userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('optimization_progress')
        .select('*')
        .eq('session_key', sessionKey)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching progress:', fetchError);
        return;
      }

      if (data) {
        updateProgressState(data as ProgressData);
      }
    } catch (err) {
      console.error('Fetch progress exception:', err);
    }
  }, [sessionKey, userId]);

  // Update progress state using ONLY backend values
  const updateProgressState = useCallback(
    (data: ProgressData) => {
      const newProgress = Math.min(100, Math.max(0, data.progress));
      const now = Date.now();

      // Only allow progress to move forward (monotonic), but never fake it
      setProgress((prev) => {
        if (newProgress < prev && prev < 100) {
          console.warn(`Ignoring backward progress: ${prev}% -> ${newProgress}%`);
          return prev;
        }
        return newProgress;
      });

      const inferredStatus =
        newProgress >= 100 ? 'completed' : newProgress > 0 ? 'processing' : 'pending';
      setStatus(inferredStatus);
      setMessage(data.message || 'Processing...');
      lastUpdateTimeRef.current = now;

      if (newProgress >= 100) {
        setProgress(100);
        setDisplayProgress(100);
        setStatus('completed');

        setTimeout(() => {
          onComplete?.();
        }, 500);
      }

      console.log('Progress updated from backend:', {
        progress: newProgress,
        inferredStatus,
        message: data.message,
      });
    },
    [onComplete]
  );

  // Smooth animation for display progress (visual only, does NOT invent progress)
  useEffect(() => {
    const animate = () => {
      setDisplayProgress((current) => {
        const diff = progress - current;

        if (Math.abs(diff) < 0.5) {
          return progress;
        }

        const increment = diff * 0.15;
        return current + increment;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress]);

  // Set up realtime subscription + polling fallback
  useEffect(() => {
    if (!sessionKey || !userId) {
      return;
    }

    console.log('Setting up realtime subscription for session:', sessionKey);
    lastUpdateTimeRef.current = Date.now();

    // Initial fetch so first click immediately shows real progress
    fetchProgress();

    const channel = supabase
      .channel(`progress-${sessionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'optimization_progress',
          filter: `session_key=eq.${sessionKey}`,
        },
        (payload: any) => {
          console.log('Realtime update received:', payload);

          if (payload.new && payload.new.user_id === userId) {
            updateProgressState(payload.new as ProgressData);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);

        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to realtime updates, using fallback polling');
          setError('Connection issue detected, using fallback mode');
        }
      });

    channelRef.current = channel;

    // Polling fallback every 1s to keep in sync with backend
    pollingIntervalRef.current = setInterval(() => {
      fetchProgress();
    }, 1000);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sessionKey, userId, fetchProgress, updateProgressState]);

  // If backend marks status as completed but progress isn't 100 yet, trust backend state
  useEffect(() => {
    if (status === 'completed' && progress < 100) {
      console.log('Forcing progress to 100 (status is completed from backend)');
      setProgress(100);
      setDisplayProgress(100);
    }
  }, [status, progress]);

  const roundedProgress = Math.round(displayProgress);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`space-y-3 ${className}`}
      >
        {/* Progress Bar */}
        <div className="relative">
          <Progress value={roundedProgress} className="h-3 transition-all duration-300" />

          {/* Percentage Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground mix-blend-difference">
              {roundedProgress}%
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <motion.div
            animate={{ rotate: status === 'completed' ? 0 : 360 }}
            transition={{
              repeat: status === 'completed' ? 0 : Infinity,
              duration: 2,
              ease: 'linear',
            }}
          >
            <div className="h-2 w-2 rounded-full bg-primary" />
          </motion.div>
          <span>{message}</span>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
