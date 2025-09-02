// app/components/AnimatedBlock.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type AnimatedBlockProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

const AnimatedBlock = ({ children, className, delay = 0 }: AnimatedBlockProps) => {
  const variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
        delay,
      },
    },
    exit: {
      opacity: 0,
      y: 40,
      transition: {
        ease: 'easeIn',
        duration: 0.3,
        delay,
      },
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedBlock;