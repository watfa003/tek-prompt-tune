import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { UserSettings } from './use-settings';

export const useThemeSettings = (settings: UserSettings, setSettings: (settings: UserSettings) => void) => {
  const { theme: nextTheme, setTheme } = useTheme();
  const isUpdatingTheme = useRef(false);

  // Apply theme changes only when settings change
  useEffect(() => {
    if (settings.theme !== nextTheme && !isUpdatingTheme.current) {
      isUpdatingTheme.current = true;
      setTheme(settings.theme);
      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingTheme.current = false;
      }, 100);
    }
  }, [settings.theme, setTheme]);

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