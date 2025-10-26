import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteIcon } from './HandCraftedIcons';
import { useNavigate } from 'react-router-dom';
import { useTemplatesData } from '@/context/TemplatesDataContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Copy, TrendingUp, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ProductivityIcon, 
  WritingIcon, 
  CodeIcon, 
  MarketingIcon, 
  AnalyticsIcon, 
  CreativeIcon, 
  BusinessIcon, 
  EducationIcon, 
  CustomIcon, 
  SupportIcon 
} from './CategoryIcons';

const categoryIcons: Record<string, React.FC<any>> = {
  Writing: WritingIcon,
  Coding: CodeIcon,
  Code: CodeIcon,
  Marketing: MarketingIcon,
  Support: SupportIcon,
  Productivity: ProductivityIcon,
  Analytics: AnalyticsIcon,
  Creative: CreativeIcon,
  Business: BusinessIcon,
  Education: EducationIcon,
  Custom: CustomIcon,
};

export const TrendingTemplates: React.FC = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { templates, profileMap, loading: dataLoading } = useTemplatesData();

  // Get top 5 most used templates
  const topTemplates = useMemo(() => {
    if (!templates || templates.length === 0) return [];
    
    // Sort by uses_count descending and take top 5
    const sorted = [...templates]
      .sort((a, b) => (b.uses_count || 0) - (a.uses_count || 0))
      .slice(0, 5);
    
    return sorted;
  }, [templates]);

  const checkIfFavorited = async (templateId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return false;

    const { data } = await (supabase as any)
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', templateId)
      .eq('item_type', 'template')
      .maybeSingle();

    return !!data;
  };

  const openPreview = async (template: any) => {
    setPreviewTemplate(template);
    const favorited = await checkIfFavorited(template.id);
    setIsFavorited(favorited);
  };

  const toggleFavorite = async (e?: React.MouseEvent, templateId?: string) => {
    e?.stopPropagation();
    const targetId = templateId || previewTemplate?.id;
    if (!targetId) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      toast.error("Please sign in to favorite templates");
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await Promise.all([
          (supabase as any)
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('item_id', targetId)
            .eq('item_type', 'template'),
          supabase.rpc('decrement_template_favorites', { template_id: targetId })
        ]);
        toast.success("Removed from favorites");
        setIsFavorited(false);
      } else {
        await Promise.all([
          (supabase as any)
            .from('user_favorites')
            .insert({
              user_id: userId,
              item_id: targetId,
              item_type: 'template'
            }),
          supabase.rpc('increment_template_favorites', { template_id: targetId })
        ]);
        toast.success("Added to favorites");
        setIsFavorited(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || "Failed to update favorite");
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      await supabase.rpc('increment_template_uses', { template_id: template.id });
    } catch (error) {
      console.error('Error incrementing template uses:', error);
    }
    navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template.template)}&selectedType=template`);
  };

  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
    toast.success("Template copied to clipboard!");
  };

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M13 2L3 14H11L10 22L21 10H13L13 2Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              Trending Templates
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Most used templates in the last 7 days
            </p>
          </div>
        </div>
        <div className="text-center py-12 glass-card rounded-2xl">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M13 2L3 14H11L10 22L21 10H13L13 2Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Trending Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Most used templates by the community
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      {topTemplates.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <p className="text-muted-foreground">No templates available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topTemplates.map((template, index) => {
            const CategoryIcon = categoryIcons[template.category || 'Writing'] || WritingIcon;
            const username = profileMap[template.user_id] || (template.is_official ? 'PrompTek' : 'Unknown');

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ y: -4, rotateY: 2, rotateX: -2 }}
                style={{ perspective: '1000px' }}
              >
                <Card 
                  className="glass-card p-4 h-full relative overflow-hidden group cursor-pointer"
                  onClick={() => openPreview(template)}
                >
                  {/* Hover reflection sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                  />

                  {/* SVG Thumbnail */}
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center h-20">
                    <CategoryIcon className="text-primary" size={40} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{template.title}</h3>
                    </div>

                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {template.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          {template.category}
                        </Badge>
                      )}
                      {template.is_official && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                          Official
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-muted-foreground">
                        {template.uses_count || 0} uses
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl">{previewTemplate.title}</DialogTitle>
                  <DialogDescription>
                    {previewTemplate.description}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => toggleFavorite(e)}
                  disabled={loading}
                  className="shrink-0 transition-all duration-200 hover:scale-110"
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-300 ${
                      isFavorited 
                        ? 'fill-red-500 text-red-500 scale-110' 
                        : 'text-muted-foreground hover:text-red-500 hover:scale-105'
                    }`} 
                  />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2 items-center flex-wrap">
                {previewTemplate.is_official && (
                  <Badge variant="default" className="gap-1 bg-gradient-to-r from-primary to-primary/80">
                    <ShieldCheck className="w-3 h-3" />
                    Official PromptEK
                  </Badge>
                )}
                {previewTemplate.category && (
                  <Badge variant="secondary">{previewTemplate.category}</Badge>
                )}
                <Link 
                  to={`/user/${profileMap[previewTemplate.user_id] || 'Unknown'}`} 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>@{profileMap[previewTemplate.user_id] || (previewTemplate.is_official ? 'PrompTek' : 'Unknown')}</span>
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="w-3 h-3" />
                  {previewTemplate.favorites_count} favorites
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  {previewTemplate.uses_count} uses
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Template Content</h3>
                <Textarea
                  value={previewTemplate.template}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => copyTemplate(previewTemplate.template)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={() => { handleUseTemplate(previewTemplate); setPreviewTemplate(null); }}>
                  Use This Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
