import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptResultsProps {
  taskDescription: string;
  aiProvider: string;
  llmModel: string;
  outputType: string;
  influence?: string;
  influenceType?: string;
  influenceWeight?: number;
}

// Mock data for demonstration
const mockResults = [
  {
    id: 1,
    prompt: "You are an expert software engineer. Write a clean, well-documented Python function that efficiently sorts a list using the merge sort algorithm. Include type hints, docstrings, and error handling.",
    output: "def merge_sort(arr: List[int]) -> List[int]:\n    \"\"\"Sorts a list using merge sort algorithm.\"\"\"\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)",
    score: 3,
    provider: "OpenAI GPT-4",
    metrics: { clarity: 9, accuracy: 10, efficiency: 8 }
  },
  {
    id: 2,
    prompt: "Create a Python function to sort a list. Requirements: Use merge sort algorithm, include proper documentation, add type annotations, and handle edge cases appropriately.",
    output: "from typing import List\n\ndef merge_sort(data: List[int]) -> List[int]:\n    if not data or len(data) <= 1:\n        return data\n    # Split and conquer approach\n    middle = len(data) // 2\n    return merge(merge_sort(data[:middle]), merge_sort(data[middle:]))",
    score: 3,
    provider: "OpenAI GPT-4",
    metrics: { clarity: 8, accuracy: 9, efficiency: 9 }
  },
  {
    id: 3,
    prompt: "Write a Python function that sorts a list using merge sort. Make it production-ready with proper error handling.",
    output: "def merge_sort(arr):\n    if len(arr) > 1:\n        mid = len(arr) // 2\n        left_half = arr[:mid]\n        right_half = arr[mid:]\n        merge_sort(left_half)\n        merge_sort(right_half)\n        # Merge logic here\n        return arr",
    score: 2,
    provider: "OpenAI GPT-4",
    metrics: { clarity: 6, accuracy: 7, efficiency: 6 }
  }
];

export const PromptResults = ({ taskDescription, aiProvider, llmModel, outputType, influence, influenceType, influenceWeight }: PromptResultsProps) => {
  const { toast } = useToast();

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score === 2) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Prompt has been copied successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Generated Prompts</h2>
          <Badge variant="outline">{mockResults.length} variants generated</Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-6">
          <p><strong>Task:</strong> {taskDescription}</p>
          <p><strong>Provider:</strong> {aiProvider} • <strong>Output Type:</strong> {outputType}</p>
          {influence && (
            <p><strong>Influenced by:</strong> {influenceType === "template" ? "Template" : "Saved Prompt"} - {influence}</p>
          )}
        </div>

        <div className="space-y-4">
          {mockResults.map((result, index) => (
            <Card key={result.id} className="p-4 border-border/40">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Variant {index + 1}</Badge>
                  {getScoreBadge(result.score)}
                  {index === 0 && <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" />Top Ranked</Badge>}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.prompt)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Optimized Prompt:</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md border">
                    <p className="text-sm">{result.prompt}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Generated Output:</Label>
                  <div className="mt-1 p-3 bg-secondary/20 rounded-md border font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{result.output}</pre>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Clarity: {result.metrics.clarity}/10</span>
                  <span>Accuracy: {result.metrics.accuracy}/10</span>
                  <span>Efficiency: {result.metrics.efficiency}/10</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline">
            Generate More Variants
            <RefreshCw className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Helper component for labels
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium ${className}`}>{children}</div>
);