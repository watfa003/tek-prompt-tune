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
import {
  Search,
  Filter,
  Star,
  Copy,
  Trash2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronDown,
  Sparkles,
  History as HistoryIcon,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { AmbientParticles } from "@/components/ui/ambient-particles";

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
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className={`glass-card interactive-card relative overflow-hidden group transition-all duration-300 ${isHighestRated ? 'neon-border shadow-glow' : 'border-white/10 hover:border-primary/30'}`}>
        {/* Animated Gradient Background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${getScoreColor(item.score)} pointer-events-none`}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Timeline Node with Pulse */}
        <div className="absolute left-0 top-6 w-1 h-16 bg-gradient-to-b from-primary to-transparent">
          <motion.div
            className="absolute top-0 left-0 w-2 h-2 -translate-x-[2px] rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="p-4 md:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                <h3 className="text-base md:text-lg font-bold truncate gradient-text">{item.title}</h3>
                {item.isFavorite && <Star className="h-3 w-3 md:h-4 md:w-4 fill-primary text-primary animate-pulse flex-shrink-0" />}
                {isHighestRated && (
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-glow text-xs whitespace-nowrap">
                    <Trophy className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                    Top Rated
                  </Badge>
                )}
              </div>
              
              {/* Meta Row */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap text-xs md:text-sm">
                <Badge variant="outline" className="glass-panel border-white/10 text-xs whitespace-nowrap">{item.provider}</Badge>
                <Badge variant="outline" className="glass-panel border-white/10 text-xs whitespace-nowrap">{item.outputType}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-2 w-2 md:h-3 md:w-3 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs">{dateLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-2 w-2 md:h-3 md:w-3 text-primary flex-shrink-0" />
                  <span className="font-bold gradient-text text-xs md:text-sm">{(item.score * 100).toFixed(0)}%</span>
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
    <div className="space-y-6 relative">
      {/* Ambient Background Particles */}
      <AmbientParticles />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex items-start gap-3 md:gap-4">
            <motion.div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary bg-size-200 animate-gradient flex items-center justify-center shadow-glow relative overflow-hidden flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <HistoryIcon className="h-6 w-6 md:h-7 md:w-7 text-white relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-200%', '200%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-1 md:mb-2 leading-tight">
                {isSelectingForInfluence ? "Select Favorite for Influence" : "Optimization Timeline"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base lg:text-lg flex items-center gap-2">
                <Zap className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                <span>Your AI prompt evolution journey</span>
              </p>
            </div>
          </div>
          
          {/* Stats Pills */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 md:gap-3 flex-shrink-0"
          >
            <div className="glass-panel border border-white/10 rounded-xl px-3 md:px-4 py-2">
              <div className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Total Prompts</div>
              <div className="text-xl md:text-2xl font-bold gradient-text">{historyItems.length}</div>
            </div>
            <div className="glass-panel border border-white/10 rounded-xl px-3 md:px-4 py-2">
              <div className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Favorites</div>
              <div className="text-xl md:text-2xl font-bold gradient-text">{historyItems.filter(h => h.isFavorite).length}</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel border border-white/10 rounded-[20px] p-4 md:p-5 space-y-3 md:space-y-4 relative z-10 shadow-glow"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
          <Input
            placeholder="Search by title, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 md:pl-12 glass-panel border-white/10 focus:border-primary/50 focus:neon-border text-sm md:text-base"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Filter className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] md:w-[140px] glass-panel border-white/10 text-xs md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 z-50 bg-background">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[120px] md:w-[140px] glass-panel border-white/10 text-xs md:text-sm">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 z-50 bg-background">
              {providers.map(p => <SelectItem key={p} value={p}>{p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[110px] md:w-[140px] glass-panel border-white/10 text-xs md:text-sm">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 z-50 bg-background">
              {scores.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Scores" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* History List */}
      <div className="relative z-10">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              className="inline-block w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-muted-foreground text-lg">Loading your optimization history...</p>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass-card p-16 text-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative z-10">
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <HistoryIcon className="h-10 w-10 text-primary" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 gradient-text">No history yet</h3>
                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                  Start your AI optimization journey by creating your first prompt
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => navigate("/app/ai-agent")}
                    size="lg"
                    className="btn-sheen bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow text-base"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create First Prompt
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    delay: index * 0.05, 
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100
                  }}
                  layout
                >
                  {renderHistoryItem(item, index)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
