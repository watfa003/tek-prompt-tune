import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppMode = 'optimizer' | 'api';
type ApiSection = 'agents' | 'create' | 'keys' | 'docs' | 'logs';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  apiSection: ApiSection;
  setApiSection: (section: ApiSection) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('optimizer');
  const [apiSection, setApiSection] = useState<ApiSection>('agents');

  return (
    <AppModeContext.Provider value={{ mode, setMode, apiSection, setApiSection }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return context;
}
