import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAgentChat } from '@/components/AIAgentChat';
import { AIPromptOptimizer } from '@/components/AIPromptOptimizer';
import { AIAnalyticsDashboard } from '@/components/AIAnalyticsDashboard';
import { MessageSquare, Zap, BarChart3 } from 'lucide-react';

const AIAgent = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            PrompTek AI Agent
          </h1>
          <p className="text-muted-foreground text-lg">
            Advanced AI-powered prompt optimization and engineering assistant
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Optimizer</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <AIAgentChat />
          </TabsContent>

          <TabsContent value="optimizer">
            <AIPromptOptimizer />
          </TabsContent>

          <TabsContent value="analytics">
            <AIAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAgent;