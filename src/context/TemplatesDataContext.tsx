import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  template: string;
  favorites_count: number;
  uses_count: number;
  user_id: string;
  output_type: string | null;
  is_official?: boolean;
}

interface ProfileMap {
  [userId: string]: string;
}

interface TemplatesDataContextValue {
  templates: Template[];
  featuredTemplates: Template[];
  favoriteTemplates: Template[];
  profileMap: ProfileMap;
  loading: boolean;
  refresh: () => Promise<void>;
  updateFavoriteLocally: (id: string, favorited: boolean) => void;
  removeTemplateLocally: (id: string) => void;
  setTemplateFavoritesCount: (id: string, count: number) => void;
}

const TemplatesDataContext = createContext<TemplatesDataContextValue | undefined>(undefined);

export const TemplatesDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<Template[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  const loadedOnceRef = useRef(false);

  // Reset state when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      
      // If user changed, reload templates data
      if (currentUserId && newUserId !== currentUserId) {
        console.log('User changed, reloading templates');
        setTemplates([]);
        setFeaturedTemplates([]);
        setFavoriteTemplates([]);
        setProfileMap({});
        setLoading(true);
        loadedOnceRef.current = false;
      }
      
      setCurrentUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, [currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const [templatesRes, favoritesRes] = await Promise.all([
        supabase
          .from('prompt_templates')
          .select('id, title, description, category, template, favorites_count, uses_count, user_id, output_type, is_official')
          .eq('is_public', true)
          .order('uses_count', { ascending: false }),
        session?.user ? supabase
          .from('user_favorites')
          .select('item_id')
          .eq('user_id', session.user.id)
          .eq('item_type', 'template') : Promise.resolve({ data: [] as any[] })
      ]);

      if (templatesRes.error) throw templatesRes.error;

      const templatesData = templatesRes.data || [];
      setTemplates(templatesData);
      setFeaturedTemplates(templatesData.slice(0, 20));

      const favoriteIds = (favoritesRes as any).data?.map((f: any) => f.item_id) || [];
      const userIds = [...new Set(templatesData.map(t => t.user_id))];

      const [favTemplatesRes, profilesRes] = await Promise.all([
        favoriteIds.length > 0 ? supabase
          .from('prompt_templates')
          .select('id, title, description, category, template, favorites_count, uses_count, user_id, output_type, is_official')
          .in('id', favoriteIds) : Promise.resolve({ data: [] }),
        userIds.length > 0 ? supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds) : Promise.resolve({ data: [] })
      ]);

      setFavoriteTemplates((favTemplatesRes as any).data || []);
      const map: ProfileMap = {};
      (profilesRes as any).data?.forEach((p: any) => { map[p.user_id] = p.username; });
      setProfileMap(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedOnceRef.current) {
      loadedOnceRef.current = true;
      loadData();
    }
  }, []);

  const updateFavoriteLocally = (id: string, favorited: boolean) => {
    setFavoriteTemplates((prev) => {
      if (favorited) {
        const exists = prev.some(t => t.id === id);
        if (exists) return prev;
        // Get the template from all available sources and use the most up-to-date one
        const source = [...templates, ...featuredTemplates].find(t => t.id === id);
        return source ? [source, ...prev] : prev;
      }
      return prev.filter(t => t.id !== id);
    });
  };

const removeTemplateLocally = (id: string) => {
  setTemplates(prev => prev.filter(t => t.id !== id));
  setFeaturedTemplates(prev => prev.filter(t => t.id !== id));
  setFavoriteTemplates(prev => prev.filter(t => t.id !== id));
};

const setTemplateFavoritesCount = (id: string, count: number) => {
  setTemplates(prev => prev.map(t => t.id === id ? { ...t, favorites_count: count } : t));
  setFeaturedTemplates(prev => prev.map(t => t.id === id ? { ...t, favorites_count: count } : t));
  setFavoriteTemplates(prev => prev.map(t => t.id === id ? { ...t, favorites_count: count } : t));
};

const value = useMemo(() => ({
  templates,
  featuredTemplates,
  favoriteTemplates,
  profileMap,
  loading,
  refresh: loadData,
  updateFavoriteLocally,
  removeTemplateLocally,
  setTemplateFavoritesCount,
}), [templates, featuredTemplates, favoriteTemplates, profileMap, loading]);

  return (
    <TemplatesDataContext.Provider value={value}>
      {children}
    </TemplatesDataContext.Provider>
  );
};

export const useTemplatesData = () => {
  const ctx = useContext(TemplatesDataContext);
  if (!ctx) throw new Error('useTemplatesData must be used within TemplatesDataProvider');
  return ctx;
};
