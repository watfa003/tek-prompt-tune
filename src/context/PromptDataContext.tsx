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
  const userIdRef = useRef<string | null>(null);
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initializedRef.current) return; // Ensure we only initialize once per provider mount
    initializedRef.current = true;

    let promptsChannel: ReturnType<typeof supabase.channel> | undefined;
    let optimizationChannel: ReturnType<typeof supabase.channel> | undefined;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Hydrate from localStorage only (no initial fetch)
        userIdRef.current = user.id;
        try {
          const cachedAnalytics = localStorage.getItem(`pt_analytics_${user.id}`);
          if (cachedAnalytics) setAnalytics(JSON.parse(cachedAnalytics));
        } catch {}

        try {
          const fav = localStorage.getItem(`pt_favorites_${user.id}`);
          if (fav) {
            const arr: string[] = JSON.parse(fav);
            setFavoriteIds(new Set(arr));
          }
        } catch {}

        try {
          const cachedHistory = localStorage.getItem(`pt_history_${user.id}`);
          if (cachedHistory) {
            const items: PromptHistoryItem[] = JSON.parse(cachedHistory);
            setHistoryItems(items);
          } else {
            setHistoryItems([]);
          }
        } catch {
          setHistoryItems([]);
        }

        // Realtime updates: append only, no reloading
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
              isFavorite: false, // New items start as not favorited
            };
            setHistoryItems((prev) => [item, ...prev]);

            // Also reflect in analytics recentActivity minimally
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
              return {
                ...prev,
                overview: {
                  ...prev.overview,
                  totalPrompts: (prev.overview?.totalPrompts || 0) + 1,
                  completedPrompts: (np.status === 'completed') ? (prev.overview?.completedPrompts || 0) + 1 : (prev.overview?.completedPrompts || 0),
                },
                recentActivity: [newActivity, ...(prev.recentActivity || [])].slice(0, 10),
              };
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
            setHistoryItems((prev) => [item, ...prev]);
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

      // Update local state to reflect change
      setHistoryItems((prev) => prev.map((h) => (h.id === id ? { ...h, isFavorite: !isCurrentlyFavorited } : h)));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Persist to localStorage for instant load on next visit
  useEffect(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      localStorage.setItem(`pt_history_${uid}`, JSON.stringify(historyItems));
    } catch {}
  }, [historyItems]);

  useEffect(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      localStorage.setItem(`pt_analytics_${uid}`, JSON.stringify(analytics));
    } catch {}
  }, [analytics]);

  useEffect(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      localStorage.setItem(`pt_favorites_${uid}`, JSON.stringify(Array.from(favoriteIds)));
    } catch {}
  }, [favoriteIds]);

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
