import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PromptHistoryItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  output: string;
  sampleOutput?: string;
  provider: string;
  outputType: string;
  score: number;
  timestamp: string;
  tags: string[];
  isFavorite: boolean;
  isBestVariant?: boolean;
}

interface PromptDataContextValue {
  historyItems: PromptHistoryItem[];
  analytics: any;
  loading: boolean;
  toggleFavorite: (id: string) => Promise<void>;
  addPromptToHistory: (item: PromptHistoryItem) => Promise<void>;
  hasLocalChanges: boolean;
}

const PromptDataContext = createContext<PromptDataContextValue | null>(null);

export const PromptDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pendingQueue, setPendingQueue] = useState<PromptHistoryItem[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const initializedRef = useRef(false);

  // Cache management
  const CACHE_VERSION = 'v2';
  const loadFromCache = useCallback((userId: string, key: string) => {
    try {
      const cached = localStorage.getItem(`prompt_data_${CACHE_VERSION}_${userId}_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache load error:', error);
      return null;
    }
  }, []);

  const saveToCache = useCallback((userId: string, key: string, data: any) => {
    try {
      localStorage.setItem(`prompt_data_${CACHE_VERSION}_${userId}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache save error:', error);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Try to load from cache first
      const cachedAnalytics = loadFromCache(user.user.id, 'analytics');
      if (cachedAnalytics) {
        setAnalytics(cachedAnalytics);
      }

      // Calculate analytics from recent prompts
      const { data: prompts } = await supabase
        .from('prompts')
        .select('score, created_at, ai_provider, model_name, status')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (prompts) {
        // Calculate provider statistics
        const providerStats: Record<string, any> = {};
        prompts.forEach(p => {
          if (p.ai_provider) {
            if (!providerStats[p.ai_provider]) {
              providerStats[p.ai_provider] = { scores: [], count: 0 };
            }
            providerStats[p.ai_provider].scores.push(p.score || 0);
            providerStats[p.ai_provider].count++;
          }
        });

        // Calculate average scores for each provider
        Object.keys(providerStats).forEach(provider => {
          const stats = providerStats[provider];
          stats.avgScore = stats.scores.length > 0 
            ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length 
            : 0;
        });

        const analytics = {
          overview: {
            totalPrompts: prompts.length,
            completedPrompts: prompts.filter(p => p.status === 'completed').length,
            averageScore: prompts.length > 0 ? prompts.reduce((sum, p) => sum + (p.score || 0), 0) / prompts.length : 0,
            totalOptimizations: prompts.length,
            totalChatSessions: 0, // Would need to be calculated from chat_sessions table
            totalTokensUsed: 0, // Would need to be calculated from token usage
            successRate: prompts.length > 0 ? (prompts.filter(p => p.status === 'completed').length / prompts.length) * 100 : 0,
          },
          usage: {
            providerStats
          },
          performance: {
            dailyStats: [], // Could be calculated from prompts
            improvementTrend: 'stable', // Default value
            scoreDistribution: {
              excellent: prompts.filter(p => (p.score || 0) >= 0.8).length,
              good: prompts.filter(p => (p.score || 0) >= 0.6 && (p.score || 0) < 0.8).length,
              average: prompts.filter(p => (p.score || 0) >= 0.4 && (p.score || 0) < 0.6).length,
              poor: prompts.filter(p => (p.score || 0) < 0.4).length,
            },
            averageScore: prompts.length > 0 ? prompts.reduce((sum, p) => sum + (p.score || 0), 0) / prompts.length : 0,
          },
          engagement: {
            chatSessions: 0, // Would need to be calculated from chat_sessions table
            avgMessagesPerSession: 0,
            activePrompts: prompts.filter(p => p.status === 'completed').length,
          },
          insights: [], // Default empty array for insights
          recentActivity: prompts.slice(0, 10).map((p, i) => ({
            id: p.ai_provider + i,
            type: 'prompt_optimization',
            score: p.score || 0,
            provider: p.ai_provider,
            model: p.model_name,
            createdAt: p.created_at,
            status: p.status || 'completed',
          })),
        };
        
        setAnalytics(analytics);
        saveToCache(user.user.id, 'analytics', analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [loadFromCache, saveToCache]);

  // Load initial data from Supabase with full prompt data
  const loadInitialData = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load cached data instantly for immediate display
      const cachedHistory = loadFromCache(user.user.id, 'history') as PromptHistoryItem[] | null;
      const cachedFavorites = loadFromCache(user.user.id, 'favorites') as string[] | null;
      
      if (cachedHistory) {
        setHistoryItems(cachedHistory);
        console.log('Loaded cached history:', cachedHistory.length);
      }
      
      if (cachedFavorites) {
        setFavoriteIds(new Set(cachedFavorites));
      }

      // Fetch recent prompts with full data from Supabase
      const { data: prompts, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (promptsError) throw promptsError;

      // Fetch optimization history for sample outputs
      const promptIds = prompts?.map(p => p.id) || [];
      const { data: optimizations, error: optError } = await supabase
        .from('optimization_history')
        .select('*')
        .in('prompt_id', promptIds)
        .order('score', { ascending: false });

      if (optError) console.warn('Could not fetch optimizations:', optError);

      // Map prompts to history items with sample output
      const historyItems: PromptHistoryItem[] = prompts?.map((prompt) => {
        // Find the best optimization result for sample output
        const bestOpt = optimizations?.find(opt => opt.prompt_id === prompt.id);
        
        return {
          id: prompt.id,
          title: `${prompt.ai_provider} ${prompt.model_name} Optimization`,
          description: `${prompt.score >= 0.8 ? 'High-performance' : prompt.score >= 0.6 ? 'Good-quality' : prompt.score >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
          prompt: prompt.original_prompt,
          output: prompt.optimized_prompt || 'Optimization in progress...',
          sampleOutput: bestOpt?.ai_response || undefined,
          provider: prompt.ai_provider,
          outputType: prompt.output_type || 'Code',
          score: prompt.score || 0,
          timestamp: new Date(prompt.created_at).toLocaleString(),
          tags: [prompt.ai_provider?.toLowerCase?.() || 'provider', (prompt.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
          isFavorite: false,
          isBestVariant: false, // Only set to true when explicitly marked as best by AI
        };
      }) || [];

      console.log('Loaded history items from Supabase:', historyItems.length);
      setHistoryItems(historyItems);
      saveToCache(user.user.id, 'history', historyItems);
      
      // Load favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.user.id);

      if (favorites) {
        const favoriteIds = new Set(favorites.map(f => f.item_id));
        setFavoriteIds(favoriteIds);
        saveToCache(user.user.id, 'favorites', Array.from(favoriteIds));
        
        // Update history items with favorite status
        setHistoryItems(prev => prev.map(item => ({
          ...item,
          isFavorite: favoriteIds.has(item.id)
        })));
      }
      
      // Load analytics
      await loadAnalytics();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [loadFromCache, saveToCache, loadAnalytics]);

  // Add prompt to history
  const addPromptToHistory = useCallback(async (item: PromptHistoryItem) => {
    try {
      // Add to state and cache immediately (local-first)
      setHistoryItems((prev) => {
        const exists = prev.some(h => h.id === item.id);
        if (exists) return prev;
        const updated = [item, ...prev];
        
        // Save to cache async
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) saveToCache(user.id, 'history', updated);
        });
        
        return updated;
      });
      
      console.log('Added prompt to local history:', item.title);
      setHasLocalChanges(true);
    } catch (error) {
      console.error('Error adding to history:', error);
      // Queue for retry
      setPendingQueue(prev => [...prev, item]);
    }
  }, [saveToCache]);

  // Retry queued prompts
  const retryQueuedPrompts = useCallback(async () => {
    if (pendingQueue.length === 0) return;
    
    console.log('Retrying queued prompts:', pendingQueue.length);
    const successful: string[] = [];
    
    for (const item of pendingQueue) {
      try {
        await addPromptToHistory(item);
        successful.push(item.id);
      } catch (error) {
        console.error('Retry failed for:', item.id, error);
      }
    }
    
    // Remove successful items from queue
    setPendingQueue(prev => prev.filter(item => !successful.includes(item.id)));
  }, [pendingQueue, addPromptToHistory]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const isCurrentlyFavorited = favoriteIds.has(id);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.user.id)
          .eq('item_id', id);
        
        const newFavoriteIds = new Set(favoriteIds);
        newFavoriteIds.delete(id);
        setFavoriteIds(newFavoriteIds);
      } else {
        // Add to favorites - determine item type
        const historyItem = historyItems.find(item => item.id === id);
        const itemType = historyItem?.provider === 'Optimization' ? 'optimization_history' : 'prompt';
        
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.user.id,
            item_id: id,
            item_type: itemType
          });
        
        const newFavoriteIds = new Set(favoriteIds);
        newFavoriteIds.add(id);
        setFavoriteIds(newFavoriteIds);
      }

      // Update local state and cache
      setHistoryItems((prev) => {
        const updated = prev.map((h) => (h.id === id ? { ...h, isFavorite: !isCurrentlyFavorited } : h));
        saveToCache(user.user.id, 'history', updated);
        return updated;
      });
      
      // Update favorites cache
      saveToCache(user.user.id, 'favorites', Array.from(favoriteIds));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favoriteIds, historyItems, saveToCache]);

  // Retry queued prompts on connection restore
  useEffect(() => {
    if (pendingQueue.length > 0) {
      retryQueuedPrompts();
    }
  }, [retryQueuedPrompts]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let promptsChannel: ReturnType<typeof supabase.channel> | undefined;
    let optimizationChannel: ReturnType<typeof supabase.channel> | undefined;

    const init = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setLoading(false);
          return;
        }

        // Load initial data
        await loadInitialData();

        // Set up real-time subscriptions
        promptsChannel = supabase
          .channel('provider-prompts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prompts' }, (payload) => {
            console.log('New prompt inserted:', payload.new);
            const np: any = payload.new;
            if (np.user_id !== user.user.id) return; // Guard
            
            const makeItem = (): PromptHistoryItem => ({
              id: np.id,
              title: `${np.ai_provider} ${np.model_name} Optimization`,
              description: `${np.score >= 0.8 ? 'High-performance' : np.score >= 0.6 ? 'Good-quality' : np.score >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
              prompt: np.original_prompt,
              output: np.optimized_prompt || 'Optimization in progress...',
              sampleOutput: undefined, // Will be populated when optimization_history is updated
              provider: np.ai_provider,
              outputType: np.output_type || 'Code',
              score: np.score || 0,
              timestamp: new Date(np.created_at).toLocaleString(),
              tags: [np.ai_provider?.toLowerCase?.() || 'provider', (np.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
              isFavorite: false,
              isBestVariant: false, // Only set when explicitly marked by the optimizer
            });
            
            let wasNew = false;
            setHistoryItems((prev) => {
              const idx = prev.findIndex(i => i.id === np.id);
              let updated: PromptHistoryItem[];
              if (idx === -1) {
                // New item
                wasNew = true;
                updated = [makeItem(), ...prev];
              } else {
                updated = prev.map((item, i) => i === idx ? { ...item, ...makeItem(), isFavorite: item.isFavorite, sampleOutput: item.sampleOutput } : item);
              }
              saveToCache(user.user.id, 'history', updated);
              console.log(idx === -1 ? 'Added new prompt to history:' : 'Updated prompt in history:', np.id);
              return updated;
            });

            // Update analytics
            setAnalytics((prev: any) => {
              if (!prev) return prev;
              const newActivity = {
                id: np.id,
                type: 'prompt_optimization',
                score: np.score || 0,
                provider: np.ai_provider,
                model: np.model_name,
                createdAt: np.created_at,
                status: np.status || 'completed',
              };
              const updated = {
                ...prev,
                overview: {
                  ...prev.overview,
                  totalPrompts: (prev.overview?.totalPrompts || 0) + 1,
                  completedPrompts: (np.status === 'completed') ? (prev.overview?.completedPrompts || 0) + 1 : (prev.overview?.completedPrompts || 0),
                },
                recentActivity: [newActivity, ...(prev.recentActivity || [])].slice(0, 10),
              };
              saveToCache(user.user.id, 'analytics', updated);
              return updated;
            });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prompts' }, (payload) => {
            console.log('Prompt updated:', payload.new);
            const np: any = payload.new;
            if (np.user_id !== user.user.id) return; // Guard
            
            const makeItem = (): PromptHistoryItem => ({
              id: np.id,
              title: `${np.ai_provider} ${np.model_name} Optimization`,
              description: `${np.score >= 0.8 ? 'High-performance' : np.score >= 0.6 ? 'Good-quality' : np.score >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
              prompt: np.original_prompt,
              output: np.optimized_prompt || 'Optimization in progress...',
              provider: np.ai_provider,
              outputType: np.output_type || 'Code',
              score: np.score || 0,
              timestamp: new Date(np.created_at).toLocaleString(),
              tags: [np.ai_provider?.toLowerCase?.() || 'provider', (np.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
              isFavorite: false,
              isBestVariant: false, // Only set when explicitly marked by the optimizer
            });
            
            let wasNew = false;
            setHistoryItems((prev) => {
              const idx = prev.findIndex(i => i.id === np.id);
              let updated: PromptHistoryItem[];
              if (idx === -1) {
                // We missed the INSERT; upsert on UPDATE
                wasNew = true;
                updated = [makeItem(), ...prev];
              } else {
                updated = prev.map((item, i) => i === idx ? { ...item, ...makeItem(), isFavorite: item.isFavorite, sampleOutput: item.sampleOutput } : item);
              }
              saveToCache(user.user.id, 'history', updated);
              console.log(idx === -1 ? 'Upserted missing prompt on UPDATE' : 'Patched prompt on UPDATE', np.id);
              return updated;
            });

            // Reflect changes in analytics (increment counts only if new)
            setAnalytics((prev: any) => {
              if (!prev) return prev;
              const newActivity = {
                id: np.id,
                type: 'prompt_optimization',
                score: np.score || 0,
                provider: np.ai_provider,
                model: np.model_name,
                createdAt: np.created_at,
                status: np.status || 'completed',
              };
              const updated = {
                ...prev,
                overview: {
                  ...prev.overview,
                  totalPrompts: (prev.overview?.totalPrompts || 0) + (wasNew ? 1 : 0),
                  completedPrompts: (prev.overview?.completedPrompts || 0) + (wasNew && np.status === 'completed' ? 1 : 0),
                },
                recentActivity: [newActivity, ...(prev.recentActivity || [])].slice(0, 10),
              };
              saveToCache(user.user.id, 'analytics', updated);
              return updated;
            });
          })
          .subscribe();

        optimizationChannel = supabase
          .channel('provider-optimizations')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'optimization_history' }, (payload) => {
            console.log('New optimization inserted:', payload.new);
            const no: any = payload.new;
            if (no.user_id !== user.user.id) return; // Guard
            
            // Update the corresponding prompt's sample output
            setHistoryItems((prev) => {
              const updated = prev.map(item => {
                if (item.id === no.prompt_id) {
                  // Only update if this is a better score or first sample output
                  if (!item.sampleOutput || (no.score && item.score && no.score >= item.score)) {
                    return {
                      ...item,
                      sampleOutput: no.ai_response || undefined
                    };
                  }
                }
                return item;
              });
              saveToCache(user.user.id, 'history', updated);
              console.log('Updated sample output for prompt:', no.prompt_id);
              return updated;
            });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'optimization_history' }, (payload) => {
            console.log('Optimization updated:', payload.new);
            const no: any = payload.new;
            if (no.user_id !== user.user.id) return; // Guard
            
            // Update the corresponding prompt's sample output if this is a better result
            setHistoryItems((prev) => {
              const updated = prev.map(item => {
                if (item.id === no.prompt_id) {
                  if (!item.sampleOutput || (no.score && no.score > (item.score || 0))) {
                    return {
                      ...item,
                      sampleOutput: no.ai_response || undefined
                    };
                  }
                }
                return item;
              });
              saveToCache(user.user.id, 'history', updated);
              return updated;
            });
          })
          .subscribe();
      } catch (err) {
        console.error('PromptDataProvider init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (promptsChannel) supabase.removeChannel(promptsChannel);
      if (optimizationChannel) supabase.removeChannel(optimizationChannel);
    };
  }, [loadFromCache, saveToCache, loadInitialData]);

  const value = useMemo(
    () => ({ historyItems, analytics, loading, toggleFavorite, addPromptToHistory, hasLocalChanges }),
    [historyItems, analytics, loading, toggleFavorite, addPromptToHistory, hasLocalChanges]
  );

  return <PromptDataContext.Provider value={value}>{children}</PromptDataContext.Provider>;
};

export const usePromptData = () => {
  const ctx = useContext(PromptDataContext);
  if (!ctx) throw new Error('usePromptData must be used within PromptDataProvider');
  return ctx;
};