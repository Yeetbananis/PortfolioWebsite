'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- SHARED THEMES CONFIGURATION ---
export const THEMES = [
  { 
    name: 'Simple White', 
    primary: '#ffffff',
    galaxyColors: { core: '#ffffff', edge: '#aaaaaa' },
    hueBase: 0.0, hueRange: 0.0
  },
  { 
    name: 'Deep Ocean', 
    primary: '#00f0ff', 
    galaxyColors: { core: '#e0ffff', edge: '#001eff' }, 
    hueBase: 0.33, hueRange: 0.4 
  }, 
  { 
    name: 'Inferno', 
    primary: '#ff4d00', 
    galaxyColors: { core: '#ffdd00', edge: '#8a0000' },
    hueBase: 0.0, hueRange: 0.17 
  }, 
  { 
    name: 'Neon Cyberpunk', 
    primary: '#d000ff', 
    galaxyColors: { core: '#ff00ea', edge: '#4800ff' },
    hueBase: 0.72, hueRange: 0.23 
  },
  { 
    name: 'Biohazard', 
    primary: '#39ff14', 
    galaxyColors: { core: '#ccff00', edge: '#005500' },
    hueBase: 0.28, hueRange: 0.12 
  }
];

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
  // --- THEME STATE ---
  currentTheme: typeof THEMES[0];
  toggleTheme: () => void;
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
  // Default Stub
  currentTheme: THEMES[0],
  toggleTheme: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [isNavigating, setNavigating] = useState(false);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [isChaosMode, setChaosMode] = useState(false);
  const [isTesseractMode, setTesseractMode] = useState(false);
  const [isPendulumMode, setPendulumMode] = useState(false);
  const [isGalaxyMode, setGalaxyMode] = useState(false);
  
  // Theme Logic
  const [themeIndex, setThemeIndex] = useState(0); // Defaults to White
  const currentTheme = THEMES[themeIndex];
  const toggleTheme = () => setThemeIndex((prev) => (prev + 1) % THEMES.length);

  return (
    <NavigationContext.Provider value={{ 
        isNavigating, setNavigating, 
        targetNode, setTargetNode, 
        isChaosMode, setChaosMode, 
        isTesseractMode, setTesseractMode, 
        isPendulumMode, setPendulumMode,
        isGalaxyMode, setGalaxyMode,
        currentTheme, toggleTheme
    }}>
      {children}
    </NavigationContext.Provider>
  );
};