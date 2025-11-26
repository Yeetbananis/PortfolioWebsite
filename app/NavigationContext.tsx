'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
  targetNode: string | null;
  setTargetNode: (node: string | null) => void;
  isChaosMode: boolean;
  setChaosMode: (v: boolean) => void;
}



export const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  setNavigating: () => {},
  targetNode: null,
  setTargetNode: () => {},
  isChaosMode: false,
  setChaosMode: () => {},
  
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [isNavigating, setNavigating] = useState(false);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [isChaosMode, setChaosMode] = useState(false);

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating, targetNode, setTargetNode, isChaosMode, setChaosMode }}>
      {children}
    </NavigationContext.Provider>
  );
};