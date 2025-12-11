import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Code, Key, Zap, FileJson } from 'lucide-react';
import { useEffect } from 'react';

export default function Documentation() {
  useEffect(() => {
    document.title = 'Technical Documentation | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Complete technical documentation for PrompTek API including endpoints, authentication, and integration examples.');
    }
  }, []);

  return (
    <DocsLayout
      title="Documentation"
      description="Complete technical reference for integrating PrompTek into your applications via API."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Getting Started
          </h2>
          <Card className="p-6 glass-card border-primary/20">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Quick Start</h3>
            <p className="text-muted-foreground mb-4">
              PrompTek provides a REST API for programmatic access to prompt optimization, testing, and analysis.
              All API endpoints are available through Supabase Edge Functions.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Create an account at PrompTek</p>
              <p>2. Navigate to the <strong>API</strong> tab in your dashboard</p>
              <p>3. Generate a User API Key</p>
              <p>4. Use your API key to authenticate requests</p>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Authentication
          </h2>
          <Card className="p-6 glass-card border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">API Key Authentication</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Include your API key in the <code className="text-primary">Authorization</code> header as a Bearer token.
            </p>
            <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
              <pre className="text-foreground overflow-x-auto">
{`curl -X POST https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/api-lab-test \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"prompt": "Your prompt here"}'`}
              </pre>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            API Endpoints
          </h2>
          <div className="space-y-4">
            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">POST /api-lab-test</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Test a single prompt and receive detailed 8-pillar scoring and analysis
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre className="text-foreground">
{`{
  "prompt": "Your prompt to test",
  "model": "gpt-4o-mini",       // optional
  "outputType": "text"           // text, code, json, list, essay
}`}
                </pre>
              </div>
            </Card>

            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">POST /api-lab-battle</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compare two prompt variations side-by-side with detailed analysis
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre className="text-foreground">
{`{
  "promptA": "First prompt variation",
  "promptB": "Second prompt variation",
  "model": "gpt-4o-mini",
  "outputType": "text"
}`}
                </pre>
              </div>
            </Card>

            <Card className="p-5 glass-card border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileJson className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">POST /prompt-optimizer</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimize a prompt using PrompTek's 8-strategy optimization engine
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre className="text-foreground">
{`{
  "prompt": "Your prompt to optimize",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "outputType": "text",
  "variants": 3,
  "speedMode": false     // true for fast, false for deep optimization
}`}
                </pre>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Response Format
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            All API responses include detailed scoring across 8 quality pillars:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`{
  "success": true,
  "totalScore": 85,
  "categoryBreakdown": {
    "clarity": 90,
    "specificity": 85,
    "efficiency": 80,
    "structure": 88,
    "constraints": 82,
    "elaboration": 84,
    "intentAlignment": 87,
    "adaptability": 78
  },
  "analysis": {
    "strengths": ["Clear role definition", "Specific output format"],
    "weaknesses": ["Could add more context"],
    "suggestedFixes": ["Add example outputs", "Specify tone"]
  },
  "output": "Generated response from the AI model"
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            JavaScript Example
          </h2>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`// Test a prompt via API
const response = await fetch(
  'https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/api-lab-test',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: 'You are a helpful assistant. Explain quantum computing in simple terms.',
      model: 'gpt-4o-mini',
      outputType: 'text'
    })
  }
);

const result = await response.json();
console.log('Score:', result.totalScore);
console.log('Breakdown:', result.categoryBreakdown);
console.log('Analysis:', result.analysis);`}
            </pre>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
