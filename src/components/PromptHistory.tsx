import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePromptData, type PromptHistoryItem } from "@/context/PromptDataContext";
import { useSettings } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Virtuoso } from "react-virtuoso";
import {
  Search,
  Filter,
  Clock,
  Star,
  Copy,
  Play,
  Trash2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Download,
  Share2,
  Trophy,
  ChevronDown,
  Sparkles,
  History as HistoryIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export const PromptHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterOutputType, setFilterOutputType] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const { historyItems, analytics, loading, toggleFavorite: toggleFavoriteGlobal } = usePromptData();
  const { settings, loading: settingsLoading } = useSettings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isSelectingForInfluence = searchParams.get('selectForInfluence') === 'true';
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites') {
      setActiveTab("favorites");
    } else if (isSelectingForInfluence) {
      setActiveTab("favorites");
    }
  }, [searchParams, isSelectingForInfluence]);

  const filteredItems = useMemo(() => {
    let base = historyItems.filter(item => {
      if (activeTab === "favorites" && !item.isFavorite) return false;
      
      const q = (searchQuery || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const prompt = (item.prompt || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags : [];

      const matchesSearch = 
        title.includes(q) ||
        description.includes(q) ||
        prompt.includes(q) ||
        tags.some(tag => (tag || '').toLowerCase().includes(q));
      
      const providerFilter = (filterProvider || 'all').toLowerCase();
      const providerValue = (item.provider || '').toLowerCase();
      const aliases: Record<string, string[]> = {
        all: [],
        openai: ["openai"],
        gemini: ["gemini", "google"],
        groq: ["groq"],
        anthropic: ["anthropic", "claude"],
        mistral: ["mistral"],
      };
      const matchesProvider =
        providerFilter === "all" ||
        (aliases[providerFilter] || []).some(alias => providerValue.includes(alias)) ||
        providerValue.includes(providerFilter);
      
      const matchesOutputType = (filterOutputType === "all") || 
        ((item.outputType || '').toLowerCase() === (filterOutputType || '').toLowerCase());
      
      const s = typeof item.score === 'number' ? item.score : 0;
      const matchesScore = (filterScore === "all") || 
        (filterScore === "excellent" && s >= 0.8) ||
        (filterScore === "good" && s >= 0.6 && s < 0.8) ||
        (filterScore === "fair" && s >= 0.4 && s < 0.6) ||
        (filterScore === "needs-work" && s < 0.4);
      
      return matchesSearch && matchesProvider && matchesOutputType && matchesScore;
    });

    if (settings.showOnlyBestInHistory) {
      const sessionGroups = new Map<string, PromptHistoryItem[]>();
      
      base.forEach(item => {
        const tsRaw = item.timestamp ? new Date(item.timestamp).getTime() : NaN;
        const ts = Number.isFinite(tsRaw) ? tsRaw : 0;
        const roundedTime = Math.floor(ts / (10 * 60 * 1000));
        const sessionKey = `${(item.prompt || '').substring(0, 100)}_${roundedTime}`;
        
        if (!sessionGroups.has(sessionKey)) {
          sessionGroups.set(sessionKey, []);
        }
        sessionGroups.get(sessionKey)!.push(item);
      });
      
      base = Array.from(sessionGroups.values()).map(group => {
        return group.reduce((best, current) => {
          const bestScore = typeof best.score === 'number' ? best.score : 0;
          const currScore = typeof current.score === 'number' ? current.score : 0;
          if (currScore > bestScore) return current;
          if (currScore === bestScore) {
            const currentTokens = (current.sampleOutput || '').split(/\s+/).length || 0;
            const bestTokens = (best.sampleOutput || '').split(/\s+/).length || 0;
            return currentTokens < bestTokens ? current : best;
          }
          return best;
        });
      });
    }

    return base.sort((a, b) => {
      switch (sortBy) {
        case "newest": {
          const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
        }
        case "oldest": {
          const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return (Number.isFinite(at) ? at : 0) - (Number.isFinite(bt) ? bt : 0);
        }
        case "score":
          return ((typeof b.score === 'number' ? b.score : 0)) - ((typeof a.score === 'number' ? a.score : 0));
        default:
          return 0;
      }
    });
  }, [historyItems, activeTab, searchQuery, filterProvider, filterOutputType, filterScore, sortBy, settings.showOnlyBestInHistory]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} copied`,
      description: `${type} has been copied to clipboard.`,
    });
  };

  const toggleFavorite = async (itemId: string) => {
    const item = historyItems.find(h => h.id === itemId);
    if (!item) return;

    const newFavoriteStatus = !item.isFavorite;
    toggleFavoriteGlobal(itemId);

    toast({
      title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
      description: "Prompt favorite status updated.",
    });
  };

  const renderHistoryItem = (item: PromptHistoryItem, index: number) => {
    const isHighestRated = index === 0 && sortBy === 'score' && filteredItems.length > 1;
    const getScoreColor = (score: number) => {
      if (score >= 0.8) return "from-success/20 to-success/5";
      if (score >= 0.6) return "from-warning/20 to-warning/5";
      if (score >= 0.4) return "from-orange-500/20 to-orange-500/5";
      return "from-destructive/20 to-destructive/5";
    };

    const scoreLabel = item.score >= 0.8 ? "Excellent" : item.score >= 0.6 ? "Good" : item.score >= 0.4 ? "Average" : "Poor";
    const dateLabel = (() => {
      const d = item.timestamp ? new Date(item.timestamp) : null;
      const t = d ? d.getTime() : NaN;
      return Number.isFinite(t) ? d!.toLocaleDateString() : '';
    })();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        key={item.id}
      >
        <Card className={`glass-card interactive-card relative overflow-hidden ${isHighestRated ? 'neon-border' : ''}`}>
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getScoreColor(item.score)} opacity-50 pointer-events-none`} />
          
          {/* Timeline Node */}
          <div className="absolute left-0 top-6 w-1 h-16 bg-gradient-to-b from-primary to-transparent" />

          <div className="p-6 relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold truncate gradient-text">{item.title}</h3>
                  {item.isFavorite && <Star className="h-4 w-4 fill-primary text-primary animate-pulse" />}
                  {isHighestRated && (
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-glow">
                      <Trophy className="h-3 w-3 mr-1" />
                      Top Rated
                    </Badge>
                  )}
                </div>
                
                {/* Meta Row */}
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <Badge variant="outline" className="glass-panel border-white/20">{item.provider}</Badge>
                  <Badge variant="outline" className="glass-panel border-white/20">{item.outputType}</Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {dateLabel}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="font-bold gradient-text">{(item.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="glass-panel border-white/10 hover:border-primary/50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10">
                  <DropdownMenuItem onClick={() => copyToClipboard(item.prompt, "Prompt")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(item.output, "Output")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Optimized
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleFavorite(item.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {item.isFavorite ? "Unfavorite" : "Favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Collapsible Content */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-sm glass-panel border-white/10 hover:border-primary/50 group"
                >
                  <span>Show Details</span>
                  <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      Original Prompt
                    </p>
                    <div className="p-3 glass-panel rounded-xl border border-white/10 max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">{item.prompt}</pre>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      AI Optimization
                    </p>
                    <div className="p-3 glass-panel rounded-xl border border-primary/30 neon-border max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">{item.output}</pre>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/10">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.prompt, "Prompt")} className="glass-panel border-white/10 hover:border-primary/50">
                <Copy className="h-3 w-3 mr-1" />
                Prompt
              </Button>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.output, "Output")} className="glass-panel border-white/10 hover:border-primary/50">
                <Copy className="h-3 w-3 mr-1" />
                Optimized
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const providers = ["all", "openai", "gemini", "groq", "anthropic", "mistral"];
  const outputTypes = ["all", "Code", "Essay", "JSON", "Text", "List"];
  const scores = ["all", "excellent", "good", "fair", "needs-work"];

  return (
    <div className="space-y-6 fade-slide-up">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <HistoryIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">
              {isSelectingForInfluence ? "Select Favorite for Influence" : "Optimization Timeline"}
            </h1>
            <p className="text-muted-foreground text-lg">
              Your AI prompt evolution journey
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel border border-white/10 rounded-[18px] p-4 space-y-4"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search by title, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 glass-panel border-white/10 focus:border-primary/50 focus:neon-border"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] glass-panel border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[140px] glass-panel border-white/10">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {providers.map(p => <SelectItem key={p} value={p}>{p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[140px] glass-panel border-white/10">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {scores.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Scores" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <HistoryIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No history yet</h3>
          <p className="text-muted-foreground mb-4">
            Start optimizing prompts to see them here
          </p>
          <Button 
            onClick={() => navigate("/app/ai-agent")}
            className="btn-sheen bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create First Prompt
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => renderHistoryItem(item, index))}
        </div>
      )}
    </div>
  );
};
