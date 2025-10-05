import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Zap, Settings, ChevronDown, ArrowLeft, Lightbulb, X, Code } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PromptResults } from "@/components/PromptResults";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { EnhancedDashboard } from "@/components/EnhancedDashboard";
import { PromptTemplates } from "@/components/PromptTemplates";
import { PromptHistory } from "@/components/PromptHistory";
import { UserSettings } from "@/components/UserSettings";
import AIAgent from "@/pages/AIAgent";
import APIManagement from "@/pages/APIManagement";
import { PromptDataProvider } from "@/context/PromptDataContext";
import { AppModeProvider, useAppMode } from "@/context/AppModeContext";

const AppPage = () => {
  return (
    <AppModeProvider>
      <PromptDataProvider>
        <AppPageContent />
      </PromptDataProvider>
    </AppModeProvider>
  );
};

const AppPageContent = () => {
  const location = useLocation();
  const { mode, setMode } = useAppMode();
  const [isTransitioning, setIsTransitioning] = useState(false);
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const TemplateOptimizer = React.lazy(() => import('@/components/TemplateOptimizer').then(module => ({ default: module.TemplateOptimizer })));


  // Removed old influence URL param handler; handled in AIPromptOptimizer now

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

  // Handle URL parameters for templates and influence
  React.useEffect(() => {
    const influence = searchParams.get('influence');
    const influenceTypeParam = searchParams.get('influenceType');
    const promptParam = searchParams.get('prompt');
    
    if (influence && influenceTypeParam) {
      setSelectedInfluence(influence);
      setInfluenceType(influenceTypeParam);
    }
    
    if (promptParam) {
      setTaskDescription(promptParam);
    }
  }, [searchParams]);

  // Handle smooth transitions between routes
  React.useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Determine which content to show based on current path and mode
  const renderContent = () => {
    // If in API mode, show API management regardless of path
    if (mode === 'api') {
      return <APIManagement />;
    }

    // Otherwise show optimizer content based on path
    switch (location.pathname) {
      case '/app':
      case '/app/':
        return <EnhancedDashboard />;
      case '/app/history':
        return <PromptHistory />;
      case '/app/templates':
        return <PromptTemplates onUseTemplate={handleUseTemplate} />;
      case '/app/template-optimizer':
        const TemplateOptimizer = React.lazy(() => import('@/components/TemplateOptimizer').then(module => ({ default: module.TemplateOptimizer })));
        return <React.Suspense fallback={<div>Loading...</div>}><TemplateOptimizer /></React.Suspense>;
      case '/app/settings':
        return <UserSettings />;
      case '/app/ai-agent':
        return <AIAgent />;
      case '/app/autopilot':
        const AutoPilotPage = React.lazy(() => import('@/pages/AutoPilot'));
        return <React.Suspense fallback={<div>Loading...</div>}><AutoPilotPage /></React.Suspense>;
      default:
        return <EnhancedDashboard />;
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
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                      variant={mode === 'optimizer' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('optimizer')}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Optimizer
                    </Button>
                    <Button
                      variant={mode === 'api' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('api')}
                      className="gap-2"
                    >
                      <Code className="h-4 w-4" />
                      API
                    </Button>
                  </div>
                  
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    PrompTek
                  </Badge>
                </div>
              </div>
            </header>

            <main className="flex-1 p-6 overflow-auto">
              <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}>
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
    </SidebarProvider>
  );
};

export default AppPage;