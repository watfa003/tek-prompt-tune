// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Trash2, Eye, EyeOff, Plus, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface APIKey {
  id: string;
  key: string;
  name: string | null;
  agent_id: string | null;
  key_type: 'agent' | 'user';
  created_at: string;
  agents?: {
    name: string;
  } | null;
}

export function APIKeysList() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [createUserKeyDialog, setCreateUserKeyDialog] = useState(false);
  const [userKeyName, setUserKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, agents(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error: any) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('API key deleted successfully');
      setKeys(keys.filter(k => k.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Failed to delete API key');
    }
  };

  const handleCreateUserKey = async () => {
    if (!userKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setCreatingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate API key
      const apiKey = `pk_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key: apiKey,
          name: userKeyName.trim(),
          key_type: 'user',
          agent_id: null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('User API key created successfully!');
      setKeys([data, ...keys]);
      setCreateUserKeyDialog(false);
      setUserKeyName('');
      
      // Auto-show the new key
      setVisibleKeys(new Set([data.id]));
    } catch (error: any) {
      toast.error('Failed to create API key');
      console.error('Error creating user API key:', error);
    } finally {
      setCreatingKey(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  const agentKeys = keys.filter(k => k.key_type === 'agent');
  const userKeys = keys.filter(k => k.key_type === 'user');

  if (loading) {
    return <div className="text-muted-foreground">Loading API keys...</div>;
  }

  return (
    <>
      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Agent Keys ({agentKeys.length})
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Keys ({userKeys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-4 mt-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">Agent API Keys</CardTitle>
              <CardDescription className="text-xs">
                These keys are tied to specific agents and can only invoke that agent via <code className="bg-muted px-1 rounded">POST /agent-invoke</code>
              </CardDescription>
            </CardHeader>
          </Card>

          {agentKeys.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No agent API keys yet. Create an agent to generate an API key.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {agentKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">
                            {apiKey.name || 'API Key'}
                          </CardTitle>
                          <Badge>Agent</Badge>
                        </div>
                        <CardDescription className="font-medium">
                          Agent: {apiKey.agents?.name || 'Unknown'}
                        </CardDescription>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                            <span className="text-xs font-semibold text-foreground/60">Agent ID:</span>
                            <code className="text-xs bg-background px-2 py-1 rounded font-mono flex-1">
                              {apiKey.agent_id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 hover:bg-accent"
                              onClick={() => copyToClipboard(apiKey.agent_id!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10"
                          onClick={() => toggleVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-accent/10"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-xs font-semibold text-foreground/60 block mb-1">API Key:</span>
                      <code className="block bg-background p-2 rounded text-sm font-mono break-all">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="user" className="space-y-4 mt-4">
          <Card className="border-secondary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">User API Keys</CardTitle>
                  <CardDescription className="text-xs">
                    General-purpose keys for history, favorites, lab testing, and direct optimizer access
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateUserKeyDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create User Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>✅ <code className="bg-muted px-1 rounded">GET /api-history</code> - Fetch optimization history</p>
                <p>✅ <code className="bg-muted px-1 rounded">GET /api-favorites</code> - Get favorited items</p>
                <p>✅ <code className="bg-muted px-1 rounded">POST /api-lab-test</code> - Test prompts</p>
                <p>✅ <code className="bg-muted px-1 rounded">POST /api-lab-battle</code> - Compare prompts</p>
              </div>
            </CardContent>
          </Card>

          {userKeys.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">No user API keys yet.</p>
                <Button onClick={() => setCreateUserKeyDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First User Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border-l-4 border-l-secondary/50 hover:border-l-secondary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">
                            {apiKey.name || 'User API Key'}
                          </CardTitle>
                          <Badge variant="secondary">User</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Can access history, favorites, and lab endpoints
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10"
                          onClick={() => toggleVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-accent/10"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-xs font-semibold text-foreground/60 block mb-1">API Key:</span>
                      <code className="block bg-background p-2 rounded text-sm font-mono break-all">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create User Key Dialog */}
      <Dialog open={createUserKeyDialog} onOpenChange={setCreateUserKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User API Key</DialogTitle>
            <DialogDescription>
              This key will have access to history, favorites, and lab testing endpoints.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Key, Testing Key"
                value={userKeyName}
                onChange={(e) => setUserKeyName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name to help you identify this key
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUserKey} disabled={creatingKey}>
              {creatingKey ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this API key. Any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
