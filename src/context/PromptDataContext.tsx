import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
  isBestVariant: boolean;
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

  // Local storage helpers
  const loadFromCache = useCallback((userId: string, key: string) => {
    try {
      const cached = localStorage.getItem(`prompt_cache_${userId}_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }, []);

  const saveToCache = useCallback((userId: string, key: string, data: any) => {
    try {
      localStorage.setItem(`prompt_cache_${userId}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Load analytics data from history items
  const loadAnalytics = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load cached analytics first
      const cached = loadFromCache(user.user.id, 'analytics');
      if (cached) {
        setAnalytics(cached);
      }

      // Calculate analytics from current history items
      if (historyItems.length > 0) {
        // Calculate score distribution
        const scoreDistribution = {
          excellent: historyItems.filter(item => item.score >= 0.8).length,
          good: historyItems.filter(item => item.score >= 0.6 && item.score < 0.8).length,
          average: historyItems.filter(item => item.score >= 0.4 && item.score < 0.6).length,
          poor: historyItems.filter(item => item.score < 0.4).length,
        };

        // Calculate success rate (score >= 0.6)
        const successfulPrompts = historyItems.filter(item => item.score >= 0.6).length;
        const successRate = historyItems.length > 0 ? (successfulPrompts / historyItems.length) * 100 : 0;

        // Calculate provider stats
        const providerStats: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
        historyItems.forEach(item => {
          if (!providerStats[item.provider]) {
            providerStats[item.provider] = { count: 0, avgScore: 0, totalScore: 0 };
          }
          providerStats[item.provider].count++;
          providerStats[item.provider].totalScore += item.score;
          providerStats[item.provider].avgScore = providerStats[item.provider].totalScore / providerStats[item.provider].count;
        });

        // Calculate output type stats
        const outputTypeStats: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
        historyItems.forEach(item => {
          if (!outputTypeStats[item.outputType]) {
            outputTypeStats[item.outputType] = { count: 0, avgScore: 0, totalScore: 0 };
          }
          outputTypeStats[item.outputType].count++;
          outputTypeStats[item.outputType].totalScore += item.score;
          outputTypeStats[item.outputType].avgScore = outputTypeStats[item.outputType].totalScore / outputTypeStats[item.outputType].count;
        });

        // Calculate average score
        const totalScore = historyItems.reduce((sum, item) => sum + item.score, 0);
        const averageScore = historyItems.length > 0 ? totalScore / historyItems.length : 0;

        // Determine improvement trend (simple logic based on recent vs older performance)
        const recentItems = historyItems.slice(0, Math.min(10, Math.floor(historyItems.length / 3)));
        const olderItems = historyItems.slice(-Math.min(10, Math.floor(historyItems.length / 3)));
        const recentAvg = recentItems.length > 0 ? recentItems.reduce((sum, item) => sum + item.score, 0) / recentItems.length : 0;
        const olderAvg = olderItems.length > 0 ? olderItems.reduce((sum, item) => sum + item.score, 0) / olderItems.length : 0;
        
        let improvementTrend = 'stable';
        if (recentAvg > olderAvg + 0.05) improvementTrend = 'improving';
        else if (recentAvg < olderAvg - 0.05) improvementTrend = 'declining';

        // Generate insights based on data
        const insights: string[] = [];
        const topProvider = Object.entries(providerStats).reduce((best, [name, stats]) => 
          stats.avgScore > best.score ? { name, score: stats.avgScore } : best
        , { name: '', score: 0 });
        
        if (topProvider.name) {
          insights.push(`Your best performing AI provider is ${topProvider.name} with an average score of ${(topProvider.score * 100).toFixed(1)}%`);
        }
        
        if (successRate > 80) {
          insights.push(`Excellent work! ${successRate.toFixed(1)}% of your prompts score above 60%`);
        } else if (successRate < 50) {
          insights.push(`Consider experimenting with different optimization strategies to improve your success rate (currently ${successRate.toFixed(1)}%)`);
        }

        if (improvementTrend === 'improving') {
          insights.push('Your recent optimizations are performing better than your earlier ones - keep up the great work!');
        }

        const analytics = {
          overview: {
            totalPrompts: historyItems.length,
            completedPrompts: historyItems.length, // All loaded items are completed
            averageScore,
            totalOptimizations: historyItems.length,
            totalChatSessions: 0, // This would need to be fetched from chat_sessions table
            totalTokensUsed: 0, // This would need token data
            successRate,
          },
          performance: {
            scoreDistribution,
            averageScore,
            improvementTrend,
            dailyStats: [], // Could be calculated by grouping by date
          },
          usage: {
            providerStats,
            modelStats: {}, // Could extract from titles/tags
            outputTypeStats,
            tokenAnalytics: {
              total: 0,
              average: 0,
              trend: 'stable',
            },
          },
          engagement: {
            chatSessions: 0,
            avgMessagesPerSession: 0,
            activePrompts: historyItems.length,
          },
          recentActivity: historyItems.slice(0, 10).map(item => ({
            id: item.id,
            type: 'prompt_optimization',
            score: item.score,
            provider: item.provider,
            model: 'N/A', // Could extract from title
            createdAt: item.timestamp,
            status: 'completed',
          })),
          insights,
        };

        setAnalytics(analytics);
        saveToCache(user.user.id, 'analytics', analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [loadFromCache, saveToCache, historyItems]);

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

      // Fetch all optimization history with prompt data to show all variants
      const { data: optimizations, error: optError } = await supabase
        .from('optimization_history')
        .select(`
          *,
          prompts (
            id,
            original_prompt,
            task_description,
            ai_provider,
            model_name,
            output_type,
            created_at
          )
        `)
        .eq('user_id', user.user.id)
        .order('score', { ascending: false })
        .limit(500);

      if (optError) throw optError;

      // Filter out variants without prompt data and ensure we have valid data
      const validVariants = (optimizations || [])
        .filter(variant => variant.prompts && variant.variant_prompt && variant.score !== null);

      // Find the globally best variant (highest score across ALL variants)
      const globalBestVariant = validVariants.length > 0 
        ? validVariants.reduce((best, current) => 
            (current.score || 0) > (best.score || 0) ? current : best
          )
        : null;

      // Map all variants to history items
      const historyItems: PromptHistoryItem[] = validVariants.map((variant) => {
        const prompt = variant.prompts;
        const isGlobalTopPerformer = globalBestVariant && variant.id === globalBestVariant.id;
        
        return {
          id: variant.id,
          title: `${prompt.ai_provider} ${prompt.model_name}${isGlobalTopPerformer ? ' (Top Performer)' : ''}`,
          description: isGlobalTopPerformer 
            ? `🏆 Best performing variant across all optimizations (Score: ${(variant.score || 0).toFixed(3)})`
            : `Optimization variant (Score: ${(variant.score || 0).toFixed(3)})`,
          prompt: prompt.original_prompt,
          output: variant.variant_prompt,
          sampleOutput: variant.ai_response || 'No sample output available',
          provider: prompt.ai_provider,
          outputType: prompt.output_type || 'Code',
          score: variant.score || 0,
          timestamp: new Date(variant.created_at).toLocaleString(),
          tags: [
            prompt.ai_provider?.toLowerCase?.() || 'provider', 
            (prompt.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
            isGlobalTopPerformer ? 'top-performer' : 'variant'
          ],
          isFavorite: false,
          isBestVariant: isGlobalTopPerformer,
        };
      });

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
      
      // Load analytics after loading history will be triggered by separate effect
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [loadFromCache, saveToCache]);

  // Reload analytics whenever history items change
  useEffect(() => {
    if (historyItems.length > 0) {
      loadAnalytics();
    }
  }, [historyItems.length]); // Only depend on length to avoid infinite loop

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
          if (user) {
            saveToCache(user.id, 'history', updated);
          }
        });

        return updated;
      });

      setHasLocalChanges(true);

      // Queue for background sync to Supabase
      setPendingQueue(prev => {
        const exists = prev.some(p => p.id === item.id);
        return exists ? prev : [...prev, item];
      });
    } catch (error) {
      console.error('Error adding prompt to history:', error);
    }
  }, [saveToCache]);

  // Retry queued prompts
  const retryQueuedPrompts = useCallback(async () => {
    if (pendingQueue.length === 0) return;

    const successful: string[] = [];
    
    for (const item of pendingQueue) {
      try {
        console.log('Queue processing not implemented for optimization history');
        successful.push(item.id);
      } catch (error) {
        console.error('Failed to sync prompt:', item.id, error);
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

      // Update history items
      setHistoryItems(prev => prev.map(item => ({
        ...item,
        isFavorite: item.id === id ? !isCurrentlyFavorited : item.isFavorite
      })));

      // Update cache
      const updatedFavorites = Array.from(isCurrentlyFavorited 
        ? new Set([...favoriteIds].filter(fid => fid !== id))
        : new Set([...favoriteIds, id])
      );
      saveToCache(user.user.id, 'favorites', updatedFavorites);
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favoriteIds, historyItems, saveToCache]);

  // Set up real-time subscriptions and load initial data
  useEffect(() => {
    let promptsChannel: any;
    let optimizationChannel: any;

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
            
            // For new prompts, we don't add them directly since we're showing optimization variants
            console.log('New prompt detected, waiting for optimization variants...');
          })
          .subscribe();

        optimizationChannel = supabase
          .channel('provider-optimizations')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'optimization_history' }, async (payload) => {
            console.log('New optimization inserted:', payload.new);
            const no: any = payload.new;
            if (no.user_id !== user.user.id) return; // Guard
            
            // Fetch the prompt data for this new optimization
            const { data: promptData } = await supabase
              .from('prompts')
              .select('*')
              .eq('id', no.prompt_id)
              .single();

            if (!promptData) return;

            // Create new history item for this variant
            const newHistoryItem: PromptHistoryItem = {
              id: no.id,
              title: `${promptData.ai_provider} ${promptData.model_name}`,
              description: `New optimization variant (Score: ${(no.score || 0).toFixed(3)})`,
              prompt: promptData.original_prompt,
              output: no.variant_prompt,
              sampleOutput: no.ai_response || 'No sample output available',
              provider: promptData.ai_provider,
              outputType: promptData.output_type || 'Code',
              score: no.score || 0,
              timestamp: new Date(no.created_at).toLocaleString(),
              tags: [
                promptData.ai_provider?.toLowerCase?.() || 'provider', 
                (promptData.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                'variant'
              ],
              isFavorite: false,
              isBestVariant: false,
            };

            // Add to history and recalculate top performer
            setHistoryItems((prev) => {
              const updated = [newHistoryItem, ...prev];
              
              // Find the new global best performer
              const globalBest = updated.reduce((best, current) => 
                (current.score || 0) > (best.score || 0) ? current : best
              );
              
              // Update all items to reflect new top performer
              const finalUpdated = updated.map(item => ({
                ...item,
                isBestVariant: item.id === globalBest.id,
                title: item.id === globalBest.id 
                  ? item.title.replace(' (Top Performer)', '') + ' (Top Performer)'
                  : item.title.replace(' (Top Performer)', ''),
                description: item.id === globalBest.id
                  ? `🏆 Best performing variant across all optimizations (Score: ${(item.score || 0).toFixed(3)})`
                  : item.description.replace(/🏆 Best performing variant.*/, `Optimization variant (Score: ${(item.score || 0).toFixed(3)})`)
              }));
              
              saveToCache(user.user.id, 'history', finalUpdated);
              return finalUpdated;
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