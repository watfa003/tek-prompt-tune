import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Zap, Settings, ChevronDown, ArrowLeft, Lightbulb, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PromptResults } from "@/components/PromptResults";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { EnhancedDashboard } from "@/components/EnhancedDashboard";
import { PromptTemplates } from "@/components/PromptTemplates";
import { PromptHistory } from "@/components/PromptHistory";
import { UserSettings } from "@/components/UserSettings";

const AppPage = () => {
  const location = useLocation();
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedLLM, setSelectedLLM] = useState("");
  const [selectedOutputType, setSelectedOutputType] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [variants, setVariants] = useState([3]);
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [selectedInfluence, setSelectedInfluence] = useState("");
  const [influenceType, setInfluenceType] = useState("");
  const [influenceWeight, setInfluenceWeight] = useState([75]);

  // Mock data for templates and saved prompts
  const promptTemplates = [
    { id: 1, title: "Code Generation", content: "Create clean, well-documented code that follows best practices" },
    { id: 2, title: "Data Analysis", content: "Analyze data thoroughly and provide actionable insights" },
    { id: 3, title: "Creative Writing", content: "Write engaging, original content with vivid descriptions" },
    { id: 4, title: "Technical Documentation", content: "Create clear, comprehensive documentation for technical topics" },
  ];

  const savedPrompts = [
    { id: 1, title: "Python Merge Sort", content: "Implement a merge sort algorithm in Python with detailed comments" },
    { id: 2, title: "API Documentation", content: "Document REST API endpoints with examples and error codes" },
    { id: 3, title: "JSON Schema", content: "Create JSON schema validation with proper error handling" },
  ];

  const handleGenerate = () => {
    if (taskDescription && selectedProvider && selectedLLM && selectedOutputType) {
      setShowResults(true);
    }
  };

  const handleUseTemplate = (template: string, outputType: string) => {
    setTaskDescription(template);
    setSelectedOutputType(outputType);
  };

  const handleInfluenceSelect = (type: string, content: string) => {
    setInfluenceType(type);
    setSelectedInfluence(content);
  };

  const clearInfluence = () => {
    setInfluenceType("");
    setSelectedInfluence("");
  };

  // Determine which content to show based on current path
  const renderContent = () => {
    switch (location.pathname) {
      case '/app':
        return <EnhancedDashboard onQuickAction={() => {}} />;
      case '/app/generate':
        return (
          <div className="space-y-6">
            <Card className="p-6 shadow-card">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Generate Optimized Prompts</h2>
                  <p className="text-muted-foreground">
                    Describe your task and let our AI optimize prompts for maximum effectiveness.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-3 space-y-2">
                    <Label htmlFor="task" className="text-sm font-medium">Task Description</Label>
                    <Textarea
                      id="task"
                      placeholder="Describe what you want the AI to do..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Influence Section */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Influence Optimization (Optional)</Label>
                    </div>
                    
                    {selectedInfluence ? (
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {influenceType === "template" ? "Template" : "Favorited Template"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {influenceWeight[0]}% influence
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selectedInfluence}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearInfluence}
                            className="h-auto p-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">Influence Weight</Label>
                            <span className="text-xs text-muted-foreground">{influenceWeight[0]}%</span>
                          </div>
                          <Slider
                            value={influenceWeight}
                            onValueChange={setInfluenceWeight}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Template Style</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Link to="/app/templates">
                              <Button variant="outline" className="w-full h-auto p-3 text-left">
                                <div className="flex flex-col items-start space-y-1">
                                  <span className="font-medium">Browse Templates</span>
                                  <span className="text-xs text-muted-foreground">View all available templates</span>
                                </div>
                              </Button>
                            </Link>
                            <Link to="/app/history">
                              <Button variant="outline" className="w-full h-auto p-3 text-left">
                                <div className="flex flex-col items-start space-y-1">
                                  <span className="font-medium">My Favorited Prompts</span>
                                  <span className="text-xs text-muted-foreground">Choose from saved favorites</span>
                                </div>
                              </Button>
                            </Link>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Influence Weight</Label>
                            <span className="text-sm text-muted-foreground">{influenceWeight[0]}%</span>
                          </div>
                          <Slider
                            value={influenceWeight}
                            onValueChange={setInfluenceWeight}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">AI Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">LLM Model</Label>
                    <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select LLM model" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider === "openai" && (
                          <>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-5">GPT-5</SelectItem>
                          </>
                        )}
                        {selectedProvider === "anthropic" && (
                          <>
                            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          </>
                        )}
                        {selectedProvider === "google" && (
                          <>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                          </>
                        )}
                        {!selectedProvider && (
                          <SelectItem disabled value="none">Select a provider first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Output Type</Label>
                    <Select value={selectedOutputType} onValueChange={setSelectedOutputType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenerate} 
                      className="w-full bg-gradient-primary"
                      disabled={!taskDescription || !selectedProvider || !selectedLLM || !selectedOutputType}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Prompts
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {showResults && (
              <PromptResults 
                taskDescription={taskDescription}
                aiProvider={selectedProvider}
                llmModel={selectedLLM}
                outputType={selectedOutputType}
                influence={selectedInfluence}
                influenceType={influenceType}
                influenceWeight={influenceWeight[0]}
              />
            )}
          </div>
        );
      case '/app/history':
        return <PromptHistory />;
      case '/app/templates':
        return <PromptTemplates onUseTemplate={handleUseTemplate} />;
      case '/app/settings':
        return <UserSettings />;
      default:
        return <EnhancedDashboard onQuickAction={() => {}} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/40 bg-background/95 backdrop-blur">
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Link to="/" className="flex items-center space-x-2 text-primary">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-semibold">Back to Home</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  PrompTek
                </Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppPage;