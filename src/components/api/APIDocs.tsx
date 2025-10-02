import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function APIDocs() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const baseUrl = 'https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/agent-invoke';
  
  const curlExample = `curl -X POST ${baseUrl} \\
  -H "Authorization: Bearer pk_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "550e8400-e29b-41d4-a716-446655440000",
    "input": "Write a function that calculates fibonacci numbers"
  }'`;

  const requestExample = `{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": "Write a function that calculates fibonacci numbers"
}`;

  const responseExample = `{
  "output": "Here's a function that calculates fibonacci numbers:\\n\\nfunction fibonacci(n) {\\n  if (n <= 1) return n;\\n  return fibonacci(n - 1) + fibonacci(n - 2);\\n}",
  "tokens_used": 87,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "processing_time_ms": 1234,
  "timestamp": "2024-01-20T12:00:00.000Z"
}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
          <CardDescription>Use this endpoint to invoke your agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono">POST /functions/v1/agent-invoke</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(baseUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                {baseUrl}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Include your API key in the Authorization header</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block bg-muted p-3 rounded text-sm">
            Authorization: Bearer YOUR_API_KEY
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>cURL Example</CardTitle>
              <CardDescription>Example request using cURL</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(curlExample)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
            {curlExample}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request Body</CardTitle>
              <CardDescription>JSON payload structure</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(requestExample)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            {requestExample}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Response Format</CardTitle>
              <CardDescription>Expected response structure</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(responseExample)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            {responseExample}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
