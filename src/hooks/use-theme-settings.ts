import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { UserSettings } from './use-settings';

// Only applies compact mode; does NOT auto-change theme.
export const useThemeSettings = (settings: UserSettings, _setSettings: (settings: UserSettings) => void) => {
  const { theme: nextTheme, setTheme } = useTheme();

  // Apply compact mode only
  useEffect(() => {
    const root = document.documentElement;
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [settings.compactMode]);

  // Expose theme but don't change it automatically
  return { theme: nextTheme, setTheme };
};