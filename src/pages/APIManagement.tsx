import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentForm } from '@/components/api/AgentForm';
import { AgentsList } from '@/components/api/AgentsList';
import { APIKeysList } from '@/components/api/APIKeysList';
import { APIDocs } from '@/components/api/APIDocs';

export default function APIManagement() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAgentCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Management</h1>
        <p className="text-muted-foreground">Create and manage your AI agents and API keys</p>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="create">Create Agent</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6" key={refreshKey}>
          <AgentsList />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <AgentForm onSuccess={handleAgentCreated} />
        </TabsContent>

        <TabsContent value="keys" className="mt-6" key={`keys-${refreshKey}`}>
          <APIKeysList />
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <APIDocs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
