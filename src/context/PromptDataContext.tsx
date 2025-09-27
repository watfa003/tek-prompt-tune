import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Shared types kept minimal to avoid conflicts
export interface PromptHistoryItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  output: string;
  provider: string;
  outputType: string;
  score: number;
  timestamp: string;
  tags: string[];
  isFavorite: boolean;
}

interface PromptDataContextValue {
  historyItems: PromptHistoryItem[];
  analytics: any;
  loading: boolean;
  toggleFavorite: (id: string) => void;
}

const PromptDataContext = createContext<PromptDataContextValue | undefined>(undefined);

export const PromptDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializedRef = useRef(false);
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Default to false, only show loading for new users
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Cache keys
  const getCacheKey = (userId: string, type: string) => `prompt_${type}_${userId}`;

  // Load from localStorage immediately
  const loadFromCache = (userId: string) => {
    try {
      const cachedHistory = localStorage.getItem(getCacheKey(userId, 'history'));
      const cachedAnalytics = localStorage.getItem(getCacheKey(userId, 'analytics'));
      const cachedFavorites = localStorage.getItem(getCacheKey(userId, 'favorites'));

      if (cachedHistory) {
        const historyData = JSON.parse(cachedHistory);
        setHistoryItems(historyData);
      }

      if (cachedAnalytics) {
        const analyticsData = JSON.parse(cachedAnalytics);
        setAnalytics(analyticsData);
      }

      if (cachedFavorites) {
        const favoritesData = JSON.parse(cachedFavorites);
        setFavoriteIds(new Set(favoritesData));
      }

      return {
        hasHistory: !!cachedHistory,
        hasAnalytics: !!cachedAnalytics,
        hasFavorites: !!cachedFavorites
      };
    } catch (error) {
      console.error('Error loading from cache:', error);
      return { hasHistory: false, hasAnalytics: false, hasFavorites: false };
    }
  };

  // Save to localStorage
  const saveToCache = (userId: string, type: string, data: any) => {
    try {
      localStorage.setItem(getCacheKey(userId, type), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let promptsChannel: ReturnType<typeof supabase.channel> | undefined;
    let optimizationChannel: ReturnType<typeof supabase.channel> | undefined;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load cached data immediately
        const cache = loadFromCache(user.id);

        // Only show loading if no cached data exists
        if (!cache.hasHistory && !cache.hasAnalytics) {
          setLoading(true);
        }

        // Background refresh from database (only if no cache or need fresh data)
        const refreshPromises: Promise<any>[] = [];

        // Fetch analytics if not cached
        if (!cache.hasAnalytics) {
          refreshPromises.push(
            (async () => {
              try {
                const url = new URL('https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/ai-analytics');
                url.searchParams.set('userId', user.id);
                url.searchParams.set('timeframe', '7d');

                const session = await supabase.auth.getSession();
                const response = await fetch(url.toString(), {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA',
                  },
                });

                if (response.ok) {
                  const analyticsData = await response.json();
                  setAnalytics(analyticsData);
                  saveToCache(user.id, 'analytics', analyticsData);
                }
              } catch (e) {
                console.error('Analytics fetch failed:', e);
              }
            })()
          );
        }

        // Fetch favorites if not cached
        if (!cache.hasFavorites) {
          refreshPromises.push(
            (async () => {
              const { data: favoritesData } = await supabase
                .from('user_favorites')
                .select('item_id, item_type')
                .eq('user_id', user.id);

              const favoriteIdSet = new Set<string>();
              favoritesData?.forEach(fav => favoriteIdSet.add(fav.item_id));
              setFavoriteIds(favoriteIdSet);
              saveToCache(user.id, 'favorites', Array.from(favoriteIdSet));
            })()
          );
        }

        // Fetch history if not cached
        if (!cache.hasHistory) {
          refreshPromises.push(
            (async () => {
              const [{ data: promptsData, error: promptsError }, { data: optimizationData, error: optimizationError }] = await Promise.all([
                supabase.from('prompts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('optimization_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
              ]);

              if (promptsError || optimizationError) {
                console.error('Error fetching history:', { promptsError, optimizationError });
                return;
              }

              const combined: PromptHistoryItem[] = [];
              const currentFavorites = favoriteIds.size > 0 ? favoriteIds : new Set(cache.hasFavorites ? JSON.parse(localStorage.getItem(getCacheKey(user.id, 'favorites')) || '[]') : []);

              promptsData?.forEach((p: any) => {
                combined.push({
                  id: p.id,
                  title: `${p.ai_provider} ${p.model_name} Optimization`,
                  description: `${p.score >= 0.8 ? 'High-performance' : p.score >= 0.6 ? 'Good-quality' : p.score >= 0.4 ? 'Standard' : 'Experimental'} prompt optimization`,
                  prompt: p.original_prompt,
                  output: p.optimized_prompt || 'Optimization in progress...',
                  provider: p.ai_provider,
                  outputType: p.output_type || 'Code',
                  score: p.score || 0,
                  timestamp: new Date(p.created_at).toLocaleString(),
                  tags: [p.ai_provider?.toLowerCase?.() || 'provider', (p.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')],
                  isFavorite: currentFavorites.has(p.id),
                });
              });

              optimizationData?.forEach((o: any) => {
                combined.push({
                  id: o.id,
                  title: `Optimization Variant - Score ${o.score?.toFixed(2) || 'N/A'}`,
                  description: `Optimized variant with ${o.tokens_used || 'unknown'} tokens`,
                  prompt: o.variant_prompt,
                  output: o.ai_response || 'No response recorded',
                  provider: 'Optimization',
                  outputType: 'Variant',
                  score: o.score || 0,
                  timestamp: new Date(o.created_at).toLocaleString(),
                  tags: ['optimization', 'variant'],
                  isFavorite: currentFavorites.has(o.id),
                });
              });

              combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setHistoryItems(combined);
              saveToCache(user.id, 'history', combined);
            })()
          );
        }

        // Wait for all background refreshes
        await Promise.all(refreshPromises);

        // Setup realtime listeners for new prompts (append only)
        promptsChannel = supabase
          .channel('provider-prompts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prompts' }, (payload) => {
            const np: any = payload.new;
            const item: PromptHistoryItem = {
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
            };
            
            setHistoryItems((prev) => {
              const updated = [item, ...prev];
              saveToCache(user.id, 'history', updated);
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
              saveToCache(user.id, 'analytics', updated);
              return updated;
            });
          })
          .subscribe();

        optimizationChannel = supabase
          .channel('provider-optimizations')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'optimization_history' }, (payload) => {
            const no: any = payload.new;
            const item: PromptHistoryItem = {
              id: no.id,
              title: `Optimization Variant - Score ${no.score?.toFixed(2) || 'N/A'}`,
              description: `Optimized variant with ${no.tokens_used || 'unknown'} tokens`,
              prompt: no.variant_prompt,
              output: no.ai_response || 'No response recorded',
              provider: 'Optimization',
              outputType: 'Variant',
              score: no.score || 0,
              timestamp: new Date(no.created_at).toLocaleString(),
              tags: ['optimization', 'variant'],
              isFavorite: false,
            };
            
            setHistoryItems((prev) => {
              const updated = [item, ...prev];
              saveToCache(user.id, 'history', updated);
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
  }, []);

  const toggleFavorite = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isCurrentlyFavorited = favoriteIds.has(id);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
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
            user_id: user.id,
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
        saveToCache(user.id, 'history', updated);
        return updated;
      });
      
      // Update favorites cache
      saveToCache(user.id, 'favorites', Array.from(favoriteIds));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const value = useMemo(
    () => ({ historyItems, analytics, loading, toggleFavorite }),
    [historyItems, analytics, loading]
  );

  return <PromptDataContext.Provider value={value}>{children}</PromptDataContext.Provider>;
};

export const usePromptData = () => {
  const ctx = useContext(PromptDataContext);
  if (!ctx) throw new Error('usePromptData must be used within PromptDataProvider');
  return ctx;
};
