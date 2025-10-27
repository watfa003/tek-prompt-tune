import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function APIReference() {
  useEffect(() => {
    document.title = 'API Reference | PrompTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Complete API reference for PrompTek - endpoints, authentication, request/response formats, and rate limits for programmatic prompt optimization.');
    }
  }, []);

  const endpoints = [
    {
      method: 'POST',
      path: '/v1/optimize',
      description: 'Optimize a single prompt across selected models',
      auth: true,
    },
    {
      method: 'POST',
      path: '/v1/batch',
      description: 'Run batch optimization on multiple prompts',
      auth: true,
    },
    {
      method: 'GET',
      path: '/v1/history',
      description: 'Retrieve optimization history',
      auth: true,
    },
    {
      method: 'GET',
      path: '/v1/templates',
      description: 'List available prompt templates',
      auth: true,
    },
    {
      method: 'POST',
      path: '/v1/templates',
      description: 'Create a new prompt template',
      auth: true,
    },
    {
      method: 'GET',
      path: '/v1/models',
      description: 'List available AI models',
      auth: false,
    },
  ];

  return (
    <DocsLayout
      title="API Reference"
      description="Complete reference for integrating PrompTek into your applications programmatically."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Authentication
          </h2>
          <Card className="p-6 glass-card border-primary/20 mb-4">
            <p className="text-muted-foreground mb-4">
              All API requests require authentication using an API key. Include your key in the Authorization header:
            </p>
            <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
              <pre className="text-foreground">
{`Authorization: Bearer YOUR_API_KEY`}
              </pre>
            </div>
          </Card>
          <p className="text-sm text-muted-foreground">
            Generate API keys from your{' '}
            <span className="text-primary font-semibold">Account Settings → API Keys</span> page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Base URL
          </h2>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-primary">
              https://api.promptek.ai
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Endpoints
          </h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="p-5 glass-card border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`font-mono ${
                        endpoint.method === 'GET'
                          ? 'text-green-400 border-green-400/40'
                          : 'text-blue-400 border-blue-400/40'
                      }`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm text-foreground">{endpoint.path}</code>
                  </div>
                  {endpoint.auth && (
                    <Badge variant="secondary" className="text-xs">
                      Auth Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{endpoint.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            POST /v1/optimize
          </h2>
          <p className="text-muted-foreground mb-4">
            Optimize a prompt and receive detailed analysis and scores.
          </p>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Request Body</h3>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm mb-6">
            <pre className="text-foreground overflow-x-auto">
{`{
  "prompt": "Your prompt text here",
  "models": ["gpt-4", "claude-3.5-sonnet"],
  "options": {
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 1.0
  },
  "testCases": [
    { "input": "test case 1" },
    { "input": "test case 2" }
  ]
}`}
            </pre>
          </div>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Response</h3>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`{
  "id": "opt_abc123",
  "status": "completed",
  "score": 0.87,
  "metrics": {
    "clarity": 0.91,
    "specificity": 0.85,
    "effectiveness": 0.89
  },
  "suggestions": [
    "Consider adding specific output format requirements",
    "Define edge case handling"
  ],
  "modelResults": [
    {
      "model": "gpt-4",
      "output": "...",
      "latency": 1234,
      "tokens": { "input": 50, "output": 200 },
      "cost": 0.0042
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z"
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Rate Limits
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Free Tier</h3>
              <p className="text-2xl font-bold text-primary mb-1">50</p>
              <p className="text-xs text-muted-foreground">requests per month</p>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Pro Tier</h3>
              <p className="text-2xl font-bold text-primary mb-1">10,000</p>
              <p className="text-xs text-muted-foreground">requests per month</p>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Enterprise</h3>
              <p className="text-2xl font-bold text-primary mb-1">Custom</p>
              <p className="text-xs text-muted-foreground">negotiated limits</p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Error Handling
          </h2>
          <p className="text-muted-foreground mb-4">
            The API uses standard HTTP status codes and returns error details in JSON format:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg border border-primary/10 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
{`{
  "error": {
    "code": "invalid_request",
    "message": "Missing required field: prompt",
    "field": "prompt"
  }
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            SDKs & Libraries
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Node.js / TypeScript</h3>
              <code className="text-sm text-primary">npm install @promptek/sdk</code>
            </Card>
            <Card className="p-4 glass-card border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Python</h3>
              <code className="text-sm text-primary">pip install promptek</code>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
