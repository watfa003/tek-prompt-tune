import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function APIDocs() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const curlExample = `curl -X POST https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/agent-invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "your-agent-id",
    "input": "Hello, how can you help me?"
  }'`;

  const requestExample = `{
  "agent_id": "uuid-of-your-agent",
  "input": "Your prompt or question here"
}`;

  const responseExample = `{
  "output": "AI generated response",
  "tokens_used": 150,
  "model": "gpt-4",
  "timestamp": "2025-01-01T12:00:00Z"
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
                  onClick={() => copyToClipboard('https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/agent-invoke')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1/agent-invoke
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
