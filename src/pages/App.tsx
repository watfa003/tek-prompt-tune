import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PromptResults } from "@/components/PromptResults";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { ArrowLeft, Settings, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const AppPage = () => {
  const [taskDescription, setTaskDescription] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [outputType, setOutputType] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [variants, setVariants] = useState("3");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("1000");
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = () => {
    if (taskDescription && aiProvider && outputType) {
      setShowResults(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PrompTek</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="generator" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Prompt Generator</TabsTrigger>
            <TabsTrigger value="dashboard">Performance Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-8">
            {/* Input Section */}
            <Card className="p-6 shadow-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-primary" />
                Configure Your Prompt
              </h2>

              <div className="space-y-6">
                {/* Task Description */}
                <div className="space-y-2">
                  <Label htmlFor="task">Task Description</Label>
                  <Textarea
                    id="task"
                    placeholder="Describe what you want the AI to do (e.g., 'Write a Python function to sort a list', 'Generate JSON data for a user profile')"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* AI Provider */}
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                        <SelectItem value="claude">Anthropic Claude</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="mistral">Mistral AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Type */}
                  <div className="space-y-2">
                    <Label>Output Type</Label>
                    <Select value={outputType} onValueChange={setOutputType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Output Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="essay">Essay/Article</SelectItem>
                        <SelectItem value="structured">Structured Data</SelectItem>
                        <SelectItem value="creative">Creative Writing</SelectItem>
                        <SelectItem value="analysis">Analysis/Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Advanced Options
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="variants">Number of Variants</Label>
                        <Input
                          id="variants"
                          type="number"
                          min="1"
                          max="10"
                          value={variants}
                          onChange={(e) => setVariants(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          id="temperature"
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxTokens">Max Tokens</Label>
                        <Input
                          id="maxTokens"
                          type="number"
                          min="100"
                          max="4000"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(e.target.value)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  size="lg" 
                  className="w-full shadow-primary"
                  disabled={!taskDescription || !aiProvider || !outputType}
                >
                  Generate Optimized Prompts
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* Results Section */}
            {showResults && (
              <PromptResults 
                taskDescription={taskDescription}
                aiProvider={aiProvider}
                outputType={outputType}
              />
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <PerformanceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppPage;