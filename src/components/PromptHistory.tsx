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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { format, parseISO, isValid as isValidDate } from "date-fns";

export const PromptHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterOutputType, setFilterOutputType] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const { historyItems, analytics, loading, toggleFavorite: toggleFavoriteGlobal, generateTitleAndApply } = usePromptData();
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

  // Component no longer auto-generates titles - Provider handles it centrally

  // Log history items to verify titles are present
  React.useEffect(() => {
    console.log('[PromptHistory] History items updated:', {
      count: historyItems.length,
      firstFewTitles: historyItems.slice(0, 3).map(h => ({ id: h.id, title: h.title }))
    });
  }, [historyItems]);

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
        (filterScore === "excellent" && s >= 8) ||
        (filterScore === "good" && s >= 6 && s < 8) ||
        (filterScore === "fair" && s >= 4 && s < 6) ||
        (filterScore === "needs-work" && s < 4);
      
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
    const score = typeof item.score === 'number' ? item.score : 0;
    const scoreColor = score >= 8 ? "text-green-400" : score >= 6 ? "text-yellow-400" : "text-orange-400";
    const scoreBg = score >= 8 ? "bg-green-500/10 border-green-500/20" : score >= 6 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-orange-500/10 border-orange-500/20";
    const scoreLabel = score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Average" : "Poor";
    
    // Format date safely
    const formatDate = (timestamp: any) => {
      try {
        if (!timestamp) return "Unknown date";
        // Prefer ISO parsing; fallback to Date constructor
        const parsed = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
        const dateObj = isValidDate(parsed) ? parsed : new Date(timestamp);
        if (!isValidDate(dateObj) || isNaN(dateObj.getTime())) return "Unknown date";
        return format(dateObj, "PP p");
      } catch {
        return "Unknown date";
      }
    };

    return (
      <Card key={item.id} className="p-4 sm:p-6 hover:shadow-lg hover:shadow-primary/5 transition-all w-full max-w-full overflow-hidden box-border border-l-4 border-l-primary/50">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 w-full">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-base sm:text-lg font-semibold truncate max-w-full cursor-help">
                      {item.title || item.description || 'Untitled'}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="font-semibold">{item.title || item.description || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {formatDate(item.timestamp)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {item.isFavorite && <Star className="h-4 w-4 fill-accent text-accent flex-shrink-0 animate-pulse" />}
              {item.isBestVariant && <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground mb-2 whitespace-normal break-words">{item.description}</p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/30 text-primary">{item.provider}</Badge>
              <Badge variant="outline" className="text-xs bg-accent/5 border-accent/30 text-accent">{item.outputType}</Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0 text-primary" />
                <span className="text-xs">{formatDate(item.timestamp)}</span>
              </div>
              <Badge className={`text-xs ${scoreBg} ${scoreColor} border`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {score.toFixed(1)}/10 {scoreLabel}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-dropdown bg-popover">
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

        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-sm hover:bg-primary/5">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Show Details
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4 w-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <div className="space-y-2 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Original Prompt
                </p>
                <div className="p-3 bg-muted/50 rounded-lg overflow-x-auto border border-muted">
                  <pre className="whitespace-pre-wrap text-sm break-words">{item.prompt}</pre>
                </div>
              </div>
              
              <div className="space-y-2 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Optimization
                </p>
                <div className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/30 overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-sm break-words">{item.output}</pre>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-primary/10 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.prompt, "Prompt")} className="hover:bg-accent/10 hover:border-accent">
            <Copy className="h-3 w-3 mr-1" />
            Copy Prompt
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.output, "Output")} className="hover:bg-primary/10 hover:border-primary">
            <Copy className="h-3 w-3 mr-1" />
            Copy Optimized
          </Button>
          <Button 
            size="sm" 
            variant={item.isFavorite ? "default" : "outline"} 
            onClick={() => toggleFavorite(item.id)}
            className={item.isFavorite ? "bg-accent hover:bg-accent/80" : "hover:bg-accent/10 hover:border-accent"}
          >
            <Star className={`h-3 w-3 mr-1 ${item.isFavorite ? "fill-current" : ""}`} />
            {item.isFavorite ? "Favorited" : "Favorite"}
          </Button>
          {(item.isFavorite || isSelectingForInfluence) && (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => {
                const influenceText = item.output || item.prompt;
                navigate(`/app/ai-agent?influence=${encodeURIComponent(influenceText)}`);
                toast({
                  title: "Influence Applied",
                  description: "The optimized prompt has been set as your influence.",
                });
              }}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Use as Influence
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const providers = ["all", "openai", "gemini", "groq", "anthropic", "mistral"];
  const outputTypes = ["all", "Code", "Essay", "JSON", "Text", "List"];
  const scores = ["all", "excellent", "good", "fair", "needs-work"];

  return (
    <div className="w-full max-w-full space-y-6 relative overflow-hidden box-border">
      {/* Ambient Background Particles */}
      <AmbientParticles />

      {/* Header */}
      <div className="relative z-10 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {isSelectingForInfluence ? "Select Favorite for Influence" : "Prompt History"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Your AI prompt optimization timeline
            </p>
          </div>
          
          <div className="flex gap-3 flex-shrink-0">
            <Card className="px-4 py-2 bg-primary/5 border-primary/20">
              <div className="text-2xl font-bold text-primary">{historyItems.length}</div>
              <div className="text-xs text-muted-foreground">Total Prompts</div>
            </Card>
            <Card className="px-4 py-2 bg-accent/5 border-accent/20">
              <div className="text-2xl font-bold text-accent">{historyItems.filter(h => h.isFavorite).length}</div>
              <div className="text-xs text-muted-foreground">Favorites</div>
            </Card>
          </div>
        </div>

        {/* Favorites Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="gap-2"
          >
            <HistoryIcon className="h-4 w-4" />
            All History
          </Button>
          <Button
            variant={activeTab === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("favorites")}
            className="gap-2"
          >
            <Star className={`h-4 w-4 ${activeTab === "favorites" ? "fill-current" : ""}`} />
            Favorites Only
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 space-y-4 relative z-10 w-full max-w-full overflow-hidden box-border">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by title, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-dropdown bg-popover">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="z-dropdown bg-popover">
              {providers.map(p => <SelectItem key={p} value={p}>{p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent className="z-dropdown bg-popover">
              {scores.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Scores" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History List */}
      <div className="relative z-10 w-full max-w-full overflow-hidden box-border">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center w-full max-w-full">
            <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your AI optimization journey by creating your first prompt
            </p>
            <Button onClick={() => navigate("/app/ai-agent")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 w-full max-w-full">
            {filteredItems.map((item, index) => (
              renderHistoryItem(item, index)
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
