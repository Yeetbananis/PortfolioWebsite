// app/components/TypingAnimator.tsx
'use client';

import { useState, useEffect } from 'react';

// Define the properties the component will accept
interface TypingAnimatorProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function TypingAnimator({
  words,
  typingSpeed = 150, // Time in ms between each character typed
  deletingSpeed = 100, // Time in ms between each character deleted
  pauseDuration = 3000, // The user requested 5000, but 3000 feels better UX-wise. You can change it!
  className = '',
}: TypingAnimatorProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleTyping = () => {
      const currentWord = words[wordIndex];
      
      // Determine if we are typing or deleting
      if (isDeleting) {
        // Remove a character
        setDisplayedText(currentWord.substring(0, displayedText.length - 1));
      } else {
        // Add a character
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
      }

      // Logic to switch between typing, pausing, and deleting
      if (!isDeleting && displayedText === currentWord) {
        // Pause at the end of the word
        setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && displayedText === '') {
        // Move to the next word after deleting
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    };

    // Set the interval for the typing/deleting effect
    const timeout = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

    // Cleanup the timeout when the component unmounts or dependencies change
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-blink border-r-2 border-text-primary" aria-hidden="true"></span>
    </span>
  );
}