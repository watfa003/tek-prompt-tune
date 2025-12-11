import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Target, Zap, Brain, Gauge, Layers, Settings } from 'lucide-react';
import { useEffect } from 'react';

export default function ProductFeatures() {
  useEffect(() => {
    document.title = 'Prompt Optimizer Features | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Explore PrompTek\'s 8-pillar scoring system, optimization strategies, Speed vs Deep mode, and cross-model intelligence.');
    }
  }, []);

  const pillars = [
    { name: 'Clarity', weight: '1.5x', description: 'Zero ambiguity with explicit verbs and unambiguous instructions' },
    { name: 'Specificity', weight: '1.3x', description: 'Quantified parameters, concrete examples, and precise requirements' },
    { name: 'Constraints', weight: '1.2x', description: 'Defined format, tone, length limits, and output boundaries' },
    { name: 'Elaboration', weight: '1.3x', description: 'Rich context, background information, and relevant rationale' },
    { name: 'Efficiency', weight: '1.0x', description: 'Concise wording without sacrificing clarity or completeness' },
    { name: 'Structure', weight: '1.2x', description: 'Logical organization with clear sections and hierarchy' },
    { name: 'Intent Alignment', weight: '1.4x', description: 'Output matches the goal and purpose of the prompt' },
    { name: 'Adaptability', weight: '0.4x', description: 'Cross-model compatibility and template-ready structure' },
  ];

  const strategies = [
    { name: 'Cognitive Fusion Elite', focus: 'Clarity', description: 'Eliminates ambiguity through precise language and explicit instructions' },
    { name: 'Precision Abstraction Elite', focus: 'Specificity', description: 'Adds quantified parameters, examples, and concrete requirements' },
    { name: 'Semantic Compression', focus: 'Efficiency', description: 'Reduces verbosity while preserving meaning and completeness' },
    { name: 'Directive Synthesis', focus: 'Structure', description: 'Reorganizes into logical sections with clear hierarchy' },
    { name: 'Constraint-Driven Creativity', focus: 'Constraints', description: 'Adds explicit boundaries, format rules, and output limits' },
    { name: 'Contextual Intelligence Matrix', focus: 'Elaboration', description: 'Enriches with background, rationale, and supporting context' },
    { name: 'Semantic Anchoring Elite', focus: 'Intent', description: 'Ensures output aligns precisely with the original goal' },
    { name: 'Cognitive Elasticity', focus: 'Adaptability', description: 'Adds template markers and cross-model compatibility' },
  ];

  return (
    <DocsLayout
      title="Prompt Optimizer Features"
      description="Comprehensive overview of PrompTek's 8-pillar scoring system, optimization strategies, and optimization modes."
    >
      <div className="space-y-12">
        {/* 8-Pillar Scoring System */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              8-Pillar Scoring System
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Every prompt is evaluated across 8 quality dimensions with weighted scoring. 
            The system targets ≥9.0/10 on each pillar for exceptional quality.
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {pillars.map((pillar, index) => (
              <Card key={index} className="p-4 glass-card border-primary/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{pillar.name}</h4>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-mono">
                    {pillar.weight}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Scoring Methodology */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Scoring Methodology
            </h2>
          </div>
          <Card className="p-6 glass-card border-primary/20">
            <h3 className="text-lg font-semibold mb-3 text-foreground">50/50 Combined Score</h3>
            <p className="text-muted-foreground mb-4">
              The final score combines two equal components:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-primary/10">
                <h4 className="font-semibold text-foreground mb-2">Prompt Quality (50%)</h4>
                <p className="text-sm text-muted-foreground">
                  Evaluates the prompt's structure, clarity, and engineering quality independent of any output.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border border-primary/10">
                <h4 className="font-semibold text-foreground mb-2">Output Quality (50%)</h4>
                <p className="text-sm text-muted-foreground">
                  Evaluates how well the AI's response aligns with intent and meets quality standards.
                </p>
              </div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 font-mono text-sm">
              <code className="text-primary">finalScore = (promptScore × 0.5) + (outputScore × 0.5)</code>
            </div>
          </Card>
        </section>

        {/* Optimization Strategies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              8 Optimization Strategies
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Each variant is generated using a different strategy, targeting specific quality pillars 
            to create diverse, high-quality prompt alternatives.
          </p>
          
          <div className="space-y-3">
            {strategies.map((strategy, index) => (
              <Card key={index} className="p-4 glass-card border-primary/20 hover:border-primary/40 transition-all">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold text-primary/30">{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{strategy.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                        {strategy.focus}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Speed vs Deep Mode */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Speed Mode vs Deep Mode
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-foreground">Speed Mode</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Generates 3-5 variants in <strong>3-6 seconds</strong></li>
                <li>• Skips expensive testing and grading</li>
                <li>• All variants shown for manual selection</li>
                <li>• Best for quick iterations and exploration</li>
                <li>• Uses diverse strategies for variant generation</li>
              </ul>
            </Card>
            
            <Card className="p-6 glass-card border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-foreground">Deep Mode</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Full optimization in <strong>40-60 seconds</strong></li>
                <li>• Tests and grades every variant</li>
                <li>• Automatically selects best performing variant</li>
                <li>• Includes detailed 8-pillar scoring breakdown</li>
                <li>• Best for production-ready prompts</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Cross-Model Intelligence */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Cross-Model Intelligence
            </h2>
          </div>
          <Card className="p-6 glass-card border-primary/20">
            <p className="text-muted-foreground mb-4">
              Test and compare prompt performance across multiple AI models simultaneously:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Supported Providers</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• OpenAI (GPT-5, GPT-4.1, GPT-4o)</li>
                  <li>• Anthropic (Claude Opus 4, Sonnet 4)</li>
                  <li>• Google (Gemini 2.5 Flash/Pro)</li>
                  <li>• Groq (Llama 3.1)</li>
                  <li>• Mistral (Large, Medium)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Output Types</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Text (general purpose)</li>
                  <li>• Code (programming)</li>
                  <li>• JSON (structured data)</li>
                  <li>• List (enumerated items)</li>
                  <li>• Essay (long-form content)</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            How Optimization Works
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              PrompTek's optimization engine analyzes your prompt using natural language processing 
              and applies targeted improvements through 8 specialized strategies. Each strategy focuses 
              on a different quality pillar.
            </p>
            <p>
              In Deep Mode, every generated variant is tested against the AI model and scored across 
              all 8 pillars. The system automatically selects the highest-scoring variant as the 
              optimized result, while still showing all alternatives for comparison.
            </p>
            <p>
              <strong>Important:</strong> Recommendations focus on improving the prompt itself (how you 
              ask the question), not the output. This ensures you can apply learnings to future prompts.
            </p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
