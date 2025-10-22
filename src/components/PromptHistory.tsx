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
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

   // Handle tab from URL params and selecting for influence
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
      // Filter by tab (all or favorites)
      if (activeTab === "favorites" && !item.isFavorite) return false;
      
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const providerFilter = filterProvider.toLowerCase();
      const providerValue = (item.provider || "").toLowerCase();
      const aliases: Record<string, string[]> = {
        all: [],
        openai: ["openai"],
        gemini: ["gemini", "google"], // DB stores Gemini as "google"
        groq: ["groq"],
        anthropic: ["anthropic", "claude"],
        mistral: ["mistral"],
      };
      const matchesProvider =
        providerFilter === "all" ||
        aliases[providerFilter]?.some(alias => providerValue.includes(alias)) ||
        providerValue.includes(providerFilter);
      
      const matchesOutputType = filterOutputType === "all" || 
        item.outputType.toLowerCase() === filterOutputType.toLowerCase();
      
      const matchesScore = filterScore === "all" || 
        (filterScore === "excellent" && item.score >= 0.8) ||
        (filterScore === "good" && item.score >= 0.6 && item.score < 0.8) ||
        (filterScore === "fair" && item.score >= 0.4 && item.score < 0.6) ||
        (filterScore === "needs-work" && item.score < 0.4);
      
      return matchesSearch && matchesProvider && matchesOutputType && matchesScore;
    });

    // Apply "show only best in history" filter if enabled
    if (settings.showOnlyBestInHistory) {
      // Group items by optimization session (items with same original prompt and close timestamps)
      const sessionGroups = new Map<string, PromptHistoryItem[]>();
      
      base.forEach(item => {
        // Create a session key using original prompt + rounded timestamp (within 10 minutes)
        const timestamp = new Date(item.timestamp).getTime();
        const roundedTime = Math.floor(timestamp / (10 * 60 * 1000)); // 10-minute windows
        const sessionKey = `${item.prompt.substring(0, 100)}_${roundedTime}`;
        
        if (!sessionGroups.has(sessionKey)) {
          sessionGroups.set(sessionKey, []);
        }
        sessionGroups.get(sessionKey)!.push(item);
      });
      
      // From each session group, only keep the highest scoring variant
      base = Array.from(sessionGroups.values()).map(group => {
        return group.reduce((best, current) => {
          if (current.score > best.score) return current;
          if (current.score === best.score) {
            // Tiebreaker: prefer fewer tokens
            const currentTokens = current.sampleOutput?.split(/\s+/).length || 0;
            const bestTokens = best.sampleOutput?.split(/\s+/).length || 0;
            return currentTokens < bestTokens ? current : best;
          }
          return best;
        });
      });
    }

    return base.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "score":
          return (b.score || 0) - (a.score || 0);
        default:
          return 0;
      }
    });
  }, [historyItems, activeTab, searchQuery, filterProvider, filterOutputType, filterScore, sortBy, settings.showOnlyBestInHistory]);

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500 text-white">Excellent (0.8+)</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500 text-white">Good (0.6-0.8)</Badge>;
    if (score >= 0.4) return <Badge className="bg-orange-500 text-white">Average (0.4-0.6)</Badge>;
    return <Badge className="bg-red-500 text-white">Poor (0-0.4)</Badge>;
  };

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
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    let isBestInSession = false;
    if (!settingsLoading && settings.showOnlyBestInHistory === false) {
      const timestamp = new Date(item.timestamp).getTime();
      const roundedTime = Math.floor(timestamp / (10 * 60 * 1000));
      const sessionKey = `${item.prompt.substring(0, 100)}_${roundedTime}`;
      
      const sessionItems = historyItems.filter(historyItem => {
        const historyTimestamp = new Date(historyItem.timestamp).getTime();
        const historyRoundedTime = Math.floor(historyTimestamp / (10 * 60 * 1000));
        const historySessionKey = `${historyItem.prompt.substring(0, 100)}_${historyRoundedTime}`;
        return historySessionKey === sessionKey;
      });
      
      const bestInSession = sessionItems.reduce((best, current) => {
        if (current.score > best.score) return current;
        if (current.score === best.score) {
          const currentTokens = current.sampleOutput?.split(/\s+/).length || 0;
          const bestTokens = best.sampleOutput?.split(/\s+/).length || 0;
          return currentTokens < bestTokens ? current : best;
        }
        return best;
      });
      isBestInSession = item.id === bestInSession.id && sessionItems.length > 1;
    }

    const getScoreColor = (score: number) => {
      if (score >= 0.8) return "border-l-green-500";
      if (score >= 0.6) return "border-l-yellow-500";
      if (score >= 0.4) return "border-l-orange-500";
      return "border-l-red-500";
    };

    const scoreLabel = item.score >= 0.8 ? "Excellent" : item.score >= 0.6 ? "Good" : item.score >= 0.4 ? "Average" : "Poor";

    return (
      <Card 
        key={item.id} 
        className={`border-l-4 ${getScoreColor(item.score)} hover:shadow-lg transition-all duration-200 ${isHighestRated ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="p-5 space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold truncate">{item.title}</h3>
                {isBestInSession && (
                  <Badge variant="outline" className="text-success border-success bg-success/10 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    Best
                  </Badge>
                )}
                {item.isFavorite && <Star className="h-4 w-4 fill-primary text-primary flex-shrink-0" />}
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.timestamp}
                </span>
              </div>
              
              {/* Compact Meta Row */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge variant="outline" className="text-xs">{item.provider}</Badge>
                <Badge variant="outline" className="text-xs">{item.outputType}</Badge>
                {settings.showScores && (
                  <Badge className={`text-xs ${
                    item.score >= 0.8 ? "bg-success/10 text-success border-success/20" :
                    item.score >= 0.6 ? "bg-warning/10 text-warning border-warning/20" :
                    item.score >= 0.4 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  }`} variant="outline">
                    {scoreLabel}
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
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
                {item.sampleOutput && (
                  <DropdownMenuItem onClick={() => copyToClipboard(item.sampleOutput, "AI Output")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy AI Output
                  </DropdownMenuItem>
                )}
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

          {/* Collapsible Content Section */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
              >
                <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-3">
              {/* Two-Column Layout for Prompts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* User Input */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Input</p>
                  <div className="p-3 bg-muted/30 rounded-md border border-border/50 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono">{item.prompt}</pre>
                  </div>
                </div>
                
                {/* AI Optimization */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">AI Optimization</p>
                  <div className="p-3 bg-primary/5 rounded-md border border-primary/20 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono">{item.output}</pre>
                  </div>
                </div>
              </div>

              {/* AI Response Output */}
              {item.sampleOutput && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-success uppercase tracking-wide">AI Response</p>
                  <div className="p-3 bg-success/5 rounded-md border border-success/20 max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono">{item.sampleOutput}</pre>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.prompt, "Prompt")} className="text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Prompt
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.output, "Output")} className="text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Optimized
            </Button>
            {item.sampleOutput && (
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.sampleOutput, "AI Output")} className="text-xs">
                <Copy className="h-3 w-3 mr-1" />
                AI Output
              </Button>
            )}
            {isSelectingForInfluence && (
              <Button 
                size="sm" 
                variant="default"
                onClick={async () => {
                  setIsNavigating(true);
                  await new Promise(resolve => setTimeout(resolve, 100));
                  navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(item.output)}&selectedType=favorite`);
                }}
                disabled={isNavigating}
                className="text-xs ml-auto"
              >
                {isNavigating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                    Selecting...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Select for Influence
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const providers = ["all", "openai", "gemini", "groq", "anthropic", "mistral"];
  const outputTypes = ["all", "Code", "Essay", "JSON", "Text", "List"];
  const scores = ["all", "excellent", "good", "fair", "needs-work"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isSelectingForInfluence ? "Select Favorite for Influence" : "Prompt History"}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-muted/50 rounded-lg w-fit border border-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "all" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All History ({historyItems.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "favorites" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Star className="h-4 w-4 mr-1 inline" />
          Favorites ({historyItems.filter(item => item.isFavorite).length})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Prompts</p>
              <p className="text-2xl font-bold">{analytics?.overview?.totalPrompts || historyItems.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Favorites</p>
              <p className="text-2xl font-bold">{historyItems.filter(item => item.isFavorite).length}</p>
            </div>
          </div>
        </Card>
        
        {settings.showScores && (
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {analytics?.overview?.averageScore?.toFixed(1) || (historyItems.length > 0 ? (historyItems.reduce((sum, item) => sum + item.score, 0) / historyItems.length).toFixed(1) : '0.0')}
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{analytics?.performance?.dailyStats?.reduce((sum: number, day: any) => sum + day.prompts, 0) || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider === "all" ? "All Providers" : 
                     provider === "openai" ? "OpenAI" :
                     provider === "claude" ? "Claude" :
                     provider === "anthropic" ? "Anthropic" :
                     provider === "gemini" ? "Gemini" :
                     provider === "groq" ? "Groq" :
                     provider === "mistral" ? "Mistral" :
                     provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterOutputType} onValueChange={setFilterOutputType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Output Type" />
              </SelectTrigger>
              <SelectContent>
                {outputTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterScore} onValueChange={setFilterScore}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                {scores.map(score => (
                  <SelectItem key={score} value={score}>
                    {score === "all" ? "All Scores" : 
                     score === "excellent" ? "Excellent (0.8+)" :
                     score === "good" ? "Good (0.6-0.8)" :
                     score === "fair" ? "Average (0.4-0.6)" :
                     "Poor (0-0.4)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="score">Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* History Items */}
      {filteredItems.length > 60 ? (
        <div className="mt-2" style={{ height: 'calc(100vh - 260px)' }}>
          <Virtuoso
            data={filteredItems}
            overscan={300}
            itemContent={(index, item: PromptHistoryItem) => (
              <div className="mb-4">
                {renderHistoryItem(item, index)}
              </div>
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => renderHistoryItem(item, index))}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Loading history...</h3>
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No prompts found</h3>
          <p className="text-muted-foreground">
            {historyItems.length === 0 ? "Start optimizing prompts to see your history here!" : "Try adjusting your search or filter criteria"}
          </p>
        </div>
      )}
    </div>
  );
};