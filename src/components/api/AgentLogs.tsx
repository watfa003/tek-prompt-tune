import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  agentId: string;
  agentName: string;
}

export function AgentLogs() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (agents.length > 0) {
      loadLogs();
    }
  }, [selectedAgent, agents]);

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

  const loadLogs = async () => {
    setLoadingLogs(true);
    
    try {
      const allLogs: LogEntry[] = [];
      
      // Get logs for selected agent(s)
      const agentsToFetch = selectedAgent === 'all' ? agents : agents.filter(a => a.id === selectedAgent);
      
      for (const agent of agentsToFetch) {
        // Mock logs with more variety and color-coded types
        const mockAgentLogs: LogEntry[] = [
          {
            timestamp: new Date(Date.now() - 5000).toISOString(),
            level: 'success',
            message: `Agent invoked successfully - Response generated in 1.2s`,
            agentId: agent.id,
            agentName: agent.name,
            metadata: { 
              tokens: 250, 
              model: agent.model,
              responseTime: '1.2s'
            }
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'info',
            message: `Processing request with ${agent.model}`,
            agentId: agent.id,
            agentName: agent.name,
            metadata: { provider: agent.provider }
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'warning',
            message: 'Rate limit approaching - 80% of quota used',
            agentId: agent.id,
            agentName: agent.name,
            metadata: { quotaUsed: '80%', remaining: 200 }
          },
          {
            timestamp: new Date(Date.now() - 180000).toISOString(),
            level: 'success',
            message: `Generated response with ${agent.provider}`,
            agentId: agent.id,
            agentName: agent.name,
            metadata: { 
              tokens: 180,
              responseTime: '0.8s'
            }
          },
          {
            timestamp: new Date(Date.now() - 240000).toISOString(),
            level: 'error',
            message: 'API timeout - Request took longer than 30s',
            agentId: agent.id,
            agentName: agent.name,
            metadata: { 
              error: 'TIMEOUT',
              duration: '30s'
            }
          }
        ];
        
        allLogs.push(...mockAgentLogs);
      }
      
      // Sort by timestamp descending
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(allLogs);
    } catch (error: any) {
      toast({
        title: 'Error loading logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefreshLogs = () => {
    loadLogs();
  };

  const getLevelStyle = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return {
          badge: 'bg-red-500/10 text-red-500 border-red-500/20',
          border: 'border-l-red-500',
          bg: 'bg-red-500/5'
        };
      case 'warning':
        return {
          badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          border: 'border-l-yellow-500',
          bg: 'bg-yellow-500/5'
        };
      case 'success':
        return {
          badge: 'bg-green-500/10 text-green-500 border-green-500/20',
          border: 'border-l-green-500',
          bg: 'bg-green-500/5'
        };
      case 'info':
      default:
        return {
          badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          border: 'border-l-blue-500',
          bg: 'bg-blue-500/5'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="space-y-4">
      {/* Agent Selector */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Agent Logs</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLogs}
              disabled={loadingLogs}
              className="gap-2"
            >
              {loadingLogs ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <CardDescription>
            View real-time execution logs for your AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Agent</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all" className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    All Agents
                  </div>
                </SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {agent.name}
                      <span className="text-xs text-muted-foreground">
                        ({agent.provider})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardContent className="p-6">
          <ScrollArea className="h-[600px] w-full pr-4">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log, idx) => {
                  const style = getLevelStyle(log.level);
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border-l-4 ${style.border} ${style.bg} border border-border/50 p-4 transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={style.badge}>
                              {log.level.toUpperCase()}
                            </Badge>
                            {selectedAgent === 'all' && (
                              <Badge variant="outline" className="border-primary/30 text-primary">
                                {log.agentName}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{log.message}</p>
                          {log.metadata && (
                            <details className="group">
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <span className="group-open:hidden">Show details ▼</span>
                                <span className="hidden group-open:inline">Hide details ▲</span>
                              </summary>
                              <pre className="mt-2 overflow-x-auto rounded-md bg-muted/50 p-3 text-xs border border-border/30">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No logs available
                  {selectedAgent !== 'all' && ' for this agent'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
