import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Target, Zap, Brain, Gauge } from 'lucide-react';
import { useEffect } from 'react';

export default function ProductFeatures() {
  useEffect(() => {
    document.title = 'Prompt Optimizer Features | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Explore PrompTek\'s advanced prompt optimization features including precision scoring, cross-model intelligence, adaptive learning, and turbo execution.');
    }
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Precision Scoring',
      description: 'Advanced multi-dimensional scoring system that evaluates prompts across clarity, specificity, effectiveness, and output quality.',
      details: [
        'Real-time scoring as you type',
        'Detailed breakdown of quality metrics',
        'Historical score tracking and trends',
        'Benchmarking against industry standards',
      ],
    },
    {
      icon: Zap,
      title: 'Cross-Model Intelligence',
      description: 'Test and compare prompt performance across GPT-4, Claude, Gemini, and other leading AI models simultaneously.',
      details: [
        'Side-by-side model comparison',
        'Unified performance metrics',
        'Cost-per-prompt analysis',
        'Model-specific optimization suggestions',
      ],
    },
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'Machine learning system that learns from your prompt patterns to provide increasingly personalized optimization suggestions.',
      details: [
        'Pattern recognition from prompt history',
        'Context-aware recommendations',
        'Industry-specific optimization',
        'Continuous improvement over time',
      ],
    },
    {
      icon: Gauge,
      title: 'Turbo Execution',
      description: 'Lightning-fast prompt testing with parallel execution and intelligent caching for instant feedback.',
      details: [
        'Sub-second response times',
        'Parallel model execution',
        'Smart result caching',
        'Batch testing capabilities',
      ],
    },
  ];

  return (
    <DocsLayout
      title="Prompt Optimizer Features"
      description="Comprehensive overview of PrompTek's core capabilities for advanced prompt engineering and optimization."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Core Capabilities
          </h2>
          <p className="text-muted-foreground mb-6">
            PrompTek provides a sophisticated suite of tools designed specifically for AI engineers and developers
            who need to create, test, and optimize prompts at scale. Our platform combines cutting-edge AI analysis
            with practical engineering workflows.
          </p>
        </section>

        <section className="space-y-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 glass-card border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            How It Works
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              PrompTek's optimization engine analyzes your prompts using a combination of natural language processing,
              machine learning models, and empirical testing across multiple AI providers. Each prompt is evaluated
              against hundreds of quality signals to provide actionable improvement suggestions.
            </p>
            <p>
              The system continuously learns from millions of prompt variations and their outcomes, building an
              ever-expanding knowledge base of what makes prompts effective across different domains and use cases.
            </p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
