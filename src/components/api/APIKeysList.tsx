import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
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

interface APIKey {
  id: string;
  key: string;
  name: string | null;
  agent_id: string;
  created_at: string;
  agents: {
    name: string;
  } | null;
}

export function APIKeysList() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

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

  if (loading) {
    return <div className="text-muted-foreground">Loading API keys...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {keys.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No API keys yet. Create an agent to generate an API key.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {keys.map((apiKey) => (
              <Card key={apiKey.id} className="border-l-4 border-l-accent/50 hover:border-l-accent transition-colors bg-gradient-to-r from-accent/5 to-transparent">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {apiKey.name || 'API Key'}
                      </CardTitle>
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
                            onClick={() => copyToClipboard(apiKey.agent_id)}
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
                    <code className="block bg-background p-2 rounded text-sm font-mono">
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
      </div>

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
