import { useState } from "react";
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
  id: number;
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

const historyItems: PromptHistoryItem[] = [
  {
    id: 1,
    title: "Python Merge Sort Function",
    description: "Generate a clean, well-documented Python function for merge sort",
    prompt: "You are an expert software engineer. Write a clean, well-documented Python function that efficiently sorts a list using the merge sort algorithm...",
    output: "def merge_sort(arr: List[int]) -> List[int]:\n    \"\"\"Sorts a list using merge sort algorithm.\"\"\"\n    if len(arr) <= 1:\n        return arr...",
    provider: "OpenAI GPT-4",
    outputType: "Code",
    score: 3,
    timestamp: "2024-01-15 14:30",
    tags: ["python", "sorting", "algorithms"],
    isFavorite: true
  },
  {
    id: 2,
    title: "API Documentation Template",
    description: "Create comprehensive API documentation with examples",
    prompt: "Create comprehensive technical documentation for REST API endpoints. Include overview, parameters, examples...",
    output: "# API Documentation\n\n## Overview\nThis API provides endpoints for managing user data...",
    provider: "Claude",
    outputType: "Essay",
    score: 3,
    timestamp: "2024-01-15 12:15",
    tags: ["api", "documentation", "rest"],
    isFavorite: false
  },
  {
    id: 3,
    title: "JSON Schema Validator",
    description: "Generate JSON schema with validation rules",
    prompt: "Generate a comprehensive JSON schema for user profile data with validation rules...",
    output: "{\n  \"$schema\": \"http://json-schema.org/draft-07/schema#\",\n  \"type\": \"object\"...",
    provider: "Gemini",
    outputType: "JSON",
    score: 2,
    timestamp: "2024-01-14 16:45",
    tags: ["json", "schema", "validation"],
    isFavorite: false
  },
  {
    id: 4,
    title: "Database Schema Design",
    description: "Design optimized database schema for e-commerce",
    prompt: "Design an optimized database schema for an e-commerce platform. Include tables, relationships...",
    output: "-- Users table\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid()...",
    provider: "OpenAI GPT-4",
    outputType: "Structured Data",
    score: 3,
    timestamp: "2024-01-14 09:20",
    tags: ["database", "schema", "ecommerce"],
    isFavorite: true
  },
  {
    id: 5,
    title: "React Component Generator",
    description: "Generate TypeScript React component with hooks",
    prompt: "Generate a TypeScript React component for a data table with sorting, filtering...",
    output: "import React, { useState, useMemo } from 'react';\n\ninterface DataTableProps {\n  data: any[]...",
    provider: "Claude",
    outputType: "Code",
    score: 2,
    timestamp: "2024-01-13 11:10",
    tags: ["react", "typescript", "component"],
    isFavorite: false
  }
];

export const PromptHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterOutputType, setFilterOutputType] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

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
              <p className="text-2xl font-bold">{historyItems.length}</p>
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
                {(historyItems.reduce((sum, item) => sum + item.score, 0) / historyItems.length).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">12</p>
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
                <Button size="sm" variant="outline">
                  <Play className="h-3 w-3 mr-1" />
                  Re-run
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No prompts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};