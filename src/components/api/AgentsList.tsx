import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Agent {
  id: string;
  name: string;
  provider: string;
  model: string;
  mode: string;
  max_tokens: number;
  temperature: number;
  user_prompt: string | null;
  created_at: string;
  output_type: string;
  variants: number;
}

export function AgentsList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const modelOptions: Record<string, { value: string; label: string }[]> = {
    openai: [
      { value: 'gpt-5-2025-08-07', label: 'GPT-5' },
      { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini' },
      { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano' },
      { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
    ],
    anthropic: [
      { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1' },
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' }
    ],
    google: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }
    ],
    groq: [
      { value: 'llama-3.1-8b', label: 'Llama 3.1 8B' }
    ],
    mistral: [
      { value: 'mistral-large', label: 'Mistral Large' },
      { value: 'mistral-medium', label: 'Mistral Medium' }
    ]
  };

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Agent deleted successfully');
      setAgents(agents.filter(a => a.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Failed to delete agent');
    }
  };

  const handleUpdate = async () => {
    if (!editAgent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: editAgent.name,
          provider: editAgent.provider,
          model: editAgent.model,
          mode: editAgent.mode,
          max_tokens: editAgent.max_tokens,
          temperature: editAgent.temperature,
          user_prompt: editAgent.user_prompt,
          output_type: editAgent.output_type,
          variants: editAgent.variants
        })
        .eq('id', editAgent.id);

      if (error) throw error;

      toast.success('Agent updated successfully');
      setAgents(agents.map(a => a.id === editAgent.id ? editAgent : a));
      setEditAgent(null);
    } catch (error: any) {
      toast.error('Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-muted-foreground">Loading agents...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, provider, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {searchQuery ? 'No agents found matching your search' : 'No agents yet. Create your first agent to get started!'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors bg-gradient-to-r from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {agent.name}
                        <Badge variant="secondary" className="ml-auto">{agent.mode}</Badge>
                      </CardTitle>
                      <CardDescription className="font-medium text-foreground/70">
                        {agent.provider} - {agent.model}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10"
                        onClick={() => setEditAgent(agent)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="border-primary/30 bg-primary/5">
                      Tokens: {agent.max_tokens}
                    </Badge>
                    <Badge variant="outline" className="border-accent/30 bg-accent/5">
                      Temp: {agent.temperature}
                    </Badge>
                  </div>
                  {agent.user_prompt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.user_prompt}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agent and all associated API keys. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onOpenChange={() => setEditAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Update your agent configuration</DialogDescription>
          </DialogHeader>
          
          {editAgent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input
                  id="edit-name"
                  value={editAgent.name}
                  onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-prompt">System Prompt</Label>
                <Textarea
                  id="edit-prompt"
                  value={editAgent.user_prompt || ''}
                  onChange={(e) => setEditAgent({ ...editAgent, user_prompt: e.target.value })}
                  className="min-h-[120px]"
                  placeholder="You are a helpful AI assistant..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={editAgent.mode === 'speed' ? 'default' : 'outline'}
                    onClick={() => setEditAgent({ ...editAgent, mode: 'speed' })}
                    className="h-auto p-4"
                  >
                    <div className="text-left">
                      <div className="font-semibold">⚡ Speed Mode</div>
                      <div className="text-xs opacity-80">Ultra-fast processing</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={editAgent.mode === 'deep' ? 'default' : 'outline'}
                    onClick={() => setEditAgent({ ...editAgent, mode: 'deep' })}
                    className="h-auto p-4"
                  >
                    <div className="text-left">
                      <div className="font-semibold">🔍 Deep Mode</div>
                      <div className="text-xs opacity-80">Advanced optimization</div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={editAgent.provider}
                    onValueChange={(value) => {
                      // Update provider and set first model as default
                      const defaultModel = modelOptions[value]?.[0]?.value || editAgent.model;
                      setEditAgent({ ...editAgent, provider: value, model: defaultModel });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="mistral">Mistral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Model</Label>
                  <Select
                    value={editAgent.model}
                    onValueChange={(value) => setEditAgent({ ...editAgent, model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions[editAgent.provider]?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for testing in deep mode
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Type</Label>
                <Select
                  value={editAgent.output_type}
                  onValueChange={(value) => setEditAgent({ ...editAgent, output_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Number of Variants</Label>
                  <span className="text-sm text-muted-foreground">{editAgent.variants}</span>
                </div>
               <Slider
                  value={[editAgent.variants]}
                  onValueChange={([value]) => setEditAgent({ ...editAgent, variants: value })}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{editAgent.max_tokens}</span>
                </div>
                <Slider
                  value={[editAgent.max_tokens]}
                  onValueChange={([value]) => setEditAgent({ ...editAgent, max_tokens: value })}
                  min={100}
                  max={32000}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{editAgent.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[editAgent.temperature]}
                  onValueChange={([value]) => setEditAgent({ ...editAgent, temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditAgent(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
