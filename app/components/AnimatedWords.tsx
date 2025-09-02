// app/components/AnimatedWords.tsx
'use client';

import { motion } from 'framer-motion';

type AnimatedWordsProps = {
  text: string;
  className?: string;
  delay?: number;
};

const AnimatedWords = ({ text, className, delay = 0 }: AnimatedWordsProps) => {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
      },
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
      },
    },
    exit: {
      opacity: 0,
      y: 40,
      transition: {
        ease: 'easeIn',
        duration: 0.3
      },
    }
  };

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default AnimatedWords;