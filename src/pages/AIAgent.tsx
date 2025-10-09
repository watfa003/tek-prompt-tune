import React from 'react';
import { AIPromptOptimizer } from '@/components/AIPromptOptimizer';
import { OptimizerSessionProvider } from '@/context/OptimizerSessionContext';

const AIAgent = () => {
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
          <AIPromptOptimizer />
        </OptimizerSessionProvider>
      </div>
    </div>
  );
};

export default AIAgent;