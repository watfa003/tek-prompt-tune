import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AgentFormProps {
  onSuccess?: () => void;
}

const LLM_PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Mistral',
  'Google Gemini',
  'Ollama',
  'Groq',
  'Other'
];

const AGENT_MODES = [
  { value: 'chat', label: 'Chat' },
  { value: 'completion', label: 'Completion' },
  { value: 'embedding', label: 'Embedding' }
];

export function AgentForm({ onSuccess }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    model: '',
    mode: 'chat',
    maxTokens: 2048,
    temperature: 0.7,
    userPrompt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: formData.name,
          provider: formData.provider,
          model: formData.model,
          mode: formData.mode,
          max_tokens: formData.maxTokens,
          temperature: formData.temperature,
          user_prompt: formData.userPrompt
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Generate API key
      const apiKey = `pk_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      
      const { error: keyError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          key: apiKey,
          name: `${formData.name} Key`
        });

      if (keyError) throw keyError;

      toast.success('Agent created successfully!');
      setFormData({
        name: '',
        provider: '',
        model: '',
        mode: 'chat',
        maxTokens: 2048,
        temperature: 0.7,
        userPrompt: ''
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Agent</CardTitle>
        <CardDescription>Configure your AI agent with custom settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My AI Assistant"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">LLM Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="gpt-4, claude-3, etc."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(value) => setFormData({ ...formData, mode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens: {formData.maxTokens}</Label>
            <Input
              type="number"
              id="maxTokens"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
              min={1}
              max={32000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPrompt">System Prompt</Label>
            <Textarea
              id="userPrompt"
              value={formData.userPrompt}
              onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
              placeholder="You are a helpful assistant..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Agent
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
