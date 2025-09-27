import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePromptData, type PromptHistoryItem } from "@/context/PromptDataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isSelectingForInfluence = searchParams.get('selectForInfluence') === 'true';

  // When selecting for influence, auto-switch to favorites tab
  React.useEffect(() => {
    if (isSelectingForInfluence) {
      setActiveTab("favorites");
    }
  }, [isSelectingForInfluence]);


  const filteredItems = historyItems.filter(item => {
    // Filter by tab (all or favorites)
    if (activeTab === "favorites" && !item.isFavorite) return false;
    
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProvider = filterProvider === "all" || 
      item.provider.toLowerCase().includes(filterProvider.toLowerCase()) ||
      (filterProvider === "OpenAI" && item.provider.toLowerCase().includes("openai")) ||
      (filterProvider === "Claude" && item.provider.toLowerCase().includes("claude")) ||
      (filterProvider === "Gemini" && item.provider.toLowerCase().includes("gemini")) ||
      (filterProvider === "Groq" && item.provider.toLowerCase().includes("groq"));
    
    const matchesOutputType = filterOutputType === "all" || 
      item.outputType.toLowerCase() === filterOutputType.toLowerCase();
    
    const matchesScore = filterScore === "all" || 
      (filterScore === "excellent" && item.score >= 0.8) ||
      (filterScore === "good" && item.score >= 0.6 && item.score < 0.8) ||
      (filterScore === "fair" && item.score >= 0.4 && item.score < 0.6) ||
      (filterScore === "needs-work" && item.score < 0.4);
    
    return matchesSearch && matchesProvider && matchesOutputType && matchesScore;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case "oldest":
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case "score":
        return (b.score || 0) - (a.score || 0);
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getScoreBadge = (score: number) => {
    // Handle decimal scores properly
    if (score >= 0.8) return <Badge className="bg-success text-success-foreground">Excellent (≥0.8)</Badge>;
    if (score >= 0.6) return <Badge className="bg-warning text-warning-foreground">Good (≥0.6)</Badge>;
    if (score >= 0.4) return <Badge className="bg-accent text-accent-foreground">Fair (≥0.4)</Badge>;
    return <Badge variant="destructive">Needs Work (&lt;0.4)</Badge>;
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

    // Update via global provider so state persists across tabs
    toggleFavoriteGlobal(itemId);

    toast({
      title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
      description: "Prompt favorite status updated.",
    });
  };

  const providers = ["all", "openai", "claude", "gemini", "groq", "anthropic", "mistral"];
  const outputTypes = ["all", "Code", "Essay", "JSON", "Structured Data", "Variant", "text", "list"];
  const scores = ["all", "excellent", "good", "fair", "needs-work"];

  return (
    <div className="space-y-6">
      {/* Influence Selection Banner */}
      {isSelectingForInfluence && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-medium text-primary mb-1">Select a Favorite Prompt for Influence</h3>
          <p className="text-sm text-muted-foreground">
            Choose a favorite prompt to influence your AI optimization process.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prompt History</h1>
          <p className="text-muted-foreground">
            {isSelectingForInfluence ? "Select a favorite prompt to influence optimization" : "Browse and manage your saved prompts and results"}
          </p>
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
      <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "all" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All History ({historyItems.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "favorites" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
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
                     score === "excellent" ? "Excellent (≥0.8)" :
                     score === "good" ? "Good (0.6-0.8)" :
                     score === "fair" ? "Fair (0.4-0.6)" :
                     "Needs Work (<0.4)"}
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
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* History Items */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => {
          const isHighestRated = index === 0 && sortBy === 'score' && filteredItems.length > 1;
          // Show top performer badge for the best variant (regardless of actual score)
          const isTopPerformer = item.isBestVariant === true;
          
          return (
            <Card key={item.id} className={`p-6 hover:shadow-card transition-shadow ${isHighestRated ? 'ring-2 ring-primary shadow-lg' : ''}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {isTopPerformer && <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                        <Trophy className="h-3 w-3 mr-1" />
                        Top Performer
                      </Badge>}
                      {item.isFavorite && <Star className="h-4 w-4 fill-primary text-primary" />}
                    </div>
                  <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                  
                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.provider}</Badge>
                    <Badge variant="outline">{item.outputType}</Badge>
                    {getScoreBadge(item.score)}
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.timestamp}
                    </span>
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
                      Copy Output
                    </DropdownMenuItem>
                    {item.sampleOutput && (
                      <DropdownMenuItem onClick={() => copyToClipboard(item.sampleOutput, "Sample Output")}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Sample Output
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Re-run
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFavorite(item.id)}>
                      <Star className="h-4 w-4 mr-2" />
                      {item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Original Prompt:</p>
                  <div className="p-3 bg-muted/50 rounded-md border text-sm max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed">{item.prompt}</pre>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Optimization Result:</p>
                  <div className="p-3 bg-secondary/20 rounded-md border text-sm max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed">{item.output}</pre>
                  </div>
                </div>

                {item.sampleOutput && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sample Output:</p>
                    <div className="p-3 bg-success/10 rounded-md border text-sm max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">{item.sampleOutput}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.prompt, "Prompt")}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Prompt
                </Button>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.output, "Output")}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Output
                </Button>
                {item.sampleOutput && (
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.sampleOutput, "Sample Output")}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Sample
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (isSelectingForInfluence) {
                      console.log('Favorite selected for influence:', item.prompt);
                      navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(item.prompt)}&selectedType=favorite`);
                    }
                  }}
                  style={{ display: isSelectingForInfluence ? 'flex' : 'none' }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Select for Influence
                </Button>
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
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