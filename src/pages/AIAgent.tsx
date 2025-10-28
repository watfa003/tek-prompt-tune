import React from 'react';
import { AIPromptOptimizer } from '@/components/AIPromptOptimizer';
import { OptimizerSessionProvider } from '@/context/OptimizerSessionContext';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { Particles } from '@/components/ui/particles';
const AIAgent = () => {
  return (
    <div className="min-h-screen bg-background relative isolate ai-optimizer-theme" style={{ overflow: "hidden" }}>
      <Particles />
      <BackgroundPaths>
        <main className="p-6">
          <div className="max-w-[1280px] mx-auto px-8 space-y-6">
            <div className="text-center">
              <h1 className="font-bold bg-gradient-primary bg-clip-text text-transparent mb-2" style={{ fontSize: "clamp(2rem, 2.5vw, 2.5rem)" }}>
                AI Prompt Optimizer
              </h1>
              <p className="text-muted-foreground" style={{ fontSize: "clamp(1rem, 1.2vw, 1.125rem)" }}>
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