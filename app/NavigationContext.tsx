'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
  targetNode: string | null;
  setTargetNode: (node: string | null) => void;
  isChaosMode: boolean;
  setChaosMode: (v: boolean) => void;
  isTesseractMode: boolean;
  setTesseractMode: (v: boolean) => void;
  isPendulumMode: boolean;
  setPendulumMode: (v: boolean) => void;
  isGalaxyMode: boolean;
  setGalaxyMode: (v: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  setNavigating: () => {},
  targetNode: null,
  setTargetNode: () => {},
  isChaosMode: false,
  setChaosMode: () => {},
  isTesseractMode: false,
  setTesseractMode: () => {},
  isPendulumMode: false,
  setPendulumMode: () => {},
  isGalaxyMode: false,
  setGalaxyMode: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [isNavigating, setNavigating] = useState(false);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [isChaosMode, setChaosMode] = useState(false);
  const [isTesseractMode, setTesseractMode] = useState(false);
  const [isPendulumMode, setPendulumMode] = useState(false);
  const [isGalaxyMode, setGalaxyMode] = useState(false);

  return (
    <NavigationContext.Provider value={{ 
        isNavigating, setNavigating, 
        targetNode, setTargetNode, 
        isChaosMode, setChaosMode, 
        isTesseractMode, setTesseractMode, 
        isPendulumMode, setPendulumMode,
        isGalaxyMode, setGalaxyMode
    }}>
      {children}
    </NavigationContext.Provider>
  );
};