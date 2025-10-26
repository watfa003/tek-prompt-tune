import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WritingIcon, CodingIcon, MarketingIcon, SupportIcon, SearchIcon, FilterIcon, FavoriteIcon } from './HandCraftedIcons';
import { useNavigate } from 'react-router-dom';

interface TrendingTemplate {
  id: string;
  title: string;
  useCase: string;
  category: 'Writing' | 'Coding' | 'Marketing' | 'Support';
  provider: string;
  model: string;
  uses7d: number;
  isFavorite?: boolean;
}

const mockTemplates: TrendingTemplate[] = [
  {
    id: '1',
    title: 'Code Review Assistant',
    useCase: 'Analyze code quality and suggest improvements',
    category: 'Coding',
    provider: 'OpenAI',
    model: 'GPT-4',
    uses7d: 342,
  },
  {
    id: '2',
    title: 'Blog Post Generator',
    useCase: 'Create SEO-optimized blog content',
    category: 'Writing',
    provider: 'Anthropic',
    model: 'Claude',
    uses7d: 289,
  },
  {
    id: '3',
    title: 'Ad Copy Optimizer',
    useCase: 'Generate high-converting ad variations',
    category: 'Marketing',
    provider: 'OpenAI',
    model: 'GPT-4',
    uses7d: 256,
  },
  {
    id: '4',
    title: 'Customer Support Response',
    useCase: 'Craft empathetic support replies',
    category: 'Support',
    provider: 'Anthropic',
    model: 'Claude',
    uses7d: 198,
  },
];

const categoryIcons = {
  Writing: WritingIcon,
  Coding: CodingIcon,
  Marketing: MarketingIcon,
  Support: SupportIcon,
};

export const TrendingTemplates: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const filters = ['All', 'Writing', 'Coding', 'Marketing', 'Support'];

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesFilter = selectedFilter === 'All' || template.category === selectedFilter;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const handleUseTemplate = (template: TrendingTemplate) => {
    navigate(`/app/ai-agent?template=${encodeURIComponent(template.title)}`);
  };

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
            Most used templates in the last 7 days
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 glass-panel border-white/10 focus:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterIcon className="text-muted-foreground flex-shrink-0" size={16} />
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className={`whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-gradient-to-r from-primary to-accent shadow-glow'
                  : 'glass-panel border-white/10 hover:border-primary/50'
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template, index) => {
          const CategoryIcon = categoryIcons[template.category];
          const isFavorite = favorites.has(template.id);

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
                  <CategoryIcon className="text-primary" size={32} />
                </div>

                {/* Content */}
                <div className="space-y-2 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{template.title}</h3>
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

                  <p className="text-xs text-muted-foreground line-clamp-2">{template.useCase}</p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {template.provider}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {template.model}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-muted-foreground">{template.uses7d} uses</span>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="h-7 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl">
          <SearchIcon className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
};
