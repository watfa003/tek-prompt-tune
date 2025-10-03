import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  provider: string;
  model: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}

export function AgentLogs() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agents')
        .select('id, name, provider, model')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAgents(data);
        setSelectedAgent(data[0].id);
        // Load logs for the first agent
        loadLogsForAgent(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading agents',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForAgent = async (agentId: string) => {
    setLoadingLogs(prev => ({ ...prev, [agentId]: true }));
    
    try {
      // Fetch logs from the agent-invoke edge function
      // For now, we'll show a placeholder since we need actual log data
      const mockLogs: LogEntry[] = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Agent ${agentId} invoked successfully`,
          metadata: { agentId }
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          message: 'Processing request...',
          metadata: { agentId }
        }
      ];
      
      setLogs(prev => ({ ...prev, [agentId]: mockLogs }));
    } catch (error: any) {
      toast({
        title: 'Error loading logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const handleRefreshLogs = (agentId: string) => {
    loadLogsForAgent(agentId);
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Agents Found</CardTitle>
          <CardDescription>
            Create an agent first to view its logs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Logs</CardTitle>
        <CardDescription>
          View execution logs for each of your agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {agents.map((agent) => (
              <TabsTrigger key={agent.id} value={agent.id}>
                {agent.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {agents.map((agent) => (
            <TabsContent key={agent.id} value={agent.id} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {agent.provider} - {agent.model}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshLogs(agent.id)}
                    disabled={loadingLogs[agent.id]}
                  >
                    {loadingLogs[agent.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </div>

                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  {loadingLogs[agent.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : logs[agent.id] && logs[agent.id].length > 0 ? (
                    <div className="space-y-3">
                      {logs[agent.id].map((log, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border bg-card p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getLevelBadgeVariant(log.level)}>
                                  {log.level.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="font-mono text-xs">{log.message}</p>
                              {log.metadata && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                    Show metadata
                                  </summary>
                                  <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      No logs available for this agent
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
