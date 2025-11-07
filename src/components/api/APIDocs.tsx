import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function APIDocs() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const baseUrl = 'https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1';

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>PromptTek API Overview</CardTitle>
          <CardDescription>
            Two types of API access for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge>Agent Keys</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Use pre-configured agents for consistent AI responses
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">POST /agent-invoke</code>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">User Keys</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Access history, favorites, lab testing, and more
              </p>
              <div className="text-xs space-y-1">
                <code className="bg-muted px-2 py-1 rounded block">GET /api-history</code>
                <code className="bg-muted px-2 py-1 rounded block">POST /api-lab-test</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agent">Agent API</TabsTrigger>
          <TabsTrigger value="user">User API</TabsTrigger>
        </TabsList>

        {/* Agent API Documentation */}
        <TabsContent value="agent" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Invocation</CardTitle>
                  <CardDescription>Execute pre-configured AI agents</CardDescription>
                </div>
                <Badge>POST</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
                <code className="block bg-muted p-3 rounded text-xs">
                  POST {baseUrl}/agent-invoke
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Basic Request (Chat Mode)</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Write a product description for eco-friendly water bottles"
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Write a product description"
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">With Runtime Overrides</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Perfect for n8n workflows - change agent behavior per request without creating new agents!
                </p>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(`{
  "agent_id": "YOUR_AGENT_ID",
  "input": "Generate a haiku about AI",
  "overrides": {
    "temperature": 0.9,
    "max_tokens": 500,
    "output_type": "creative",
    "mode": "deep"
  }
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "agent_id": "YOUR_AGENT_ID",
  "input": "Generate a haiku about AI",
  "overrides": {
    "temperature": 0.9,      // 0-1, higher = more creative
    "max_tokens": 500,       // Max response length
    "output_type": "creative", // text|code|json|list|essay|creative
    "mode": "deep",          // chat|speed|deep
    "variants": 5,           // For optimization modes
    "system_prompt": "..."   // Override agent's system prompt
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Response Format</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`// Chat Mode Response:
{
  "agentId": "...",
  "output": "The AI's response...",
  "tokens_used": 245,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "processing_time_ms": 1234,
  "config_used": { ... }
}

// Optimization Mode Response:
{
  "agentId": "...",
  "optimized_prompt": "Enhanced version...",
  "original_prompt": "Your input",
  "score": 8.7,
  "strategy": "clarity",
  "variants_count": 3
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User API Documentation */}
        <TabsContent value="user" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>History API</CardTitle>
                  <CardDescription>Fetch your optimization and prompt history</CardDescription>
                </div>
                <Badge variant="secondary">GET</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
                <code className="block bg-muted p-3 rounded text-xs">
                  GET {baseUrl}/api-history
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Query Parameters</h4>
                <div className="bg-muted p-4 rounded text-xs space-y-2">
                  <div><code>limit</code> - Results per page (default: 50, max: 200)</div>
                  <div><code>offset</code> - Pagination offset (default: 0)</div>
                  <div><code>provider</code> - Filter by AI provider (openai, anthropic, google)</div>
                  <div><code>output_type</code> - Filter by type (text, code, json, etc.)</div>
                  <div><code>favorites_only</code> - true/false</div>
                  <div><code>order_by</code> - Sort by: created_at or score</div>
                  <div><code>order</code> - asc or desc</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Example Request</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai&order_by=score&order=desc" \\
  -H "Authorization: Bearer YOUR_USER_API_KEY"`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai" \\
  -H "Authorization: Bearer YOUR_USER_API_KEY"`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lab Test API</CardTitle>
                  <CardDescription>Test prompts with 8-pillar analysis</CardDescription>
                </div>
                <Badge variant="secondary">POST</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
                <code className="block bg-muted p-3 rounded text-xs">
                  POST {baseUrl}/api-lab-test
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Example Request</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api-lab-test \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "YOUR_USER_API_KEY",
    "prompt": "Explain quantum computing",
    "target_llm": "openai/gpt-4o-mini",
    "output_type": "text"
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`curl -X POST ${baseUrl}/api-lab-test \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "YOUR_USER_API_KEY",
    "prompt": "Explain quantum computing",
    "target_llm": "openai/gpt-4o-mini",
    "output_type": "text"
  }'`}
                  </pre>
                </div>
              </div>

               <div>
                <h4 className="font-medium mb-2 text-sm">Response</h4>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "result_id": "uuid",
  "total_score": 7.8,
  "category_breakdown": {
    "clarity": 9.0,
    "specificity": 7.5,
    "efficiency": 8.0,
    ...
  },
  "ai_output": "Generated response...",
  "ai_analysis": {
    "strengths": [...],
    "weaknesses": [...],
    "suggested_fixes": [...]
  },
  "prompt_type": "complex"
}

Note: Lab tests and analyzes prompts without changing 
the original. Auto-optimization is available separately.`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lab Battle API</CardTitle>
                  <CardDescription>Compare two prompts head-to-head</CardDescription>
                </div>
                <Badge variant="secondary">POST</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
                <code className="block bg-muted p-3 rounded text-xs">
                  POST {baseUrl}/api-lab-battle
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Example Request</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api-lab-battle \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "YOUR_USER_API_KEY",
    "prompt_a": "Explain quantum computing",
    "prompt_b": "Explain quantum computing in simple terms with examples",
    "target_llm": "openai/gpt-4o-mini",
    "output_type": "text"
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`curl -X POST ${baseUrl}/api-lab-battle \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "YOUR_USER_API_KEY",
    "prompt_a": "Explain quantum computing",
    "prompt_b": "Explain quantum computing with examples",
    "target_llm": "openai/gpt-4o-mini",
    "output_type": "text"
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Response</h4>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "result_id": "uuid",
  "winner": "prompt_b",
  "score_a": 7.2,
  "score_b": 8.9,
  "reasoning": "Prompt B performs better because..."
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Favorites API</CardTitle>
                  <CardDescription>Access your favorited items</CardDescription>
                </div>
                <Badge variant="secondary">GET</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
                <code className="block bg-muted p-3 rounded text-xs">
                  GET {baseUrl}/api-favorites?item_type=prompt
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => window.location.href = '/docs/api'}
          >
            <span>View Full API Reference</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => window.location.href = '/docs/api-examples'}
          >
            <span>Browse Code Examples (Python, Node.js, n8n)</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
