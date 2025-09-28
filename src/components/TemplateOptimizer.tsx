import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Zap, 
  Save, 
  Star, 
  Copy, 
  RefreshCw, 
  Loader2, 
  FileText,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Template {
  id: string;
  title: string;
  description: string;
  template: string;
  category: string;
  output_type: string;
  rating: number;
  tags: string[];
  created_at: string;
}

interface OptimizationResult {
  bestOptimizedPrompt: string;
  bestScore: number;
  variants: Array<{
    prompt: string;
    strategy: string;
    score: number;
    response: string;
  }>;
  templateSaved?: boolean;
}

export const TemplateOptimizer = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("custom");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  // AI Configuration
  const [aiProvider, setAiProvider] = useState("openai");
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [outputType, setOutputType] = useState("text");
  const [variants, setVariants] = useState(3);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/template-manager?action=get-templates&userId=${user.id}&includePublic=true`);
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error loading templates",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const optimizeTemplate = async () => {
    if (!selectedTemplate) return;

    setIsOptimizing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/prompt-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          originalPrompt: selectedTemplate.template,
          taskDescription: `Optimize template: ${selectedTemplate.title}`,
          aiProvider,
          modelName,
          outputType,
          variants,
          userId: user.id,
          maxTokens,
          temperature,
          mode: 'deep',
          isTemplate: true,
          templateId: selectedTemplate.id,
          saveAsTemplate,
          templateTitle: saveAsTemplate ? templateTitle : '',
          templateDescription: saveAsTemplate ? templateDescription : '',
          templateCategory: saveAsTemplate ? templateCategory : 'custom'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize template');
      }

      const result = await response.json();
      setOptimizationResult(result);
      setOptimizedPrompt(result.bestOptimizedPrompt);

      toast({
        title: "Template optimized!",
        description: `Improved with ${result.summary.bestStrategy} strategy (${(result.bestScore * 100).toFixed(1)}% score)`,
      });

      if (result.templateSaved) {
        toast({
          title: "Template saved!",
          description: "Your optimized template has been saved.",
        });
        loadTemplates(); // Reload templates
      }

    } catch (error) {
      console.error('Error optimizing template:', error);
      toast({
        title: "Optimization failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The optimized prompt has been copied.",
    });
  };

  const categories = ["all", "custom", "code", "writing", "analysis", "marketing"];
  const providers = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "mistral", label: "Mistral" },
    { value: "google", label: "Google" },
    { value: "groq", label: "Groq" }
  ];

  const getModelOptions = () => {
    switch (aiProvider) {
      case "openai":
        return ["gpt-5-2025-08-07", "gpt-5-mini-2025-08-07", "gpt-5-nano-2025-08-07", "gpt-4.1-2025-04-14", "gpt-4o", "gpt-4o-mini"];
      case "anthropic":
        return ["claude-opus-4-1-20250805", "claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"];
      case "mistral":
        return ["mistral-large", "mistral-medium"];
      case "google":
        return ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro", "gemini-ultra"];
      case "groq":
        return ["llama-3.1-8b"];
      default:
        return ["gpt-4o-mini"];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Optimizer</h1>
          <p className="text-muted-foreground">Optimize your existing prompt templates with AI</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="Enter template title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'all').map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsDialogOpen(false)} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Template to Optimize</h2>
          
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
                <p className="text-sm">Create your first template to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description || template.template.slice(0, 100) + '...'}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          <div className="flex items-center">
                            {Array.from({ length: template.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Optimization Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Optimization Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>AI Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Model</Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelOptions().map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Output Type</Label>
                <Select value={outputType} onValueChange={setOutputType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Variants</Label>
                <Select value={variants.toString()} onValueChange={(v) => setVariants(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="saveAsTemplate" 
                checked={saveAsTemplate} 
                onCheckedChange={(checked) => setSaveAsTemplate(checked as boolean)} 
              />
              <Label htmlFor="saveAsTemplate">Save optimized result as new template</Label>
            </div>

            {saveAsTemplate && (
              <div className="space-y-3">
                <Input
                  placeholder="Template title"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                />
                <Input
                  placeholder="Template description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            )}

            <Button 
              onClick={optimizeTemplate} 
              disabled={!selectedTemplate || isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Template
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Results */}
      {optimizationResult && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Optimization Results</h2>
            <div className="flex items-center space-x-2">
              <Badge className="bg-success text-success-foreground">
                Score: {(optimizationResult.bestScore * 100).toFixed(1)}%
              </Badge>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(optimizedPrompt)}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Original Template</Label>
              <Textarea
                value={selectedTemplate?.template || ''}
                readOnly
                className="min-h-[100px] bg-muted"
              />
            </div>
            
            <div>
              <Label>Optimized Version</Label>
              <Textarea
                value={optimizedPrompt}
                onChange={(e) => setOptimizedPrompt(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimizationResult.variants.map((variant, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{variant.strategy}</Badge>
                    <div className="text-sm font-medium">
                      {(variant.score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {variant.prompt.slice(0, 150)}...
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};