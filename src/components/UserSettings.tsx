import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Zap,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import { useTheme } from "next-themes";
import { ProfileSettings } from "@/components/ProfileSettings";
import { useDataCleanup } from "@/hooks/use-data-cleanup";

export const UserSettings = () => {
  const {
    settings,
    setSettings,
    loading,
    saveSettings,
    resetSettings,
    exportSettings,
  } = useSettings();

  const { cleanupOldData, previewCleanup, isLoading: isCleaningUp, isPreviewLoading } = useDataCleanup();

  // Apply theme and compact mode settings
  useThemeSettings(settings, setSettings);
  // Access current theme and setter for explicit apply on save
  const { theme: currentTheme, setTheme } = useTheme();
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={async () => {
              await saveSettings();
              if (settings.theme && settings.theme !== currentTheme) {
                setTheme(settings.theme as any);
              }
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Public Profile Settings */}
      <ProfileSettings />

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">Free Plan - Upgrade for unlimited access</p>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
        </div>
      </Card>

      {/* Default Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Default Preferences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default AI Provider</Label>
            <Select value={settings.defaultProvider} onValueChange={(value) => setSettings({ ...settings, defaultProvider: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OpenAI GPT-4">OpenAI GPT-4</SelectItem>
                <SelectItem value="OpenAI GPT-3.5">OpenAI GPT-3.5</SelectItem>
                <SelectItem value="Claude 3 Opus">Claude 3 Opus</SelectItem>
                <SelectItem value="Claude 3 Sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="Google Gemini Pro">Google Gemini Pro</SelectItem>
                <SelectItem value="Groq Llama 3">Groq Llama 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Default Output Type</Label>
            <Select value={settings.defaultOutputType} onValueChange={(value) => setSettings({ ...settings, defaultOutputType: value })}>
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
            <Label>Default Variants</Label>
            <Select value={settings.defaultVariants.toString()} onValueChange={(value) => setSettings({ ...settings, defaultVariants: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Variant</SelectItem>
                <SelectItem value="3">3 Variants</SelectItem>
                <SelectItem value="5">5 Variants</SelectItem>
                <SelectItem value="10">10 Variants</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Default Temperature: {settings.defaultTemperature}</Label>
            <Slider
              value={[settings.defaultTemperature]}
              onValueChange={([value]) => setSettings({ ...settings, defaultTemperature: value })}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1 (Focused)</span>
              <span>1.0 (Very Creative)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Max Tokens: {settings.defaultMaxTokens === null || settings.defaultMaxTokens === 0 ? 'No Limit' : settings.defaultMaxTokens}</Label>
            <Slider
              value={[settings.defaultMaxTokens || 0]}
              onValueChange={([value]) => setSettings({ ...settings, defaultMaxTokens: value === 0 ? null : value })}
              min={0}
              max={4000}
              step={256}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No Limit</span>
              <span>4000</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Prompt Completed</p>
              <p className="text-sm text-muted-foreground">Notify when prompt generation is complete</p>
            </div>
            <Switch
              checked={settings.promptCompleted}
              onCheckedChange={(checked) => setSettings({ ...settings, promptCompleted: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">Weekly summary of your prompt activity</p>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => setSettings({ ...settings, weeklyDigest: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Features</p>
              <p className="text-sm text-muted-foreground">Announcements about new features and updates</p>
            </div>
            <Switch
              checked={settings.newFeatures}
              onCheckedChange={(checked) => setSettings({ ...settings, newFeatures: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Privacy & Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Retention (days)</Label>
              <Select value={settings.dataRetentionDays.toString()} onValueChange={(value) => setSettings({ ...settings, dataRetentionDays: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="-1">Forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically delete data older than this period
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-md bg-muted/20">
            <div>
              <p className="font-medium">Clean Up Old Data</p>
              <p className="text-sm text-muted-foreground">
                Delete data older than {settings.dataRetentionDays === -1 ? 'forever (nothing will be deleted)' : `${settings.dataRetentionDays} days`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={previewCleanup}
                disabled={isPreviewLoading || isCleaningUp || settings.dataRetentionDays === -1}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isPreviewLoading ? 'Checking...' : 'Preview'}
              </Button>
              <Button 
                variant="outline" 
                onClick={cleanupOldData}
                disabled={isCleaningUp || isPreviewLoading || settings.dataRetentionDays === -1}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isCleaningUp ? 'Cleaning...' : 'Clean Up Now'}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Share Usage Analytics</p>
              <p className="text-sm text-muted-foreground">Help improve PrompTek by sharing anonymous usage data</p>
            </div>
            <Switch
              checked={settings.shareAnalytics}
              onCheckedChange={(checked) => setSettings({ ...settings, shareAnalytics: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => setSettings({ ...settings, compactMode: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Scores</p>
              <p className="text-sm text-muted-foreground">Display prompt scores in lists and cards</p>
            </div>
            <Switch
              checked={settings.showScores}
              onCheckedChange={(checked) => setSettings({ ...settings, showScores: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Save</p>
              <p className="text-sm text-muted-foreground">Automatically save prompts and results</p>
            </div>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Only Best Variant in History</p>
              <p className="text-sm text-muted-foreground">Display only the best variant instead of all variants in history</p>
            </div>
            <Switch
              checked={settings.showOnlyBestInHistory}
              onCheckedChange={(checked) => setSettings({ ...settings, showOnlyBestInHistory: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/20">
        <div className="flex items-center space-x-2 mb-4">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-md bg-destructive/5">
            <div>
              <p className="font-medium">Reset All Settings</p>
              <p className="text-sm text-muted-foreground">Reset all settings to their default values</p>
            </div>
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-md bg-destructive/5">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};