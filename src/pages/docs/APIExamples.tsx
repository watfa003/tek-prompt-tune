import { useEffect } from 'react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function APIExamples() {
  useEffect(() => {
    document.title = 'API Examples - PromptTek';
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const baseUrl = 'https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1';

  return (
    <DocsLayout
      title="API Integration Examples"
      description="Code examples for integrating PromptTek API across different platforms and languages"
    >
      <div className="space-y-6">

        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="node">Node.js</TabsTrigger>
            <TabsTrigger value="n8n">n8n</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Invocation</CardTitle>
                <CardDescription>Execute an AI agent with your API key</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Write a product description for eco-friendly water bottles"
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Write a product description for eco-friendly water bottles"
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent with Overrides</CardTitle>
                <CardDescription>Override agent configuration at runtime</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Generate a haiku about AI",
    "overrides": {
      "temperature": 0.9,
      "output_type": "creative",
      "max_tokens": 500
    }
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X POST ${baseUrl}/agent-invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "input": "Generate a haiku about AI",
    "overrides": {
      "temperature": 0.9,
      "output_type": "creative",
      "max_tokens": 500
    }
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fetch History</CardTitle>
                <CardDescription>Get optimization history with filters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai&order_by=score&order=desc" \\
  -H "Authorization: Bearer YOUR_USER_API_KEY"`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X GET "${baseUrl}/api-history?limit=20&provider=openai&order_by=score&order=desc" \\
  -H "Authorization: Bearer YOUR_USER_API_KEY"`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lab Test</CardTitle>
                <CardDescription>Test a single prompt with 8-pillar analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`curl -X POST ${baseUrl}/api-lab-test \\
  -H "Authorization: Bearer YOUR_USER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "target_llm": "gpt-4o-mini",
    "output_type": "text"
  }'`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`curl -X POST ${baseUrl}/api-lab-test \\
  -H "Authorization: Bearer YOUR_USER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "target_llm": "gpt-4o-mini",
    "output_type": "text"
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="python" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Python with requests</CardTitle>
                <CardDescription>Using the requests library for HTTP calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`import requests

# Configuration
BASE_URL = "${baseUrl}"
AGENT_API_KEY = "YOUR_AGENT_API_KEY"
USER_API_KEY = "YOUR_USER_API_KEY"
AGENT_ID = "YOUR_AGENT_ID"

# Example 1: Invoke an agent
def invoke_agent(input_text, overrides=None):
    url = f"{BASE_URL}/agent-invoke"
    headers = {
        "Authorization": f"Bearer {AGENT_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "agent_id": AGENT_ID,
        "input": input_text
    }
    if overrides:
        payload["overrides"] = overrides
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Example 2: Get history with pagination
def get_history(limit=50, offset=0, provider=None):
    url = f"{BASE_URL}/api-history"
    headers = {"Authorization": f"Bearer {USER_API_KEY}"}
    params = {"limit": limit, "offset": offset}
    if provider:
        params["provider"] = provider
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Example 3: Lab test
def lab_test(prompt, target_llm="gpt-4o-mini"):
    url = f"{BASE_URL}/api-lab-test"
    headers = {
        "Authorization": f"Bearer {USER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "target_llm": target_llm,
        "output_type": "text"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
if __name__ == "__main__":
    # Invoke agent
    result = invoke_agent("Write a tagline for a fitness app")
    print(f"Agent output: {result['output']}")
    
    # Get history
    history = get_history(limit=10, provider="openai")
    print(f"Found {len(history['history'])} prompts")
    
    # Test a prompt
    test_result = lab_test("Explain AI ethics")
    print(f"Prompt score: {test_result['total_score']}")`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-[600px]">
{`import requests

# Configuration
BASE_URL = "${baseUrl}"
AGENT_API_KEY = "YOUR_AGENT_API_KEY"
USER_API_KEY = "YOUR_USER_API_KEY"
AGENT_ID = "YOUR_AGENT_ID"

# Example 1: Invoke an agent
def invoke_agent(input_text, overrides=None):
    url = f"{BASE_URL}/agent-invoke"
    headers = {
        "Authorization": f"Bearer {AGENT_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "agent_id": AGENT_ID,
        "input": input_text
    }
    if overrides:
        payload["overrides"] = overrides
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Example 2: Get history with pagination
def get_history(limit=50, offset=0, provider=None):
    url = f"{BASE_URL}/api-history"
    headers = {"Authorization": f"Bearer {USER_API_KEY}"}
    params = {"limit": limit, "offset": offset}
    if provider:
        params["provider"] = provider
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Example 3: Lab test
def lab_test(prompt, target_llm="gpt-4o-mini"):
    url = f"{BASE_URL}/api-lab-test"
    headers = {
        "Authorization": f"Bearer {USER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "target_llm": target_llm,
        "output_type": "text"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
if __name__ == "__main__":
    # Invoke agent
    result = invoke_agent("Write a tagline for a fitness app")
    print(f"Agent output: {result['output']}")
    
    # Get history
    history = get_history(limit=10, provider="openai")
    print(f"Found {len(history['history'])} prompts")
    
    # Test a prompt
    test_result = lab_test("Explain AI ethics")
    print(f"Prompt score: {test_result['total_score']}")`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="node" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Node.js / TypeScript</CardTitle>
                <CardDescription>Using fetch API with TypeScript types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyCode(`// Configuration
const BASE_URL = "${baseUrl}";
const AGENT_API_KEY = "YOUR_AGENT_API_KEY";
const USER_API_KEY = "YOUR_USER_API_KEY";
const AGENT_ID = "YOUR_AGENT_ID";

// Type definitions
interface AgentInvokeResponse {
  agentId: string;
  output: string;
  tokens_used: number;
  model: string;
  provider: string;
  processing_time_ms: number;
  config_used: any;
  timestamp: string;
}

interface HistoryResponse {
  history: Array<{
    id: string;
    prompt: string;
    optimized_prompt: string;
    score: number;
    provider: string;
    model: string;
    output_type: string;
    is_favorite: boolean;
    status: string;
    created_at: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Example 1: Invoke agent
async function invokeAgent(
  input: string,
  overrides?: {
    temperature?: number;
    max_tokens?: number;
    output_type?: string;
  }
): Promise<AgentInvokeResponse> {
  const response = await fetch(\`\${BASE_URL}/agent-invoke\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${AGENT_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: AGENT_ID,
      input,
      ...(overrides && { overrides })
    })
  });

  if (!response.ok) {
    throw new Error(\`Agent invocation failed: \${response.statusText}\`);
  }

  return response.json();
}

// Example 2: Get history
async function getHistory(params?: {
  limit?: number;
  offset?: number;
  provider?: string;
  output_type?: string;
}): Promise<HistoryResponse> {
  const queryParams = new URLSearchParams(
    Object.entries(params || {}).map(([k, v]) => [k, String(v)])
  );

  const response = await fetch(
    \`\${BASE_URL}/api-history?\${queryParams}\`,
    {
      headers: { 'Authorization': \`Bearer \${USER_API_KEY}\` }
    }
  );

  if (!response.ok) {
    throw new Error(\`Failed to fetch history: \${response.statusText}\`);
  }

  return response.json();
}

// Example 3: Lab test
async function labTest(prompt: string, targetLlm: string = "gpt-4o-mini") {
  const response = await fetch(\`\${BASE_URL}/api-lab-test\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${USER_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      target_llm: targetLlm,
      output_type: 'text'
    })
  });

  if (!response.ok) {
    throw new Error(\`Lab test failed: \${response.statusText}\`);
  }

  return response.json();
}

// Usage
(async () => {
  try {
    // Invoke with overrides
    const result = await invokeAgent(
      "Write a haiku about coding",
      { temperature: 0.9, output_type: "creative" }
    );
    console.log(\`Output: \${result.output}\`);

    // Get history
    const history = await getHistory({ limit: 10, provider: 'openai' });
    console.log(\`Total prompts: \${history.pagination.total}\`);

    // Lab test
    const testResult = await labTest("Explain blockchain");
    console.log(\`Score: \${testResult.total_score}\`);
  } catch (error) {
    console.error('Error:', error);
  }
})();`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-[600px]">
{`// Configuration
const BASE_URL = "${baseUrl}";
const AGENT_API_KEY = "YOUR_AGENT_API_KEY";
const USER_API_KEY = "YOUR_USER_API_KEY";
const AGENT_ID = "YOUR_AGENT_ID";

// Type definitions
interface AgentInvokeResponse {
  agentId: string;
  output: string;
  tokens_used: number;
  model: string;
  provider: string;
  processing_time_ms: number;
  config_used: any;
  timestamp: string;
}

// ... rest of code shown in copy`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="n8n" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>n8n HTTP Request Node</CardTitle>
                <CardDescription>Configure the HTTP Request node for PromptTek API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Node Configuration</h4>
                  <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-mono">POST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="font-mono text-xs">{baseUrl}/agent-invoke</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authentication:</span>
                      <span className="font-mono">Header Auth</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Headers</h4>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyCode(`{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Body (JSON)</h4>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyCode(`{
  "agent_id": "{{ $json.agent_id }}",
  "input": "{{ $json.user_input }}",
  "overrides": {
    "temperature": {{ $json.temperature }},
    "output_type": "{{ $json.output_type }}"
  }
}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`{
  "agent_id": "{{ $json.agent_id }}",
  "input": "{{ $json.user_input }}",
  "overrides": {
    "temperature": {{ $json.temperature }},
    "output_type": "{{ $json.output_type }}"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Use n8n variables like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{{ $json.field }}`}</code> to dynamically 
                    pass different parameters for each workflow execution. This is perfect for batch processing or webhook-triggered workflows!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DocsLayout>
  );
}
