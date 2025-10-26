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
    const scoreColor = item.score >= 0.8 ? "text-green-500" : item.score >= 0.6 ? "text-yellow-500" : "text-orange-500";
    const scoreLabel = item.score >= 0.8 ? "Excellent" : item.score >= 0.6 ? "Good" : item.score >= 0.4 ? "Average" : "Poor";

    return (
      <Card key={item.id} className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.isFavorite && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <Badge variant="outline">{item.provider}</Badge>
              <Badge variant="outline">{item.outputType}</Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className={`h-3 w-3 ${scoreColor}`} />
                <span className={scoreColor}>{(item.score * 100).toFixed(0)}% ({scoreLabel})</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-sm">
              <span>Show Details</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Original Prompt</p>
                <div className="p-3 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{item.prompt}</pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-primary">AI Optimization</p>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <pre className="whitespace-pre-wrap text-sm">{item.output}</pre>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t">
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.prompt, "Prompt")}>
            <Copy className="h-3 w-3 mr-1" />
            Prompt
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.output, "Output")}>
            <Copy className="h-3 w-3 mr-1" />
            Optimized
          </Button>
        </div>
      </Card>
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
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {isSelectingForInfluence ? "Select Favorite for Influence" : "Prompt History"}
            </h1>
            <p className="text-muted-foreground">
              Your AI prompt optimization timeline
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{historyItems.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{historyItems.filter(h => h.isFavorite).length}</div>
              <div className="text-xs text-muted-foreground">Favorites</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 space-y-4 relative z-10">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by title, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(p => <SelectItem key={p} value={p}>{p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              {scores.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Scores" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History List */}
      <div className="relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
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
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              renderHistoryItem(item, index)
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
