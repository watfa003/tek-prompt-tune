import React from 'react';
import { AIPromptOptimizer } from '@/components/AIPromptOptimizer';
import { OptimizerSessionProvider } from '@/context/OptimizerSessionContext';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { Particles } from '@/components/ui/particles';
const AIAgent = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden ai-optimizer-theme safe-page isolate">
      <Particles />
      <BackgroundPaths>
        <main className="page-container section-y">
          <div className="space-y-6">
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
        </main>
      </BackgroundPaths>
    </div>
  );
};

export default AIAgent;