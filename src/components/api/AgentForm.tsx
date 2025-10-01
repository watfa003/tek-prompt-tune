import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Settings, ChevronDown } from 'lucide-react';

interface AgentFormProps {
  onSuccess?: () => void;
}

export function AgentForm({ onSuccess }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    model: '',
    mode: 'chat',
    systemPrompt: '',
    outputType: '',
    variants: 3,
    maxTokens: 2048,
    temperature: 0.7
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.provider || !formData.model || !formData.outputType) {
      toast.error('Please select AI provider, model, and output type');
      return;
    }

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
          user_prompt: formData.systemPrompt
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
        systemPrompt: '',
        outputType: '',
        variants: 3,
        maxTokens: 2048,
        temperature: 0.7
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Create AI Agent</h2>
          <p className="text-muted-foreground">
            Configure your AI agent with custom settings and generate an API key
          </p>
        </div>

        {/* Agent Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Agent Name</Label>
          <Textarea
            id="name"
            placeholder="My AI Assistant"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="min-h-[60px] resize-none"
            required
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="systemPrompt" className="text-sm font-medium">
            System Prompt
          </Label>
          <Textarea
            id="systemPrompt"
            placeholder="You are a helpful AI assistant that..."
            value={formData.systemPrompt}
            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Provider and Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">AI Provider</Label>
            <Select 
              value={formData.provider} 
              onValueChange={(value) => setFormData({ ...formData, provider: value, model: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">LLM Model</Label>
            <Select 
              value={formData.model} 
              onValueChange={(value) => setFormData({ ...formData, model: value })}
              disabled={!formData.provider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LLM model" />
              </SelectTrigger>
              <SelectContent>
                {formData.provider === "openai" && (
                  <>
                    <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                    <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 mini</SelectItem>
                    <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 nano</SelectItem>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </>
                )}
                {formData.provider === "anthropic" && (
                  <>
                    <SelectItem value="claude-opus-4-1-20250805">Claude 4 Opus</SelectItem>
                    <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                    <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                  </>
                )}
                {formData.provider === "google" && (
                  <>
                    <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</SelectItem>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  </>
                )}
                {formData.provider === "groq" && (
                  <>
                    <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                  </>
                )}
                {formData.provider === "mistral" && (
                  <>
                    <SelectItem value="mistral-large">Mistral Large</SelectItem>
                    <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Output Type</Label>
            <Select 
              value={formData.outputType} 
              onValueChange={(value) => setFormData({ ...formData, outputType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select output type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="creative">Creative Writing</SelectItem>
                <SelectItem value="technical">Technical Documentation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Number of Variants</Label>
                  <span className="text-sm text-muted-foreground">{formData.variants}</span>
                </div>
                <Slider
                  value={[formData.variants]}
                  onValueChange={([value]) => setFormData({ ...formData, variants: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{formData.maxTokens}</span>
                </div>
                <Slider
                  value={[formData.maxTokens]}
                  onValueChange={([value]) => setFormData({ ...formData, maxTokens: value })}
                  min={100}
                  max={32000}
                  step={100}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Temperature</Label>
                  <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[formData.temperature]}
                  onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Agent & Generate API Key
        </Button>
      </form>
    </Card>
  );
}
