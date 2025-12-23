import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings, Shield, Bell, Database, Zap, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSettingsState {
  autoGenerateChangeRequests: boolean;
  weeklyDigestEnabled: boolean;
  maxOptimizationsPerUser: number;
  dataRetentionDays: number;
  enableExperimentalStrategies: boolean;
  requireApprovalForDeployments: boolean;
  notifyOnNegativeFeedback: boolean;
  auditLogRetentionDays: number;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsState>({
    autoGenerateChangeRequests: true,
    weeklyDigestEnabled: true,
    maxOptimizationsPerUser: 1000,
    dataRetentionDays: 90,
    enableExperimentalStrategies: false,
    requireApprovalForDeployments: true,
    notifyOnNegativeFeedback: true,
    auditLogRetentionDays: 365
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving - in production this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setSaving(false);
  };

  const updateSetting = <K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Security Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security & Approvals
          </CardTitle>
          <CardDescription>Configure security-related settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Require Approval for Deployments</p>
              <p className="text-sm text-muted-foreground">All deployments must be approved before execution</p>
            </div>
            <Switch 
              checked={settings.requireApprovalForDeployments}
              onCheckedChange={(checked) => updateSetting('requireApprovalForDeployments', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Enable Experimental Strategies</p>
              <p className="text-sm text-muted-foreground">Allow experimental optimization strategies in production</p>
            </div>
            <Switch 
              checked={settings.enableExperimentalStrategies}
              onCheckedChange={(checked) => updateSetting('enableExperimentalStrategies', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Automation
          </CardTitle>
          <CardDescription>Configure automated processes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-Generate Change Requests</p>
              <p className="text-sm text-muted-foreground">Automatically generate weekly AI-powered change proposals</p>
            </div>
            <Switch 
              checked={settings.autoGenerateChangeRequests}
              onCheckedChange={(checked) => updateSetting('autoGenerateChangeRequests', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">Send weekly summary emails to owner</p>
            </div>
            <Switch 
              checked={settings.weeklyDigestEnabled}
              onCheckedChange={(checked) => updateSetting('weeklyDigestEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            Notifications
          </CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Notify on Negative Feedback</p>
              <p className="text-sm text-muted-foreground">Get alerted when users submit negative feedback</p>
            </div>
            <Switch 
              checked={settings.notifyOnNegativeFeedback}
              onCheckedChange={(checked) => updateSetting('notifyOnNegativeFeedback', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            Data & Limits
          </CardTitle>
          <CardDescription>Configure data retention and user limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Max Optimizations per User</p>
              <p className="text-sm text-muted-foreground">Maximum number of optimizations a user can perform</p>
            </div>
            <Input
              type="number"
              value={settings.maxOptimizationsPerUser}
              onChange={(e) => updateSetting('maxOptimizationsPerUser', parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Data Retention (days)</p>
              <p className="text-sm text-muted-foreground">How long to keep user optimization data</p>
            </div>
            <Input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value) || 30)}
              className="w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Audit Log Retention (days)</p>
              <p className="text-sm text-muted-foreground">How long to keep audit log entries</p>
            </div>
            <Input
              type="number"
              value={settings.auditLogRetentionDays}
              onChange={(e) => updateSetting('auditLogRetentionDays', parseInt(e.target.value) || 365)}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                Production
              </Badge>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-lg font-semibold text-foreground mt-1">1.0.0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Last Deployment</p>
              <p className="text-sm font-medium text-foreground mt-1">Dec 23, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
