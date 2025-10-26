import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteIcon } from './HandCraftedIcons';
import { useNavigate } from 'react-router-dom';
import { useTemplatesData } from '@/context/TemplatesDataContext';

import ProductivityIcon from '@/assets/category-productivity.svg';
import WritingIcon from '@/assets/category-writing.svg';
import CodeIcon from '@/assets/category-code.svg';
import MarketingIcon from '@/assets/category-marketing.svg';
import AnalyticsIcon from '@/assets/category-analytics.svg';
import CreativeIcon from '@/assets/category-creative.svg';
import BusinessIcon from '@/assets/category-business.svg';
import EducationIcon from '@/assets/category-education.svg';
import CustomIcon from '@/assets/category-custom.svg';
import SupportIcon from '@/assets/category-support.svg';

const categoryIcons: Record<string, string> = {
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
  const navigate = useNavigate();
  const { templates, profileMap, loading } = useTemplatesData();

  // Get top 5 most used templates
  const topTemplates = useMemo(() => {
    if (!templates || templates.length === 0) return [];
    
    // Sort by uses_count descending and take top 5
    const sorted = [...templates]
      .sort((a, b) => (b.uses_count || 0) - (a.uses_count || 0))
      .slice(0, 5);
    
    return sorted;
  }, [templates]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUseTemplate = (template: any) => {
    navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(template.template)}&selectedType=template`);
  };

  if (loading) {
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
            const categoryIconSrc = categoryIcons[template.category || 'Writing'] || WritingIcon;
            const isFavorite = favorites.has(template.id);
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
                <Card className="glass-card p-4 h-full relative overflow-hidden group cursor-pointer">
                  {/* Hover reflection sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                  />

                  {/* SVG Thumbnail */}
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center h-20">
                    <img src={categoryIconSrc} alt={template.category || 'Category'} className="w-10 h-10 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{template.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(template.id);
                        }}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        <FavoriteIcon
                          className={isFavorite ? 'text-primary' : 'text-muted-foreground'}
                          size={16}
                          filled={isFavorite}
                        />
                      </button>
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
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="h-7 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
