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
import { TemplatesDataProvider } from "@/context/TemplatesDataContext";
import { motion, AnimatePresence } from "framer-motion";

const AppPage = () => {
  return (
    <AppModeProvider>
      <PromptDataProvider>
        <TemplatesDataProvider>
          <AppPageContent />
        </TemplatesDataProvider>
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
        return <PromptTemplates />;
      case '/app/template-optimizer':
        const TemplateOptimizer = React.lazy(() => import('@/components/TemplateOptimizer').then(module => ({ default: module.TemplateOptimizer })));
        return <React.Suspense fallback={<div>Loading...</div>}><TemplateOptimizer /></React.Suspense>;
      case '/app/settings':
        return <UserSettings />;
      case '/app/ai-agent':
        return <AIAgent />;
      default:
        return <EnhancedDashboard />;
    }
  };

  return (
    <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
          {/* Ambient Background Effects */}
          <div className="fixed inset-0 pointer-events-none">
            <motion.div
              className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>
          
          <AppSidebar />
          
          <div className="flex-1 flex flex-col relative z-10">
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="border-b border-white/10 glass-panel sticky top-0 z-50"
            >
              <div className="h-16 flex items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger />
                  <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-all duration-300 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold">Back to Home</span>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 glass-panel border border-white/10 rounded-xl p-1">
                    <Button
                      variant={mode === 'optimizer' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('optimizer')}
                      className={`gap-2 rounded-lg transition-all ${mode === 'optimizer' ? 'bg-gradient-to-r from-primary to-accent shadow-glow' : 'hover:bg-white/5'}`}
                    >
                      <Zap className="h-4 w-4" />
                      Optimizer
                    </Button>
                    <Button
                      variant={mode === 'api' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('api')}
                      className={`gap-2 rounded-lg transition-all ${mode === 'api' ? 'bg-gradient-to-r from-primary to-accent shadow-glow' : 'hover:bg-white/5'}`}
                    >
                      <Code className="h-4 w-4" />
                      API
                    </Button>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 neon-border">
                    PrompTek
                  </Badge>
                </div>
              </div>
              {/* Animated gradient line beneath header */}
              <motion.div
                className="h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.header>

            <main className="flex-1 p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
    </SidebarProvider>
  );
};

export default AppPage;