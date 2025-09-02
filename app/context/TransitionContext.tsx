// app/context/TransitionContext.tsx
'use client';

import { createContext, useState, ReactNode } from 'react';

export const TransitionContext = createContext<{
  isTransitioning: boolean;
  setIsTransitioning: (isTransitioning: boolean) => void;
}>({
  isTransitioning: false,
  setIsTransitioning: () => {},
});

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <TransitionContext.Provider value={{ isTransitioning, setIsTransitioning }}>
      {children}
    </TransitionContext.Provider>
  );
};