import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  isGeneratingTitle?: boolean; // Flag to prevent duplicate generation
  groupId?: string; // The underlying prompts.id for grouping variants
}

interface PromptDataContextValue {
  historyItems: PromptHistoryItem[];
  analytics: any;
  loading: boolean;
  toggleFavorite: (id: string) => Promise<void>;
  addPromptToHistory: (item: PromptHistoryItem) => Promise<void>;
  hasLocalChanges: boolean;
  favorites: PromptHistoryItem[];
  generateTitleAndApply: (promptId: string, promptText: string) => Promise<void>;
}

const PromptDataContext = createContext<PromptDataContextValue | null>(null);

export const PromptDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pendingQueue, setPendingQueue] = useState<PromptHistoryItem[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const initRef = useRef(false);
  const historyRef = useRef<PromptHistoryItem[]>([]);
  const lastPollAtRef = useRef<string>("");
  const processingOptimizationsRef = useRef<Set<string>>(new Set());
  const seenOptimizationIdsRef = useRef<Set<string>>(new Set());
  const titlesInFlightRef = useRef<Set<string>>(new Set());
  const titleStatusRef = useRef<Record<string, "pending" | "done">>({});
  // Keep a live ref of history items for polling without stale closures
  useEffect(() => {
    historyRef.current = historyItems;
  }, [historyItems]);

  // Load title status map from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('prompt_title_status_map');
      if (stored) {
        titleStatusRef.current = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load title status map:', e);
    }
  }, []);

  // Title status helpers
  const getTitleStatus = useCallback((id: string): "pending" | "done" | undefined => {
    return titleStatusRef.current[id];
  }, []);

  const setTitleStatus = useCallback((id: string, status: "pending" | "done") => {
    titleStatusRef.current[id] = status;
    try {
      localStorage.setItem('prompt_title_status_map', JSON.stringify(titleStatusRef.current));
    } catch (e) {
      console.error('Failed to save title status:', e);
    }
  }, []);

  const acquireTitleLock = useCallback((id: string): boolean => {
    const lockKey = `prompt-title-lock-${id}`;
    try {
      const existing = localStorage.getItem(lockKey);
      if (existing) {
        const { at, ttl } = JSON.parse(existing);
        if (Date.now() - at < ttl) {
          console.log(`[Lock] ${id} already locked`);
          return false;
        }
      }
      localStorage.setItem(lockKey, JSON.stringify({ at: Date.now(), ttl: 120000 }));
      console.log(`[Lock] ${id} acquired`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const releaseTitleLock = useCallback((id: string) => {
    try {
      localStorage.removeItem(`prompt-title-lock-${id}`);
      console.log(`[Lock] ${id} released`);
    } catch {}
  }, []);

  // Reset all state when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      
      // If user changed, clear all prompt data state
      if (currentUserId && newUserId !== currentUserId) {
        console.log('User changed, clearing prompt data');
        setHistoryItems([]);
        setAnalytics(null);
        setFavoriteIds(new Set());
        setPendingQueue([]);
        setHasLocalChanges(false);
        initRef.current = false;
        setLoading(true);
        processingOptimizationsRef.current = new Set();
      }
      
      setCurrentUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, [currentUserId]);

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

  // AI Title generation helpers
  const aiGenerateTitle = useCallback(async (text: string): Promise<string | null> => {
    try {
      if (!text) return null;
      const { data, error } = await supabase.functions.invoke('generate-title', {
        body: { prompt: text },
      });
      if (error) {
        console.error('AI title error:', error);
        return null;
      }
      let title = (data as any)?.title ? String((data as any).title) : '';
      if (!title) return null;
      // Ignore placeholder-like titles
      if (/^untitled session$/i.test(title)) return null;
      // Enforce constraints client-side too
      const words = title.split(/\s+/).slice(0, 6);
      title = words.join(' ');
      if (title.length > 50) title = title.slice(0, 47).trim() + '...';
      const minor = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','with']);
      title = title
        .split(/\s+/)
        .map((w, i) => {
          const lw = w.toLowerCase();
          if (i === 0 || !minor.has(lw)) return lw.charAt(0).toUpperCase() + lw.slice(1);
          return lw;
        })
        .join(' ');
      return title || null;
    } catch (e) {
      console.error('AI title exception:', e);
      return null;
    }
  }, []);

  // Centralized title generator with bulletproof idempotency
  const generateTitleAndApply = useCallback(async (promptId: string, promptText: string) => {
    if (!promptId || !promptText) return;
    
    console.log(`[generateTitleAndApply] Start: ${promptId}`);
    
    // GUARD 1: Skip if title already exists (not Untitled)
    const existingItem = historyRef.current.find(h => h.id === promptId);
    if (existingItem?.title && existingItem.title !== 'Untitled' && existingItem.title !== 'Untitled Session') {
      console.log(`[generateTitleAndApply] Skip - title already exists: ${promptId} => ${existingItem.title}`);
      setTitleStatus(promptId, "done");
      return;
    }
    
    // GUARD 2: Skip if currently generating
    if (existingItem?.isGeneratingTitle) {
      console.log(`[generateTitleAndApply] Skip - already generating: ${promptId}`);
      return;
    }
    
    // GUARD 3: Check localStorage cache
    const cached = typeof window !== 'undefined' ? localStorage.getItem(`prompt-title-${promptId}`) : null;
    if (cached && cached.trim() && cached !== 'Untitled') {
      console.log(`[generateTitleAndApply] Using cache: ${promptId} => ${cached}`);
      setTitleStatus(promptId, "done");
      setHistoryItems(prev => {
        const updated = prev.map(p => p.id === promptId ? { ...p, title: cached, isGeneratingTitle: false } : p);
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.id) saveToCache(data.user.id, 'history', updated);
        });
        return updated;
      });
      return;
    }
    
    // GUARD 4: Check status map
    const status = getTitleStatus(promptId);
    if (status === "done") {
      console.log(`[generateTitleAndApply] Skip - status done: ${promptId}`);
      return;
    }
    if (status === "pending") {
      console.log(`[generateTitleAndApply] Skip - status pending: ${promptId}`);
      return;
    }
    
    // GUARD 5: Attempt to acquire lock
    if (!acquireTitleLock(promptId)) {
      console.log(`[generateTitleAndApply] Skip - lock failed: ${promptId}`);
      return;
    }
    
    // GUARD 6: Check in-flight ref (intra-render guard)
    if (titlesInFlightRef.current.has(promptId)) {
      console.log(`[generateTitleAndApply] Skip - in-flight: ${promptId}`);
      releaseTitleLock(promptId);
      return;
    }
    
    // Mark as generating to prevent concurrent calls
    setHistoryItems(prev => prev.map(p => 
      p.id === promptId ? { ...p, isGeneratingTitle: true } : p
    ));
    
    titlesInFlightRef.current.add(promptId);
    setTitleStatus(promptId, "pending");
    
    try {
      console.log(`[generateTitleAndApply] Generating: ${promptId}`);
      const newTitle = await aiGenerateTitle(promptText);
      const finalTitle = (newTitle?.trim() || 'Untitled');

      // Persist to localStorage
      try { localStorage.setItem(`prompt-title-${promptId}`, finalTitle); } catch {}
      
      // Update local state - clear isGeneratingTitle flag
      setHistoryItems(prev => {
        const updated = prev.map(p =>
          p.id === promptId ? { ...p, title: finalTitle, isGeneratingTitle: false } : p
        );
        
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.id) {
            saveToCache(data.user.id, 'history', updated);
          }
        });
        
        return updated;
      });
      
      setTitleStatus(promptId, "done");
      console.log(`[generateTitleAndApply] Applied title: ${promptId} => ${finalTitle}`);
    } catch (err) {
      console.error(`[generateTitleAndApply] Failed: ${promptId}`, err);
      // Mark as done even on failure to prevent retry loops
      setTitleStatus(promptId, "done");
      // Clear isGeneratingTitle flag on error
      setHistoryItems(prev => prev.map(p => 
        p.id === promptId ? { ...p, isGeneratingTitle: false } : p
      ));
    } finally {
      titlesInFlightRef.current.delete(promptId);
      releaseTitleLock(promptId);
      console.log(`[generateTitleAndApply] Released lock: ${promptId}`);
    }
  }, [aiGenerateTitle, saveToCache, getTitleStatus, setTitleStatus, acquireTitleLock, releaseTitleLock]);

  const refineTitlesFor = useCallback(async (items: PromptHistoryItem[]) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id;
      if (!uid) return;

      const targets = (items || []).slice(0, 40);
      for (const item of targets) {
        const ai = await aiGenerateTitle(item.prompt);
        if (ai && ai !== item.title) {
          setHistoryItems(prev => {
            const updated = prev.map(h => h.id === item.id ? { ...h, title: ai } : h);
            saveToCache(uid, 'history', updated);
            return updated;
          });
        }
      }
    } catch (e) {
      console.error('refineTitlesFor error:', e);
    }
  }, [aiGenerateTitle, saveToCache]);

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
          recentActivity: (() => {
            // Group by groupId (the underlying prompts.id)
            const promptGroups = new Map<string, PromptHistoryItem[]>();
            
            historyItems.forEach(item => {
              const key = item.groupId || item.id; // Fallback to item.id if groupId not set
              if (!promptGroups.has(key)) {
                promptGroups.set(key, []);
              }
              promptGroups.get(key)!.push(item);
            });
            
            // For each group: find best variant and latest timestamp
            return Array.from(promptGroups.values())
              .map(group => {
                const best = group.reduce((b, curr) => 
                  (curr.score || 0) > (b.score || 0) ? curr : b
                );
                const latestTs = Math.max(...group.map(item => new Date(item.timestamp).getTime()));
                return { best, latestTs };
              })
              .sort((a, b) => b.latestTs - a.latestTs) // Sort by latest timestamp desc
              .slice(0, 5)
              .map(({ best }) => ({
                id: best.id,
                title: best.title,
                type: 'prompt_optimization',
                outputType: best.outputType,
                score: best.score,
                provider: best.provider,
                model: 'N/A',
                createdAt: best.timestamp,
                status: 'completed',
              }));
          })(),
          insights,
        };

        setAnalytics(analytics);
        saveToCache(user.user.id, 'analytics', analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [loadFromCache, saveToCache, historyItems]);

  // REMOVED: backfillMissingTitles function
  // Only generate titles for NEW prompts at creation time via realtime/poller paths

  // Helper: Check if a prompt is recent (within last 5 minutes)
  const isRecentPrompt = useCallback((createdAt: string): boolean => {
    try {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const ageInMinutes = (now - created) / 1000 / 60;
      return ageInMinutes <= 5;
    } catch {
      return false; // If parsing fails, treat as old
    }
  }, []);

  // Helper: Check if ID is a valid UUID
  const isUUID = useCallback((id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }, []);

  // Load initial data from Supabase with full prompt data
  const loadInitialData = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load cached data instantly for immediate display
      const cachedHistory = loadFromCache(user.user.id, 'history') as PromptHistoryItem[] | null;
      const cachedFavorites = loadFromCache(user.user.id, 'favorites') as string[] | null;
      const cachedFavSet = new Set<string>(cachedFavorites || []);
      
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
        
        // Load title from localStorage and mark status if present
        const cachedTitle = (typeof window !== 'undefined' ? localStorage.getItem(`prompt-title-${variant.id}`) : null);
        if (cachedTitle && cachedTitle !== 'Untitled') {
          setTitleStatus(variant.id, "done");
        } else {
          // Mark existing untitled items as "done" to prevent backfill attempts
          setTitleStatus(variant.id, "done");
        }
        
        // Sensible fallback title if no cached title exists
        const fallbackTitle = (prompt.task_description && String(prompt.task_description).trim())
          || String(prompt.original_prompt || "").split(/\s+/).slice(0, 6).join(" ").trim();
        
        return {
          id: variant.id,
          title: cachedTitle || (fallbackTitle || 'Untitled'),
          description: `${prompt.ai_provider} • ${prompt.model_name}${isGlobalTopPerformer ? ' • 🏆 Top Performer' : ''}`,
          prompt: prompt.original_prompt,
          output: variant.variant_prompt,
          sampleOutput: variant.ai_response || 'No sample output available',
          provider: prompt.ai_provider,
          outputType: prompt.output_type || 'Code',
          score: variant.score || 0,
          timestamp: variant.created_at,
          tags: [
            prompt.ai_provider?.toLowerCase?.() || 'provider', 
            (prompt.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
            isGlobalTopPerformer ? 'top-performer' : 'variant'
          ],
          isFavorite: cachedFavSet.has(variant.id),
          isBestVariant: isGlobalTopPerformer,
          groupId: prompt.id,
        };
      });

      console.log('Loaded history items from Supabase:', historyItems.length);
      setHistoryItems((prev) => {
        // Build a map from prev by id to preserve existing titles
        const prevMap = new Map(prev.map(i => [i.id, i]));
        
        // Merge: prefer prev.title if it exists and isn't 'Untitled'/'Untitled Session'
        const merged = historyItems.map(remote => {
          const p = prevMap.get(remote.id);
          if (!p) return remote;
          
          const keepTitle = p.title && !/^(untitled|untitled session)$/i.test(p.title) ? p.title : remote.title;
          return { 
            ...remote, 
            title: keepTitle, 
            isFavorite: p.isFavorite || remote.isFavorite 
          };
        });
        
        // Add prev-only items not in remote, BUT ONLY if they have valid UUIDs
        // This cleans up old local stubs with random non-UUID ids
        for (const p of prev) {
          if (!merged.find(m => m.id === p.id) && isUUID(p.id)) {
            merged.push(p);
          } else if (!isUUID(p.id)) {
            console.log(`[Cleanup] Dropped non-UUID legacy item: ${p.id}`);
          }
        }
        
        // Final dedupe by id using Map to guarantee uniqueness
        const deduped = Array.from(new Map(merged.map(item => [item.id, item])).values());
        console.log(`[Cleanup] Deduped ${merged.length} -> ${deduped.length} items`);
        
        saveToCache(user.user.id, 'history', deduped);
        return deduped;
      });
      
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
      
      // No backfill - only generate titles for NEW prompts at creation time
      
      // Load analytics after loading history will be triggered by separate effect
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [loadFromCache, saveToCache, setTitleStatus]);

  // Reload analytics whenever history items change
  useEffect(() => {
    if (historyItems.length > 0 && !loading) {
      loadAnalytics();
    }
  }, [historyItems.length, loading]); // Only depend on length and loading to avoid infinite loop

  // Add prompt to history
  const addPromptToHistory = useCallback(async (item: PromptHistoryItem) => {
    try {
      // Add to state and cache immediately (local-first) - always add, no deduplication
      setHistoryItems((prev) => {
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

      // Queue for background sync to Supabase - always add, no deduplication
      setPendingQueue(prev => [...prev, item]);

      // Title will be set by optimization completion flow; no placeholder or background AI generation here
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
    if (initRef.current) return;
    initRef.current = true;

    let promptsChannel: any;
    let optimizationChannel: any;
    let poller: any;

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
            console.log('New prompt detected, waiting for optimization variants...');
          })
          .subscribe();

        optimizationChannel = supabase
          .channel('provider-optimizations')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'optimization_history' }, async (payload) => {
            console.log('[Realtime] New optimization inserted:', payload.new);
            const no: any = payload.new;
            if (no.user_id !== user.user.id) return; // Guard

            // Hard sentinel: if we've ever seen this ID, stop immediately
            if (seenOptimizationIdsRef.current.has(no.id)) {
              console.log('[SeenIds] Skip already seen:', no.id);
              return;
            }
            
            // De-duplicate processing and skip if already present
            if (processingOptimizationsRef.current.has(no.id) || historyRef.current.some(h => h.id === no.id)) {
              console.log('[Realtime] Skipping already processed optimization:', no.id);
              seenOptimizationIdsRef.current.add(no.id);
              return;
            }
            processingOptimizationsRef.current.add(no.id);

            const { data: promptData } = await supabase
              .from('prompts')
              .select('*')
              .eq('id', no.prompt_id)
              .single();

            if (!promptData) {
              processingOptimizationsRef.current.delete(no.id);
              return;
            }

            // Check if prompt is recent (within 5 minutes)
            const isRecent = isRecentPrompt(no.created_at);
            let finalTitle = 'Untitled';

            if (!isRecent) {
              // Old prompt - skip title generation entirely
              const ageInMinutes = Math.floor((Date.now() - new Date(no.created_at).getTime()) / 1000 / 60);
              console.log(`[Realtime] Skipping title generation for old prompt ${no.id} (${ageInMinutes} minutes old)`);
              setTitleStatus(no.id, "done");
              
              // Check if there's a cached title from before
              const cached = localStorage.getItem(`prompt-title-${no.id}`);
              if (cached && cached !== 'Untitled') {
                finalTitle = cached;
                console.log(`[Realtime] Using existing cached title for ${no.id}: ${finalTitle}`);
              }
            } else {
              // Recent prompt - generate title using the centralized function
              console.log(`[Realtime] Calling generateTitleAndApply for recent prompt ${no.id}`);
              await generateTitleAndApply(no.id, promptData.original_prompt);
              
              // Read the generated title from localStorage
              const cached = localStorage.getItem(`prompt-title-${no.id}`);
              if (cached && cached !== 'Untitled') {
                finalTitle = cached;
                console.log(`[Realtime] Using generated title for ${no.id}: ${finalTitle}`);
              } else {
                console.warn(`[Realtime] No title found in cache after generation for ${no.id}`);
              }
            }

            const newHistoryItem: PromptHistoryItem = {
              id: no.id,
              title: finalTitle,
              description: `New optimization variant (Score: ${(no.score || 0).toFixed(3)})`,
              prompt: promptData.original_prompt,
              output: no.variant_prompt,
              sampleOutput: no.ai_response || 'No sample output available',
              provider: promptData.ai_provider,
              outputType: promptData.output_type || 'Code',
              score: no.score || 0,
              timestamp: no.created_at,
              tags: [
                promptData.ai_provider?.toLowerCase?.() || 'provider',
                (promptData.model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                'variant'
              ],
              isFavorite: false,
              isBestVariant: false,
              isGeneratingTitle: false,
              groupId: promptData.id,
            };

            console.log(`[Realtime] Adding to history with title: "${newHistoryItem.title}"`);
            setHistoryItems((prev) => {
              // UPSERT: if item already exists, replace it; otherwise prepend
              if (prev.some(i => i.id === newHistoryItem.id)) {
                console.log(`[Deduper] Already have id, replacing not inserting: ${newHistoryItem.id}`);
                const replaced = prev.map(i => i.id === newHistoryItem.id ? newHistoryItem : i);
                saveToCache(user.user.id, 'history', replaced);
                return replaced;
              }
              
              const updated = [newHistoryItem, ...prev];
              const globalBest = updated.reduce((best, current) =>
                (current.score || 0) > (best.score || 0) ? current : best
              );
              // Make Top Performer suffix idempotent by stripping existing suffixes first
              const finalUpdated = updated.map(item => ({
                ...item,
                isBestVariant: item.id === globalBest.id,
                title: item.id === globalBest.id
                  ? item.title.replace(/\s*\(Top Performer\)+/g, '') + ' (Top Performer)'
                  : item.title.replace(/\s*\(Top Performer\)+/g, ''),
                description: item.id === globalBest.id
                  ? `🏆 Best performing variant across all optimizations (Score: ${(item.score || 0).toFixed(3)})`
                  : item.description.replace(/🏆 Best performing variant.*/, `Optimization variant (Score: ${(item.score || 0).toFixed(3)})`)
              }));

              console.log(`[Realtime] Updated history, total items: ${finalUpdated.length}`);
              saveToCache(user.user.id, 'history', finalUpdated);
              return finalUpdated;
            });
            seenOptimizationIdsRef.current.add(no.id);
            processingOptimizationsRef.current.delete(no.id);
          })
          .subscribe();

        // Polling fallback for new optimizations if realtime misses
        poller = setInterval(async () => {
          try {
            const { data: auth } = await supabase.auth.getUser();
            const cur = auth?.user;
            if (!cur) return;

            const { data: latest, error: latestErr } = await supabase
              .from('optimization_history')
              .select('*')
              .eq('user_id', cur.id)
              .order('created_at', { ascending: false })
              .limit(5);

            if (latestErr || !latest) return;

            for (const no of latest as any[]) {
              // Hard sentinel: if we've ever seen this ID, skip immediately
              if (seenOptimizationIdsRef.current.has(no.id)) {
                continue;
              }
              
              if (historyRef.current.some(h => h.id === no.id) || processingOptimizationsRef.current.has(no.id)) {
                seenOptimizationIdsRef.current.add(no.id);
                continue;
              }
              processingOptimizationsRef.current.add(no.id);

              const { data: promptData } = await supabase
                .from('prompts')
                .select('*')
                .eq('id', no.prompt_id)
                .single();

              if (!promptData) {
                processingOptimizationsRef.current.delete(no.id);
                continue;
              }

              // Check if prompt is recent (within 5 minutes)
              const isRecent = isRecentPrompt(no.created_at);
              let finalTitle = 'Untitled';

              if (!isRecent) {
                // Old prompt - skip title generation entirely
                const ageInMinutes = Math.floor((Date.now() - new Date(no.created_at).getTime()) / 1000 / 60);
                console.log(`[Poller] Skipping title generation for old prompt ${no.id} (${ageInMinutes} minutes old)`);
                setTitleStatus(no.id, "done");
                
                // Check if there's a cached title from before
                const cached = localStorage.getItem(`prompt-title-${no.id}`);
                if (cached && cached !== 'Untitled') {
                  finalTitle = cached;
                  console.log(`[Poller] Using existing cached title for ${no.id}: ${finalTitle}`);
                }
              } else {
                // Recent prompt - generate title using the centralized function
                console.log(`[Poller] Calling generateTitleAndApply for recent prompt ${no.id}`);
                await generateTitleAndApply(no.id, (promptData as any).original_prompt);
                
                // Read the generated title from localStorage
                const cached = localStorage.getItem(`prompt-title-${no.id}`);
                if (cached && cached !== 'Untitled') {
                  finalTitle = cached;
                  console.log(`[Poller] Using generated title for ${no.id}: ${finalTitle}`);
                } else {
                  console.warn(`[Poller] No title found in cache after generation for ${no.id}`);
                }
              }

              const newHistoryItem: PromptHistoryItem = {
                id: no.id,
                title: finalTitle,
                description: `New optimization variant (Score: ${(no.score || 0).toFixed(3)})`,
                prompt: (promptData as any).original_prompt,
                output: no.variant_prompt,
                sampleOutput: no.ai_response || 'No sample output available',
                provider: (promptData as any).ai_provider,
                outputType: (promptData as any).output_type || 'Code',
                score: no.score || 0,
                timestamp: no.created_at,
                tags: [
                  (promptData as any).ai_provider?.toLowerCase?.() || 'provider',
                  ((promptData as any).model_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  'variant'
                ],
                isFavorite: false,
                isBestVariant: false,
                isGeneratingTitle: false,
                groupId: (promptData as any).id,
              };

              setHistoryItems((prev) => {
                // UPSERT: if item already exists, replace it; otherwise prepend
                if (prev.some(i => i.id === newHistoryItem.id)) {
                  console.log(`[Deduper] Already have id, replacing not inserting: ${newHistoryItem.id}`);
                  const replaced = prev.map(i => i.id === newHistoryItem.id ? newHistoryItem : i);
                  saveToCache(cur.id, 'history', replaced);
                  return replaced;
                }
                
                const updated = [newHistoryItem, ...prev];
                const globalBest = updated.reduce((best, current) =>
                  (current.score || 0) > (best.score || 0) ? current : best
                );
                // Make Top Performer suffix idempotent by stripping existing suffixes first
                const finalUpdated = updated.map(item => ({
                  ...item,
                  isBestVariant: item.id === globalBest.id,
                  title: item.id === globalBest.id
                    ? item.title.replace(/\s*\(Top Performer\)+/g, '') + ' (Top Performer)'
                    : item.title.replace(/\s*\(Top Performer\)+/g, ''),
                  description: item.id === globalBest.id
                    ? `🏆 Best performing variant across all optimizations (Score: ${(item.score || 0).toFixed(3)})`
                    : item.description.replace(/🏆 Best performing variant.*/, `Optimization variant (Score: ${(item.score || 0).toFixed(3)})`)
                }));

                saveToCache(cur.id, 'history', finalUpdated);
                return finalUpdated;
              });
              seenOptimizationIdsRef.current.add(no.id);
              processingOptimizationsRef.current.delete(no.id);
            }
          } catch (e) {
            console.error('Polling error:', e);
          }
        }, 4000);
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
      if (poller) clearInterval(poller);
    };
  }, [loadInitialData, saveToCache, generateTitleAndApply, isRecentPrompt, setTitleStatus]);

  const favorites = useMemo(
    () => historyItems.filter(item => item.isFavorite),
    [historyItems]
  );

  const value = useMemo(
    () => ({ historyItems, analytics, loading, toggleFavorite, addPromptToHistory, hasLocalChanges, favorites, generateTitleAndApply }),
    [historyItems, analytics, loading, toggleFavorite, addPromptToHistory, hasLocalChanges, favorites, generateTitleAndApply]
  );

  return <PromptDataContext.Provider value={value}>{children}</PromptDataContext.Provider>;
};

export const usePromptData = () => {
  const ctx = useContext(PromptDataContext);
  if (!ctx) throw new Error('usePromptData must be used within PromptDataProvider');
  return ctx;
};