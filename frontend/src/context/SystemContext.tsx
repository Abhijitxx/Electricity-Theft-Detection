'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SystemContextType {
  isSystemOnline: boolean;
  setSystemOnline: (status: boolean) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [isSystemOnline, setIsSystemOnline] = useState(false);

  return (
    <SystemContext.Provider value={{ isSystemOnline, setSystemOnline: setIsSystemOnline }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
