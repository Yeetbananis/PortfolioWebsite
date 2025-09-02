// app/components/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useContext } from 'react';
import { TransitionContext } from '@/app/context/TransitionContext';

const PageTransition = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { setIsTransitioning } = useContext(TransitionContext);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setIsTransitioning(false)}
    >
      <motion.div
        key={pathname}
        onAnimationStart={() => setIsTransitioning(true)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;