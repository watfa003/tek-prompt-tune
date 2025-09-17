import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { UserSettings } from './use-settings';

export const useThemeSettings = (settings: UserSettings, setSettings: (settings: UserSettings) => void) => {
  const { theme: nextTheme, setTheme } = useTheme();

  // Apply theme changes
  useEffect(() => {
    if (settings.theme !== nextTheme) {
      // Map our theme names to next-themes
      const themeMap: Record<string, string> = {
        light: 'light',
        dark: 'dark', 
        system: 'system'
      };
      setTheme(themeMap[settings.theme] || 'system');
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

  return { theme: nextTheme, setTheme };
};