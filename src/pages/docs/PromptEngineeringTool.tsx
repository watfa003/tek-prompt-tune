import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Code, Beaker, Swords, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function PromptEngineeringTool() {
  useEffect(() => {
    document.title = 'Lab Guide | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Step-by-step guide to test, compare, and analyze AI prompts using PrompTek Lab\'s 8-pillar scoring system.');
    }
  }, []);

  const scoringPillars = [
    { name: 'Clarity', description: 'How unambiguous and explicit the instructions are' },
    { name: 'Specificity', description: 'Presence of concrete details, examples, and parameters' },
    { name: 'Constraints', description: 'Defined boundaries, format rules, and output limits' },
    { name: 'Elaboration', description: 'Context, background, and supporting information' },
    { name: 'Efficiency', description: 'Concise wording without unnecessary verbosity' },
    { name: 'Structure', description: 'Logical organization and clear hierarchy' },
    { name: 'Intent Alignment', description: 'How well output matches the original goal' },
    { name: 'Adaptability', description: 'Cross-model compatibility and reusability' },
  ];

  return (
    <DocsLayout
      title="Lab"
      description="Complete guide to testing and analyzing prompts with PrompTek Lab's 8-pillar scoring system."
    >
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beaker className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              What is Lab?
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Lab is PrompTek's advanced prompt testing environment. Test prompts against multiple AI models,
            compare variations side-by-side, and receive detailed 8-pillar scoring with actionable analysis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Testing Modes
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Beaker className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Single Test</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Analyze one prompt with full 8-pillar scoring, AI-generated output, 
                strengths/weaknesses analysis, and specific improvement suggestions.
              </p>
            </Card>
            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Battle Mode</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Compare two prompt variations head-to-head. See which performs better 
                across all 8 pillars with a clear winner declaration.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 1: Configure Your Test
          </h2>
          <Card className="p-6 glass-card border-primary/20 mb-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Select AI Model</h4>
                <p className="text-sm text-muted-foreground">
                  Choose from: GPT-5, GPT-4o, GPT-4o Mini, Claude Opus 4, Claude Sonnet 4, 
                  Claude 3.5 Haiku, Gemini 2.5 Flash, Gemini 2.5 Pro, Llama 3.1, Mistral Large
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Select Output Type</h4>
                <p className="text-sm text-muted-foreground">
                  Choose the expected format: <code className="text-primary">text</code>, 
                  <code className="text-primary ml-1">code</code>, 
                  <code className="text-primary ml-1">json</code>, 
                  <code className="text-primary ml-1">list</code>, or 
                  <code className="text-primary ml-1">essay</code>
                </p>
              </div>
            </div>
          </Card>

          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-muted-foreground">Example Prompt</span>
            </div>
            <pre className="text-sm font-mono text-foreground overflow-x-auto">
{`You are an expert code reviewer. Analyze the following
code for bugs, security issues, and best practice violations.

Code to review:
{{user_code}}

Provide:
1. Critical issues (security, bugs)
2. Performance concerns
3. Code style improvements
4. Specific line-by-line suggestions`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 2: Understanding Your Score
          </h2>
          <p className="text-muted-foreground mb-4">
            Lab uses PrompTek's 8-pillar scoring system with a 50/50 methodology:
          </p>
          
          <Card className="p-6 glass-card border-primary/20 mb-4">
            <h4 className="font-semibold text-foreground mb-3">Scoring Formula</h4>
            <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 font-mono text-sm mb-4">
              <code className="text-primary">finalScore = (promptScore × 0.5) + (outputScore × 0.5)</code>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-foreground">Prompt Score (50%)</strong>
                <p className="text-muted-foreground">Quality of your prompt's structure and clarity</p>
              </div>
              <div>
                <strong className="text-foreground">Output Score (50%)</strong>
                <p className="text-muted-foreground">Quality and intent alignment of the AI response</p>
              </div>
            </div>
          </Card>

          <h4 className="font-semibold text-foreground mb-3">8 Quality Pillars</h4>
          <div className="grid md:grid-cols-2 gap-2">
            {scoringPillars.map((pillar, index) => (
              <Card key={index} className="p-3 glass-card border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-foreground text-sm">{pillar.name}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-4">{pillar.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 3: Review Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">What You Get</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall score (0-100)</li>
                <li>• 8-pillar breakdown with individual scores</li>
                <li>• AI-generated output from your prompt</li>
                <li>• Strengths analysis</li>
                <li>• Weaknesses identification</li>
                <li>• Specific improvement suggestions</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Score Interpretation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong className="text-green-500">≥80%</strong> - Excellent, production-ready</li>
                <li>• <strong className="text-blue-500">60-79%</strong> - Good, minor improvements possible</li>
                <li>• <strong className="text-yellow-500">40-59%</strong> - Fair, needs optimization</li>
                <li>• <strong className="text-red-500">&lt;40%</strong> - Poor, significant rework needed</li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Auto-Optimize
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">
            After testing, use Auto-Optimize to automatically improve your prompt. The AI applies 
            targeted strategies to enhance weak pillars while preserving your original intent.
          </p>
          <Card className="p-4 glass-card border-primary/20 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Auto-Optimize improves the <em>prompt itself</em> (how you ask), 
              not the output format. Suggestions focus on making your instructions clearer, more specific, 
              and better structured—skills you can apply to all future prompts.
            </p>
          </Card>
        </section>

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            API Access
          </h2>
          <p className="text-muted-foreground mb-4">
            Lab is also available via API for programmatic testing:
          </p>
          <ul className="space-y-2 text-muted-foreground ml-4 mb-6">
            <li>• <code className="text-primary">POST /api-lab-test</code> - Single prompt test</li>
            <li>• <code className="text-primary">POST /api-lab-battle</code> - Battle comparison</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3 text-foreground">Pro Tips</h3>
          <div className="space-y-2 text-muted-foreground">
            <p>• Use Battle Mode to A/B test prompt variations before production</p>
            <p>• Check individual pillar scores to identify specific weaknesses</p>
            <p>• Save high-scoring prompts as templates for reuse</p>
            <p>• Run Auto-Optimize multiple times—each run may find different improvements</p>
            <p>• Focus on pillars with lowest scores for biggest impact</p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
