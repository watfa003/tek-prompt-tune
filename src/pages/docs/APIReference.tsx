import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function APIReference() {
  useEffect(() => {
    document.title = 'API Reference | PromptTek Documentation';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Complete API reference for PromptTek - agent invocation, history, favorites, lab testing, and more.');
    }
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const baseUrl = 'https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1';

  return (
    <DocsLayout
      title="API Reference"
      description="Complete reference for integrating PromptTek into your applications programmatically."
    >
      <div className="space-y-8">
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with PromptTek API</CardTitle>
              <CardDescription>Follow these steps to start using the API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-sm font-medium">Create an agent or get a user API key from the API Management page</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-sm font-medium">Copy your API key (starts with <code className="bg-muted px-1 rounded">pk_</code>)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <p className="text-sm font-medium">Make your first API call using the examples below</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Key Types */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">API Key Types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Keys</CardTitle>
                <Badge className="w-fit">agent</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Used to invoke specific AI agents. Each key is tied to one agent.</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>✅ <code className="bg-muted px-1 rounded">POST /agent-invoke</code></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Keys</CardTitle>
                <Badge className="w-fit" variant="secondary">user</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">General-purpose keys for accessing your data and running tests.</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>✅ <code className="bg-muted px-1 rounded">GET /api-history</code></p>
                  <p>✅ <code className="bg-muted px-1 rounded">GET /api-favorites</code></p>
                  <p>✅ <code className="bg-muted px-1 rounded">POST /api-lab-test</code></p>
                  <p>✅ <code className="bg-muted px-1 rounded">POST /api-lab-battle</code></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                All API requests require authentication using your API key. You can provide it in two ways:
              </p>
              <Tabs defaultValue="header">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="header">Authorization Header</TabsTrigger>
                  <TabsTrigger value="body">Request Body</TabsTrigger>
                </TabsList>
                <TabsContent value="header">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyCode('Authorization: Bearer pk_your_api_key_here')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs mt-2">
{`Authorization: Bearer pk_your_api_key_here`}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">✅ Recommended - More secure</p>
                </TabsContent>
                <TabsContent value="body">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyCode('{\n  "apiKey": "pk_your_api_key_here",\n  ...\n}')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs mt-2">
{`{
  "apiKey": "pk_your_api_key_here",
  "agent_id": "...",
  "input": "..."
}`}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">⚠️ Works but less secure</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints Overview */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Endpoints Overview</h2>
          <div className="space-y-2">
            <EndpointRow method="POST" path="/agent-invoke" description="Execute an AI agent with your prompts" keyType="agent" />
            <EndpointRow method="GET" path="/api-history" description="Fetch your optimization/prompt history" keyType="user" />
            <EndpointRow method="GET" path="/api-favorites" description="Get all favorited items" keyType="user" />
            <EndpointRow method="POST" path="/api-lab-test" description="Test a prompt with 8-pillar analysis" keyType="user" />
            <EndpointRow method="POST" path="/api-lab-battle" description="Compare two prompts head-to-head" keyType="user" />
          </div>
        </section>

        {/* Detailed Endpoints */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Detailed Endpoint Documentation</h2>
          
          {/* Agent Invoke */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge>POST</Badge>
                <code className="text-sm">/agent-invoke</code>
                <Badge variant="outline">Agent Key</Badge>
              </div>
              <CardDescription>Execute an AI agent with optional runtime overrides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`{
  "agent_id": "uuid-of-your-agent",
  "input": "Your prompt or question here",
  "overrides": {
    "temperature": 0.9,
    "max_tokens": 1000,
    "output_type": "json",
    "mode": "deep"
  }
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "agent_id": "uuid-of-your-agent",
  "input": "Your prompt or question here",
  "overrides": {
    "temperature": 0.9,      // Optional: 0-1
    "max_tokens": 1000,      // Optional: Max output length
    "output_type": "json",   // Optional: text|code|json|list|essay
    "mode": "deep",          // Optional: chat|speed|deep
    "variants": 5,           // Optional: Number of variants (for optimization modes)
    "system_prompt": "..."   // Optional: Override system prompt
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`{
  "agentId": "uuid-of-your-agent",
  "output": "The AI's response...",
  "tokens_used": 245,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "processing_time_ms": 1234,
  "config_used": { ... },
  "timestamp": "2025-01-20T12:00:00.000Z"
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`// For chat mode:
{
  "agentId": "uuid-of-your-agent",
  "output": "The AI's response...",
  "tokens_used": 245,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "processing_time_ms": 1234,
  "config_used": { ... },
  "timestamp": "2025-01-20T12:00:00.000Z"
}

// For optimization modes (speed/deep):
{
  "agentId": "uuid-of-your-agent",
  "optimized_prompt": "Enhanced version of your prompt",
  "original_prompt": "Your original input",
  "score": 8.7,
  "strategy": "clarity",
  "variants_count": 3,
  "improvement_score": 1.2,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "processing_time_ms": 2345,
  "config_used": { ... },
  "timestamp": "2025-01-20T12:00:00.000Z"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API History */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">GET</Badge>
                <code className="text-sm">/api-history</code>
                <Badge variant="outline">User Key</Badge>
              </div>
              <CardDescription>Fetch your optimization and prompt history with filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <div className="bg-muted p-4 rounded-md text-xs space-y-2">
                  <div><code>limit</code> - Number of results (default: 50, max: 200)</div>
                  <div><code>offset</code> - Pagination offset (default: 0)</div>
                  <div><code>provider</code> - Filter by AI provider (e.g., "openai", "anthropic")</div>
                  <div><code>output_type</code> - Filter by output type (e.g., "code", "json")</div>
                  <div><code>favorites_only</code> - Show only favorites (true/false)</div>
                  <div><code>order_by</code> - Sort field: "created_at" or "score" (default: created_at)</div>
                  <div><code>order</code> - Sort order: "asc" or "desc" (default: desc)</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai&order_by=score&order=desc" \\
  -H "Authorization: Bearer pk_your_user_api_key"`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai&order_by=score&order=desc" \\
  -H "Authorization: Bearer pk_your_user_api_key"`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`{
  "history": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "history": [
    {
      "id": "uuid",
      "prompt": "Original prompt text",
      "optimized_prompt": "Optimized version",
      "score": 8.5,
      "provider": "openai",
      "model": "gpt-4o-mini",
      "output_type": "text",
      "variants_generated": 3,
      "is_favorite": false,
      "status": "completed",
      "created_at": "2025-01-20T12:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Favorites */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">GET</Badge>
                <code className="text-sm">/api-favorites</code>
                <Badge variant="outline">User Key</Badge>
              </div>
              <CardDescription>Fetch all your favorited items with enriched details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <div className="bg-muted p-4 rounded-md text-xs">
                  <code>item_type</code> - Optional filter: "prompt" or "template"
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`curl -X GET "${baseUrl}/api-favorites?item_type=prompt" \\
  -H "Authorization: Bearer pk_your_user_api_key"`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X GET "${baseUrl}/api-favorites?item_type=prompt" \\
  -H "Authorization: Bearer pk_your_user_api_key"`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "favorites": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "item_id": "uuid",
      "item_type": "prompt",
      "created_at": "2025-01-20T12:00:00.000Z",
      "item_details": {
        "id": "uuid",
        "original_prompt": "...",
        "optimized_prompt": "...",
        "score": 9.2,
        ...
      }
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Lab Test */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge>POST</Badge>
                <code className="text-sm">/api-lab-test</code>
                <Badge variant="outline">User Key</Badge>
              </div>
              <CardDescription>Test a single prompt with comprehensive 8-pillar analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`{
  "prompt": "Explain quantum computing in simple terms",
  "target_llm": "gpt-4o-mini",
  "output_type": "text",
  "test_task": "Optional test task description"
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "prompt": "Explain quantum computing in simple terms",
  "target_llm": "gpt-4o-mini",       // Required
  "output_type": "text",              // Optional: text|code|json|list|essay
  "test_task": "Optional test task"   // Optional
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Supported LLMs</h4>
                <div className="bg-muted p-4 rounded-md text-xs space-y-1">
                  <div>• <code>gpt-4o-mini</code>, <code>gpt-4o</code>, <code>gpt-5-2025-08-07</code></div>
                  <div>• <code>claude-sonnet-4-20250514</code>, <code>claude-opus-4-1-20250805</code></div>
                  <div>• <code>gemini-2.5-flash</code>, <code>gemini-2.5-pro</code></div>
                  <div>• <code>google/gemini-2.5-flash</code> (for Lovable AI Gateway)</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "result_id": "uuid",
  "prompt": "Your prompt",
  "total_score": 7.8,
  "category_breakdown": {
    "clarity": 9.0,
    "specificity": 7.5,
    "efficiency": 8.0,
    "structure": 7.0,
    "constraints": 6.5,
    "elaboration": 7.5,
    "intent_alignment": 9.0,
    "adaptability": 7.8
  },
  "ai_output": "The AI's generated response...",
  "prompt_type": "complex",
  "ai_analysis": {
    "strengths": [...],
    "weaknesses": [...],
    "suggested_fixes": [...]
  },
  "target_llm": "gpt-4o-mini",
  "response_latency_ms": 1234
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Lab Battle */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge>POST</Badge>
                <code className="text-sm">/api-lab-battle</code>
                <Badge variant="outline">User Key</Badge>
              </div>
              <CardDescription>Compare two prompts head-to-head to determine which performs better</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyCode(`{
  "prompt_a": "Explain quantum computing",
  "prompt_b": "Explain quantum computing in simple terms with examples",
  "target_llm": "gpt-4o-mini",
  "output_type": "text",
  "test_task": "Optional test task"
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "prompt_a": "Explain quantum computing",
  "prompt_b": "Explain quantum computing in simple terms with examples",
  "target_llm": "gpt-4o-mini",      // Required
  "output_type": "text",             // Optional
  "test_task": "Optional test task"  // Optional
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "result_id": "uuid",
  "winner": "prompt_b",           // "prompt_a", "prompt_b", or "tie"
  "prompt_a": "Your first prompt",
  "prompt_b": "Your second prompt",
  "score_a": 7.2,
  "score_b": 8.9,
  "category_breakdown_a": { ... },
  "category_breakdown_b": { ... },
  "reasoning": "Prompt B performs better because...",
  "target_llm": "gpt-4o-mini"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error Handling */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">All errors follow a consistent format with HTTP status codes:</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">400</Badge>
                    <span className="font-medium">Bad Request</span>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs">
{`{
  "error": "Missing required fields: prompt and target_llm"
}`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">401</Badge>
                    <span className="font-medium">Unauthorized</span>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs">
{`{
  "error": "Invalid or unauthorized API key"
}`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">404</Badge>
                    <span className="font-medium">Not Found</span>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs">
{`{
  "error": "Agent not found"
}`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">500</Badge>
                    <span className="font-medium">Internal Server Error</span>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs">
{`{
  "error": "Internal server error occurred"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/docs/api-examples'}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  API Examples
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>View code examples in Python, Node.js, cURL, and n8n</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/app/api'}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  API Management
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Create agents and generate API keys</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

function EndpointRow({ method, path, description, keyType }: { method: string; path: string; description: string; keyType: 'agent' | 'user' }) {
  const methodColor = method === 'GET' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  const keyColor = keyType === 'agent' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary-foreground border-secondary/20';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Badge className={methodColor} variant="outline">{method}</Badge>
        <code className="text-sm font-mono">{path}</code>
        <span className="text-sm text-muted-foreground hidden md:block">{description}</span>
      </div>
      <Badge className={keyColor} variant="outline">{keyType}</Badge>
    </div>
  );
}
