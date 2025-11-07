import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { useEffect } from 'react';

export default function PromptEngineeringTool() {
  useEffect(() => {
    document.title = 'Lab Guide | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Step-by-step guide to create, test, and optimize AI prompts using PrompTek Lab\'s advanced testing and analysis tools.');
    }
  }, []);

  return (
    <DocsLayout
      title="Lab"
      description="Complete guide to leverage PrompTek Lab for prompt testing, comparison, and optimization."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            What is Lab?
          </h2>
          <p className="text-muted-foreground mb-6">
            Lab is PrompTek's advanced prompt testing environment where you can test prompts against multiple AI models,
            compare different prompt variations side-by-side, and receive detailed scoring and analysis to optimize your prompts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 1: Enter Your Prompt
          </h2>
          <Card className="p-6 glass-card border-primary/20 mb-4">
            <p className="text-muted-foreground mb-4">
              In Lab, you can test prompts in two modes:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• <strong>Single Test:</strong> Analyze one prompt and get detailed scoring</li>
              <li>• <strong>Battle Mode:</strong> Compare two prompt variations side-by-side to see which performs better</li>
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
            Step 2: Select AI Model & Output Type
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Choose which AI model to test your prompt against and specify the expected output format:
            </p>
            <Card className="p-6 glass-card border-primary/20">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">AI Models:</span>
                  <span>GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Gemini 2.0 Flash, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-32">Output Types:</span>
                  <span>Text, Code, JSON, List, Creative, Email, Summary, or Analysis</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 3: Run Test & Get Analysis
          </h2>
          <p className="text-muted-foreground mb-4">
            Click "Run Test" or "Start Battle" to execute your prompt(s) and receive comprehensive analysis:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Detailed Scoring</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall quality score (0-100)</li>
                <li>• Category breakdowns (Clarity, Specificity, etc.)</li>
                <li>• Visual score gauges and charts</li>
              </ul>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">AI Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Expert feedback on prompt quality</li>
                <li>• Specific improvement suggestions</li>
                <li>• Strengths and weaknesses breakdown</li>
              </ul>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Step 4: Auto-Optimize (Optional)
          </h2>
          <p className="text-muted-foreground mb-4">
            After getting test results, you can use the "Auto-Optimize" feature to let AI automatically improve your prompt.
            You'll see a before/after comparison with detailed metrics, and you can choose to accept or reject the optimized version.
          </p>
        </section>

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Using Lab via API
          </h2>
          <p className="text-muted-foreground mb-4">
            Lab can also be accessed programmatically via API. Visit the <strong>API</strong> tab to:
          </p>
          <ul className="space-y-2 text-muted-foreground ml-4 mb-6">
            <li>• Create User API keys for direct Lab access</li>
            <li>• Test single prompts with <code className="text-primary">/api-lab-test</code></li>
            <li>• Compare prompts with <code className="text-primary">/api-lab-battle</code></li>
            <li>• Get the same detailed scoring and analysis programmatically</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3 text-foreground">Pro Tips</h3>
          <div className="space-y-2 text-muted-foreground">
            <p>• Use Battle Mode to A/B test different prompt variations</p>
            <p>• Experiment with different output types to optimize for your specific use case</p>
            <p>• Save high-scoring prompts as templates for reuse</p>
            <p>• Try Auto-Optimize multiple times to find the best version</p>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
