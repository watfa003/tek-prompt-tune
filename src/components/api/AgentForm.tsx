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
    mode: 'speed' as 'speed' | 'deep',
    systemPrompt: '',
    outputType: '',
    variants: 3,
    maxTokens: 2048,
    temperature: 0.7
  });

  // Auto-select model based on provider
  const handleProviderChange = (provider: string) => {
    let defaultModel = '';
    
    switch (provider) {
      case 'openai':
        defaultModel = 'gpt-4o-mini';
        break;
      case 'anthropic':
        defaultModel = 'claude-3-5-haiku-20241022';
        break;
      case 'google':
        defaultModel = 'gemini-2.5-flash';
        break;
      case 'groq':
        defaultModel = 'llama-3.1-8b';
        break;
      case 'mistral':
        defaultModel = 'mistral-medium';
        break;
    }
    
    setFormData({ ...formData, provider, model: defaultModel });
  };

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
        mode: 'speed',
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

        {/* Mode Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Optimization Mode</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="button"
              variant={formData.mode === 'speed' ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, mode: 'speed' })}
              className={`h-auto p-6 justify-start text-left transition-all duration-300 ${
                formData.mode === 'speed' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105' 
                  : 'hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <Loader2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-lg">⚡ Speed Mode</div>
                  <div className="text-sm opacity-90 mt-1">Ultra-fast processing</div>
                </div>
              </div>
            </Button>
            
            <Button
              type="button"
              variant={formData.mode === 'deep' ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, mode: 'deep' })}
              className={`h-auto p-6 justify-start text-left transition-all duration-300 ${
                formData.mode === 'deep' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                  : 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <Settings className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-lg">🔍 Deep Mode</div>
                  <div className="text-sm opacity-90 mt-1">Advanced AI optimization</div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">AI Provider</Label>
          <Select 
            value={formData.provider} 
            onValueChange={handleProviderChange}
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
          {formData.model && (
            <p className="text-xs text-muted-foreground mt-1">
              Using model: <span className="font-medium">{formData.model}</span>
            </p>
          )}
        </div>

        {/* Output Type */}
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

        {/* Max Tokens Slider */}
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
