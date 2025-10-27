import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { useEffect } from 'react';

export default function PromptEngineeringTool() {
  useEffect(() => {
    document.title = 'Prompt Engineering Tool Guide | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Step-by-step guide for engineers to create, test, and optimize AI prompts using PrompTek\'s advanced engineering tools.');
    }
  }, []);

  return (
    <DocsLayout
      title="Prompt Engineering Tool"
      description="Complete guide for developers and engineers to leverage PrompTek's advanced prompt creation and testing workflow."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Getting Started
          </h2>
          <p className="text-muted-foreground mb-6">
            PrompTek's engineering interface is designed for technical users who need precision control over
            prompt design, testing parameters, and optimization strategies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 1: Create Your Prompt
          </h2>
          <Card className="p-6 glass-card border-primary/20 mb-4">
            <p className="text-muted-foreground mb-4">
              Start by writing or pasting your prompt into the main editor. PrompTek supports:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• System prompts and instructions</li>
              <li>• User messages and queries</li>
              <li>• Multi-turn conversation templates</li>
              <li>• Function calling definitions</li>
            </ul>
          </Card>

          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-muted-foreground">Example Prompt</span>
            </div>
            <pre className="text-sm font-mono text-foreground overflow-x-auto">
{`You are an expert code reviewer. Analyze the following
code for potential bugs, security issues, and best
practice violations. Provide specific, actionable feedback.

Code:
{{user_code}}

Focus areas:
- Security vulnerabilities
- Performance bottlenecks
- Code maintainability`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 2: Configure Test Parameters
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Select which AI models to test against and configure parameters:
            </p>
            <Card className="p-6 glass-card border-primary/20">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">Models:</span>
                  <span>GPT-4, Claude 3.5, Gemini Pro, or custom endpoints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">Temperature:</span>
                  <span>Control randomness (0.0 - 2.0)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">Max tokens:</span>
                  <span>Response length limit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">Test cases:</span>
                  <span>Multiple input variations for robust testing</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 3: Run Optimization
          </h2>
          <p className="text-muted-foreground mb-4">
            Execute your prompt tests and receive detailed analysis including:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Performance Metrics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Response time and latency</li>
                <li>• Token usage and costs</li>
                <li>• Success/failure rates</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Quality Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clarity and specificity scores</li>
                <li>• Output consistency</li>
                <li>• Improvement suggestions</li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 4: Iterate and Deploy
          </h2>
          <p className="text-muted-foreground mb-4">
            Use the insights to refine your prompt, then save optimized versions to your template library
            or export for production use. PrompTek tracks version history and performance over time.
          </p>
        </section>

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Pro Tips
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• Use variables (e.g., <code className="text-primary">{'{{variable_name}}'}</code>) for dynamic content</p>
            <p>• Test with diverse input samples to ensure robustness</p>
            <p>• Save successful prompt patterns as reusable templates</p>
            <p>• Monitor performance metrics over time to catch regressions</p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
