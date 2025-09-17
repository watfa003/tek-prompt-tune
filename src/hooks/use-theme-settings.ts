import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { UserSettings } from './use-settings';

export const useThemeSettings = (settings: UserSettings, setSettings: (settings: UserSettings) => void) => {
  const { theme: nextTheme, setTheme } = useTheme();

  // Apply theme changes
  useEffect(() => {
    if (settings.theme !== nextTheme) {
      setTheme(settings.theme);
    }
  }, [settings.theme, nextTheme, setTheme]);

  // Apply compact mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [settings.compactMode]);

  // Update settings when theme changes externally
  useEffect(() => {
    if (nextTheme && nextTheme !== settings.theme) {
      setSettings({ ...settings, theme: nextTheme });
    }
  }, [nextTheme]);

  return { theme: nextTheme, setTheme };
};