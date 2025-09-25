import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromptHistoryItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  output: string;
  provider: string;
  outputType: string;
  score: number;
  timestamp: string;
  tags: string[];
  isFavorite: boolean;
}

export const PromptHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterOutputType, setFilterOutputType] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isSelectingForInfluence = searchParams.get('selectForInfluence') === 'true';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use same analytics call as dashboard - 7d timeframe
        const url = new URL('https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/ai-analytics');
        url.searchParams.set('userId', user.id);
        url.searchParams.set('timeframe', '7d');

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA',
          },
        });

        if (response.ok) {
          const analyticsData = await response.json();
          setAnalytics(analyticsData);
          
          // Transform recent activity into history items - use ALL recent activity for history
          const historyFromAnalytics = analyticsData.recentActivity?.map((activity: any) => ({
            id: activity.id,
            title: `Prompt Optimization - ${activity.provider}`,
            description: `Generated using ${activity.model} with score ${activity.score}`,
            prompt: "Optimized prompt content", // We don't have the actual prompt content in analytics
            output: "Generated output content", // We don't have the actual output content in analytics
            provider: activity.provider,
            outputType: "Code", // Default since we don't have this in analytics
            score: activity.score,
            timestamp: new Date(activity.createdAt).toLocaleString(),
            tags: [activity.provider.toLowerCase(), activity.model.toLowerCase().replace(/[^a-z0-9]/g, '-')],
            isFavorite: false
          })) || [];
          
          setHistoryItems(historyFromAnalytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProvider = filterProvider === "all" || item.provider.includes(filterProvider);
    const matchesOutputType = filterOutputType === "all" || item.outputType === filterOutputType;
    const matchesScore = filterScore === "all" || item.score.toString() === filterScore;
    
    return matchesSearch && matchesProvider && matchesOutputType && matchesScore;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case "oldest":
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case "score":
        return b.score - a.score;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score === 2) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} copied`,
      description: `${type} has been copied to clipboard.`,
    });
  };

  const providers = ["all", "OpenAI", "Claude", "Gemini", "Groq"];
  const outputTypes = ["all", "Code", "Essay", "JSON", "Structured Data"];
  const scores = ["all", "3", "2", "1"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prompt History</h1>
          <p className="text-muted-foreground">
            Browse and manage your saved prompts and results
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
                    {provider === "all" ? "All Providers" : provider}
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
                    {score === "all" ? "All Scores" : `${score} Stars`}
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
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-card transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
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
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Re-run
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Prompt:</p>
                  <div className="p-3 bg-muted/50 rounded-md border text-sm">
                    <p className="line-clamp-3">{item.prompt}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Output:</p>
                  <div className="p-3 bg-secondary/20 rounded-md border text-sm font-mono">
                    <pre className="line-clamp-3 whitespace-pre-wrap">{item.output}</pre>
                  </div>
                </div>
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (isSelectingForInfluence) {
                      navigate(`/app/ai-agent?selectedTemplate=${encodeURIComponent(item.prompt)}&selectedType=saved`);
                    }
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {isSelectingForInfluence ? 'Select for Influence' : 'Re-run'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
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