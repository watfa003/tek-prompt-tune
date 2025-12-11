import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function AIModelTesting() {
  useEffect(() => {
    document.title = 'AI Model Testing | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Test prompts across GPT-5, Claude Opus 4, Gemini 2.5, and other leading AI models with PrompTek\'s 8-pillar scoring system.');
    }
  }, []);

  const models = [
    {
      name: 'GPT-5',
      provider: 'OpenAI',
      strengths: ['State-of-the-art reasoning', 'Extended context', 'Complex tasks'],
    },
    {
      name: 'GPT-4.1 / GPT-4o / GPT-4o Mini',
      provider: 'OpenAI',
      strengths: ['Strong general performance', 'Code generation', 'Fast inference'],
    },
    {
      name: 'Claude Opus 4',
      provider: 'Anthropic',
      strengths: ['Advanced reasoning', 'Long documents', 'Nuanced analysis'],
    },
    {
      name: 'Claude Sonnet 4 / 3.5 Haiku',
      provider: 'Anthropic',
      strengths: ['200K context', 'Cost-effective', 'Safety alignment'],
    },
    {
      name: 'Gemini 2.5 Flash / Pro',
      provider: 'Google',
      strengths: ['Multimodal input', 'Fast inference', 'Cost-effective'],
    },
    {
      name: 'Llama 3.1 8B',
      provider: 'Groq',
      strengths: ['Ultra-fast inference', 'Open source', 'Cost-effective'],
    },
    {
      name: 'Mistral Large / Medium',
      provider: 'Mistral',
      strengths: ['European hosting', 'Strong reasoning', 'Multilingual'],
    },
  ];

  return (
    <DocsLayout
      title="AI Model Testing"
      description="Test prompts across all major AI providers with unified 8-pillar scoring metrics."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Supported AI Models
          </h2>
          <p className="text-muted-foreground mb-6">
            PrompTek supports testing across all major AI providers. Choose any model in the Optimizer 
            or Lab to see how your prompt performs with unified 8-pillar scoring.
          </p>

          <div className="grid gap-4">
            {models.map((model, index) => (
              <Card key={index} className="p-5 glass-card border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.provider}</p>
                  </div>
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
          <div className="space-y-4">
            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">1. Select Your Model</h3>
              <p className="text-muted-foreground text-sm">
                Choose any supported model from the dropdown. In the Optimizer, select your preferred 
                provider (OpenAI, Anthropic, Google, Groq, Mistral) then choose the specific model.
              </p>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">2. Configure Parameters</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Set consistent parameters for accurate testing:
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground"><strong>Temperature:</strong> Controls randomness (0-1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground"><strong>Max Tokens:</strong> Output length limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground"><strong>Output Type:</strong> text, code, json, list, essay</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground"><strong>Variants:</strong> Number of alternatives (1-5)</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <h3 className="text-lg font-semibold mb-3 text-foreground">3. Analyze Results</h3>
              <p className="text-muted-foreground text-sm">
                Review the AI-generated output alongside detailed 8-pillar scoring. Compare how different 
                models interpret and respond to your prompt using the same quality metrics.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Performance Metrics
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2">8-Pillar Quality Score</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Clarity, Specificity, Constraints</li>
                <li>• Elaboration, Efficiency, Structure</li>
                <li>• Intent Alignment, Adaptability</li>
                <li>• Combined 50/50 final score</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2">Response Analysis</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Strengths identification</li>
                <li>• Weakness detection</li>
                <li>• Specific improvement suggestions</li>
                <li>• Response latency tracking</li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Model Selection Guide
          </h2>
          <Card className="p-6 glass-card border-primary/20">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">For complex reasoning & analysis:</strong>
                <p>GPT-5, Claude Opus 4, Gemini 2.5 Pro</p>
              </div>
              <div>
                <strong className="text-foreground">For fast, cost-effective testing:</strong>
                <p>GPT-4o Mini, Claude 3.5 Haiku, Gemini 2.5 Flash, Llama 3.1</p>
              </div>
              <div>
                <strong className="text-foreground">For code generation:</strong>
                <p>GPT-4o, Claude Sonnet 4, Gemini 2.5 Flash</p>
              </div>
              <div>
                <strong className="text-foreground">For long documents (200K+ context):</strong>
                <p>Claude Opus 4, Claude Sonnet 4, Gemini 2.5 Pro</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            API Keys
          </h2>
          <p className="text-muted-foreground mb-4">
            To use models from different providers, configure your API keys in the Settings page:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground ml-4">
            <li>• <strong>OpenAI:</strong> Get your key from platform.openai.com</li>
            <li>• <strong>Anthropic:</strong> Get your key from console.anthropic.com</li>
            <li>• <strong>Google:</strong> Get your key from aistudio.google.com</li>
            <li>• <strong>Groq:</strong> Get your key from console.groq.com</li>
            <li>• <strong>Mistral:</strong> Get your key from console.mistral.ai</li>
          </ul>
        </section>
      </div>
    </DocsLayout>
  );
}
