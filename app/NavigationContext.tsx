'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
  targetNode: string | null;
  setTargetNode: (node: string | null) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  setNavigating: () => {},
  targetNode: null,
  setTargetNode: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [isNavigating, setNavigating] = useState(false);
  const [targetNode, setTargetNode] = useState<string | null>(null);

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating, targetNode, setTargetNode }}>
      {children}
    </NavigationContext.Provider>
  );
};