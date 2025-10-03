import { useState } from 'react';
import { AgentForm } from '@/components/api/AgentForm';
import { AgentsList } from '@/components/api/AgentsList';
import { APIKeysList } from '@/components/api/APIKeysList';
import { APIDocs } from '@/components/api/APIDocs';
import { AgentLogs } from '@/components/api/AgentLogs';
import { useAppMode } from '@/context/AppModeContext';

export default function APIManagement() {
  const { apiSection } = useAppMode();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAgentCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderSection = () => {
    switch (apiSection) {
      case 'agents':
        return <AgentsList key={refreshKey} />;
      case 'create':
        return <AgentForm onSuccess={handleAgentCreated} />;
      case 'keys':
        return <APIKeysList key={`keys-${refreshKey}`} />;
      case 'docs':
        return <APIDocs />;
      case 'logs':
        return <AgentLogs />;
      default:
        return <AgentsList key={refreshKey} />;
    }
  };

  const getSectionTitle = () => {
    switch (apiSection) {
      case 'agents':
        return { title: 'Your Agents', description: 'View and manage your AI agents' };
      case 'create':
        return { title: 'Create New Agent', description: 'Configure your AI agent with custom settings' };
      case 'keys':
        return { title: 'API Keys', description: 'Manage your API keys and access tokens' };
      case 'docs':
        return { title: 'API Documentation', description: 'Learn how to use the API endpoints' };
      case 'logs':
        return { title: 'Agent Logs', description: 'View execution logs for your agents' };
      default:
        return { title: 'API Management', description: 'Manage your AI agents and API keys' };
    }
  };

  const { title, description } = getSectionTitle();

  return (
    <div className="container mx-auto px-4">
      <div>
        {renderSection()}
      </div>
    </div>
  );
}
