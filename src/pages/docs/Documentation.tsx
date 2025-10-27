import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Code, Workflow, Settings, Zap } from 'lucide-react';
import { useEffect } from 'react';

export default function Documentation() {
  useEffect(() => {
    document.title = 'Technical Documentation | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Complete technical documentation for PrompTek including installation, setup, workflow integration, and advanced features.');
    }
  }, []);

  return (
    <DocsLayout
      title="Documentation"
      description="Complete technical reference for integrating and using PrompTek in your development workflow."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Quick Start
          </h2>
          <Card className="p-6 glass-card border-primary/20">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Installation</h3>
            <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm mb-4">
              <pre className="text-foreground">
{`# Using npm
npm install @promptek/sdk

# Using yarn
yarn add @promptek/sdk

# Using pnpm
pnpm add @promptek/sdk`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Or use PrompTek directly through the web interface at{' '}
              <code className="text-primary">app.promptek.ai</code>
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Basic Usage
          </h2>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`import { PrompTek } from '@promptek/sdk';

// Initialize client
const promptek = new PrompTek({
  apiKey: process.env.PROMPTEK_API_KEY
});

// Optimize a prompt
const result = await promptek.optimize({
  prompt: "Write a function to reverse a string",
  models: ["gpt-4", "claude-3.5-sonnet"],
  options: {
    temperature: 0.7,
    maxTokens: 500
  }
});

console.log(result.score);        // Quality score
console.log(result.suggestions);  // Improvement tips
console.log(result.outputs);      // Model responses`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Core Concepts
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Prompt Templates</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reusable prompt structures with variables
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-xs font-mono">
                <code className="text-primary">{'{{variable}}'}</code> syntax
              </div>
            </Card>

            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Test Suites</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch testing with multiple inputs
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-xs font-mono">
                Run variations in parallel
              </div>
            </Card>

            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Configuration</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Model parameters and behavior
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-xs font-mono">
                Temperature, tokens, format
              </div>
            </Card>

            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Analytics</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Performance tracking and insights
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded text-xs font-mono">
                Historical data & trends
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Advanced Features
          </h2>
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Batch Processing</h3>
              <p className="mb-3">
                Test multiple prompt variations simultaneously for A/B testing and optimization:
              </p>
              <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
                <pre className="text-foreground overflow-x-auto">
{`const batch = await promptek.batch({
  prompts: [variation1, variation2, variation3],
  testCases: inputSamples,
  models: ["gpt-4"]
});`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Webhook Integration</h3>
              <p className="mb-3">
                Receive real-time notifications when optimization jobs complete:
              </p>
              <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
                <pre className="text-foreground overflow-x-auto">
{`await promptek.setWebhook({
  url: "https://your-app.com/webhook",
  events: ["optimization.complete"]
});`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Custom Scoring</h3>
              <p>
                Define custom evaluation criteria for domain-specific optimization requirements.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Environment Variables
          </h2>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground">
{`# Required
PROMPTEK_API_KEY=your_api_key_here

# Optional
PROMPTEK_BASE_URL=https://api.promptek.ai
PROMPTEK_TIMEOUT=30000
PROMPTEK_LOG_LEVEL=info`}
            </pre>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
