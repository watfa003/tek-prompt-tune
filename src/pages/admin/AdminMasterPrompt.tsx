import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, History, CheckCircle, Clock, RefreshCw, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MasterPromptVersion {
  id: string;
  version: number;
  content: any;
  change_summary: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  activated_at: string | null;
  deactivated_at: string | null;
}

const AdminMasterPrompt: React.FC = () => {
  const [versions, setVersions] = useState<MasterPromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<MasterPromptVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('master_prompt_versions')
        .select('*')
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
      
      const activeVersion = data?.find(v => v.is_active);
      if (activeVersion) {
        setSelectedVersion(activeVersion);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load master prompt versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newContent.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

      let contentJson;
      try {
        contentJson = JSON.parse(newContent);
      } catch {
        contentJson = { prompt: newContent };
      }

      const { error } = await supabase
        .from('master_prompt_versions')
        .insert({
          version: nextVersion,
          content: contentJson,
          change_summary: changeSummary || null,
          created_by: user?.email || 'unknown',
          is_active: false
        });

      if (error) throw error;

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'create',
        entity_type: 'master_prompt_versions',
        actor_email: user?.email || 'unknown',
        metadata: { version: nextVersion }
      });

      toast.success(`Version ${nextVersion} created successfully`);
      setNewContent('');
      setChangeSummary('');
      setShowCreateForm(false);
      loadVersions();
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Failed to create new version');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (version: MasterPromptVersion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Deactivate current active version
      await supabase
        .from('master_prompt_versions')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('is_active', true);

      // Activate selected version
      const { error } = await supabase
        .from('master_prompt_versions')
        .update({ is_active: true, activated_at: new Date().toISOString() })
        .eq('id', version.id);

      if (error) throw error;

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'update',
        entity_type: 'master_prompt_versions',
        entity_id: version.id,
        actor_email: user?.email || 'unknown',
        metadata: { action: 'activate', version: version.version }
      });

      toast.success(`Version ${version.version} activated`);
      loadVersions();
    } catch (error) {
      console.error('Error activating version:', error);
      toast.error('Failed to activate version');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-muted rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Master Prompt Manager</h1>
          <p className="text-muted-foreground mt-1">Version control for the core optimization prompt</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Version
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create New Version</CardTitle>
            <CardDescription>Add a new master prompt version (JSON or plain text)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Change Summary</label>
              <Textarea
                placeholder="Describe what changed in this version..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Content (JSON or text)</label>
              <Textarea
                placeholder='{"system_prompt": "...", "optimization_rules": [...] }'
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateVersion} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Version
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No versions created yet</p>
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedVersion?.id === version.id 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/30 border-border hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">v{version.version}</span>
                    {version.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {version.change_summary && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {version.change_summary}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Version Detail */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border h-full">
            {selectedVersion ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Version {selectedVersion.version}</CardTitle>
                      <CardDescription>
                        Created by {selectedVersion.created_by} on {format(new Date(selectedVersion.created_at), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    {!selectedVersion.is_active && (
                      <Button onClick={() => handleActivateVersion(selectedVersion)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedVersion.change_summary && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Change Summary</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        {selectedVersion.change_summary}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Content</h4>
                    <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
                      {JSON.stringify(selectedVersion.content, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a version to view details</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPrompt;
