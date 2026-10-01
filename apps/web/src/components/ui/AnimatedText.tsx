import React from 'react';
import { motion, Variants } from 'framer-motion';

export interface AnimatedTextProps {
  text: string;
  className?: string;
  gradient?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  gradient = false,
}) => {
  const words = text.split(' ');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.04 * i },
    }),
  };

  const childVariants: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: 45,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap gap-x-2 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex whitespace-nowrap">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              variants={childVariants}
              whileHover={{
                y: -6,
                scale: 1.15,
                color: '#00f0ff',
                transition: { duration: 0.15 },
              }}
              className={`inline-block cursor-default select-none ${
                gradient
                  ? 'bg-gradient-to-r from-[#00f0ff] via-[#00ffcc] to-[#ff2bd6] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : ''
              }`}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};
