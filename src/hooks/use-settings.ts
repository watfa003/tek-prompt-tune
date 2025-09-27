import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  // Profile
  name?: string;
  email?: string;
  
  // Preferences
  defaultProvider: string;
  defaultOutputType: string;
  defaultVariants: number;
  defaultTemperature: number;
  defaultMaxTokens: number;
  
  // Notifications
  emailNotifications: boolean;
  promptCompleted: boolean;
  weeklyDigest: boolean;
  newFeatures: boolean;
  
  // Privacy & Security
  dataRetentionDays: number;
  shareAnalytics: boolean;
  twoFactorAuth: boolean;
  
  // Appearance
  theme: string;
  compactMode: boolean;
  showScores: boolean;
  autoSave: boolean;
  
  // History
  showOnlyBestInHistory: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  // Profile
  name: '',
  email: '',
  
  // Preferences
  defaultProvider: 'OpenAI GPT-4',
  defaultOutputType: 'Code',
  defaultVariants: 3,
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
  
  // Notifications
  emailNotifications: true,
  promptCompleted: true,
  weeklyDigest: false,
  newFeatures: true,
  
  // Privacy & Security
  dataRetentionDays: 30,
  shareAnalytics: false,
  twoFactorAuth: false,
  
  // Appearance
  theme: 'system',
  compactMode: false,
  showScores: true,
  autoSave: true,
  
  // History
  showOnlyBestInHistory: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load settings from database
  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
        return;
      }

      // Create settings object with user's actual email and metadata
      const userDisplayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      const userEmail = user.email || '';

      if (data) {
        const loadedSettings: UserSettings = {
          name: data.name || userDisplayName,
          email: data.email || userEmail,
          defaultProvider: data.default_provider || DEFAULT_SETTINGS.defaultProvider,
          defaultOutputType: data.default_output_type || DEFAULT_SETTINGS.defaultOutputType,
          defaultVariants: data.default_variants || DEFAULT_SETTINGS.defaultVariants,
          defaultTemperature: data.default_temperature || DEFAULT_SETTINGS.defaultTemperature,
          defaultMaxTokens: data.default_max_tokens || DEFAULT_SETTINGS.defaultMaxTokens,
          emailNotifications: data.email_notifications ?? DEFAULT_SETTINGS.emailNotifications,
          promptCompleted: data.prompt_completed ?? DEFAULT_SETTINGS.promptCompleted,
          weeklyDigest: data.weekly_digest ?? DEFAULT_SETTINGS.weeklyDigest,
          newFeatures: data.new_features ?? DEFAULT_SETTINGS.newFeatures,
          dataRetentionDays: data.data_retention_days || DEFAULT_SETTINGS.dataRetentionDays,
          shareAnalytics: data.share_analytics ?? DEFAULT_SETTINGS.shareAnalytics,
          twoFactorAuth: data.two_factor_auth ?? DEFAULT_SETTINGS.twoFactorAuth,
          theme: data.theme || DEFAULT_SETTINGS.theme,
          compactMode: data.compact_mode ?? DEFAULT_SETTINGS.compactMode,
          showScores: data.show_scores ?? DEFAULT_SETTINGS.showScores,
          autoSave: data.auto_save ?? DEFAULT_SETTINGS.autoSave,
          showOnlyBestInHistory: data.show_only_best_in_history ?? DEFAULT_SETTINGS.showOnlyBestInHistory,
        };
        setSettings(loadedSettings);
      } else {
        // No settings exist yet, create with user's real info
        const newSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: userDisplayName,
          email: userEmail,
        };
        setSettings(newSettings);
        
        // Auto-save the initial settings with user info
        setTimeout(async () => {
          const settingsData = {
            user_id: user.id,
            name: userDisplayName,
            email: userEmail,
            default_provider: DEFAULT_SETTINGS.defaultProvider,
            default_output_type: DEFAULT_SETTINGS.defaultOutputType,
            default_variants: DEFAULT_SETTINGS.defaultVariants,
            default_temperature: DEFAULT_SETTINGS.defaultTemperature,
            default_max_tokens: DEFAULT_SETTINGS.defaultMaxTokens,
            email_notifications: DEFAULT_SETTINGS.emailNotifications,
            prompt_completed: DEFAULT_SETTINGS.promptCompleted,
            weekly_digest: DEFAULT_SETTINGS.weeklyDigest,
            new_features: DEFAULT_SETTINGS.newFeatures,
            data_retention_days: DEFAULT_SETTINGS.dataRetentionDays,
            share_analytics: DEFAULT_SETTINGS.shareAnalytics,
            two_factor_auth: DEFAULT_SETTINGS.twoFactorAuth,
            theme: DEFAULT_SETTINGS.theme,
            compact_mode: DEFAULT_SETTINGS.compactMode,
            show_scores: DEFAULT_SETTINGS.showScores,
            auto_save: DEFAULT_SETTINGS.autoSave,
            show_only_best_in_history: DEFAULT_SETTINGS.showOnlyBestInHistory,
          };

          await supabase.from('user_settings').upsert(settingsData, { onConflict: 'user_id' });
        }, 100);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings",
          variant: "destructive",
        });
        return;
      }

      const settingsData = {
        user_id: user.id,
        name: settings.name,
        email: settings.email,
        default_provider: settings.defaultProvider,
        default_output_type: settings.defaultOutputType,
        default_variants: settings.defaultVariants,
        default_temperature: settings.defaultTemperature,
        default_max_tokens: settings.defaultMaxTokens,
        email_notifications: settings.emailNotifications,
        prompt_completed: settings.promptCompleted,
        weekly_digest: settings.weeklyDigest,
        new_features: settings.newFeatures,
        data_retention_days: settings.dataRetentionDays,
        share_analytics: settings.shareAnalytics,
        two_factor_auth: settings.twoFactorAuth,
        theme: settings.theme,
        compact_mode: settings.compactMode,
        show_scores: settings.showScores,
        auto_save: settings.autoSave,
        show_only_best_in_history: settings.showOnlyBestInHistory,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: "Error",
          description: "Failed to save settings",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error in saveSettings:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings();
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults.",
    });
  };

  // Export settings
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'promptek-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Your settings have been downloaded as a JSON file.",
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    setSettings,
    loading,
    saveSettings,
    resetSettings,
    exportSettings,
  };
};