import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Zap, Settings, ChevronDown, ArrowLeft } from "lucide-react";
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
  const [selectedOutputType, setSelectedOutputType] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [variants, setVariants] = useState([3]);
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);

  const handleGenerate = () => {
    if (taskDescription && selectedProvider && selectedOutputType) {
      setShowResults(true);
    }
  };

  const handleUseTemplate = (template: string, outputType: string) => {
    setTaskDescription(template);
    setSelectedOutputType(outputType);
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">AI Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai-gpt4">OpenAI GPT-4</SelectItem>
                        <SelectItem value="claude-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="gemini-pro">Google Gemini Pro</SelectItem>
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
                      disabled={!taskDescription || !selectedProvider || !selectedOutputType}
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
                outputType={selectedOutputType}
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