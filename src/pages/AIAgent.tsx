import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIPromptOptimizer } from '@/components/AIPromptOptimizer';
import { AIAnalyticsDashboard } from '@/components/AIAnalyticsDashboard';
import { AutoPilot } from '@/components/AutoPilot';
import { OptimizerSessionProvider } from '@/context/OptimizerSessionContext';
import { Zap, BarChart3, Sparkles } from 'lucide-react';

const AIAgent = () => {
  // Persist active tab to localStorage so it never resets
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('aiAgent_activeTab') || 'optimize';
  });

  // Save active tab to localStorage when changed
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('aiAgent_activeTab', value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            AI Prompt Optimizer
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate and optimize prompts with multiple AI providers and advanced influence controls
          </p>
        </div>

        <OptimizerSessionProvider>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="optimize" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Optimize</span>
              </TabsTrigger>
              <TabsTrigger value="autopilot" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>AutoPilot</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Keep all tabs always mounted, only show/hide them */}
            <div className={`${activeTab === 'optimize' ? 'block' : 'hidden'}`}>
              <AIPromptOptimizer />
            </div>
            
            <div className={`${activeTab === 'autopilot' ? 'block' : 'hidden'}`}>
              <AutoPilot />
            </div>
            
            <div className={`${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
              <AIAnalyticsDashboard />
            </div>
          </Tabs>
        </OptimizerSessionProvider>
      </div>
    </div>
  );
};

export default AIAgent;