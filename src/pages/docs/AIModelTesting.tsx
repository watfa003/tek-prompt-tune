import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function AIModelTesting() {
  useEffect(() => {
    document.title = 'AI Model Testing | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Test prompts across GPT-4, Claude, Gemini, and other leading AI models with comprehensive performance metrics and comparison tools.');
    }
  }, []);

  const models = [
    {
      name: 'GPT-4 & GPT-4 Turbo',
      provider: 'OpenAI',
      strengths: ['Complex reasoning', 'Long-context understanding', 'Code generation'],
      costPer1k: '$0.03 - $0.12',
    },
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      strengths: ['Extended context (200K)', 'Nuanced analysis', 'Safety alignment'],
      costPer1k: '$0.003 - $0.015',
    },
    {
      name: 'Gemini Pro',
      provider: 'Google',
      strengths: ['Multimodal input', 'Fast inference', 'Cost-effective'],
      costPer1k: '$0.00025 - $0.002',
    },
    {
      name: 'Custom Models',
      provider: 'Self-hosted',
      strengths: ['Full control', 'Privacy', 'Cost optimization'],
      costPer1k: 'Variable',
    },
  ];

  return (
    <DocsLayout
      title="AI Model Testing"
      description="Run comprehensive prompt tests across multiple AI models with detailed performance metrics and cost analysis."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Supported AI Models
          </h2>
          <p className="text-muted-foreground mb-6">
            PrompTek enables testing across all major AI providers and custom endpoints, providing
            unified metrics for informed model selection.
          </p>

          <div className="grid gap-4">
            {models.map((model, index) => (
              <Card key={index} className="p-6 glass-card border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.provider}</p>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary/40">
                    {model.costPer1k}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {model.strengths.map((strength, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Testing Workflow
          </h2>
          <div className="space-y-6">
            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">1. Select Models for Comparison</h3>
              <p className="text-muted-foreground text-sm">
                Choose 2-4 models to test simultaneously. PrompTek executes requests in parallel,
                delivering results in seconds.
              </p>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">2. Configure Test Parameters</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Set consistent parameters across models for fair comparison:
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Temperature & randomness</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Max output tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">System instructions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Response format</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">3. Analyze Results</h3>
              <p className="text-muted-foreground text-sm">
                Review side-by-side outputs with detailed metrics for each model including response time,
                token usage, cost estimate, and quality scores.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Performance Metrics
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2">Speed</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Time to first token</li>
                <li>• Total response time</li>
                <li>• Tokens per second</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2">Cost</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Input token cost</li>
                <li>• Output token cost</li>
                <li>• Total cost per request</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2">Quality</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Relevance score</li>
                <li>• Coherence rating</li>
                <li>• Task completion</li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Custom Model Integration
          </h2>
          <p className="text-muted-foreground mb-4">
            Add custom API endpoints for self-hosted models or proprietary services:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`// Custom endpoint configuration
{
  "name": "Custom LLaMA",
  "endpoint": "https://api.example.com/v1/chat",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  },
  "requestFormat": "openai-compatible"
}`}
            </pre>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
