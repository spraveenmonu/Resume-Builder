import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlitchTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  glowColor?: 'cyan' | 'pink' | 'purple' | 'none';
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  glowColor = 'cyan',
  as: Component = 'span',
  className,
  ...props
}) => {
  const [isGlitching, setIsGlitching] = useState(false);

  const glowStyles = {
    cyan: 'hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]',
    pink: 'hover:drop-shadow-[0_0_12px_rgba(255,43,214,0.8)]',
    purple: 'hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]',
    none: '',
  };

  return (
    <Component
      onMouseEnter={() => setIsGlitching(true)}
      onMouseLeave={() => setIsGlitching(false)}
      className={twMerge(
        clsx(
          'relative inline-block select-none cursor-default transition-all duration-150',
          glowStyles[glowColor],
          className
        )
      )}
      {...props}
    >
      <span className="relative z-10">{text}</span>

      {isGlitching && (
        <>
          <span 
            className="absolute top-0 left-[2px] text-[#ff2bd6] opacity-75 z-0 pointer-events-none select-none [clip-path:polygon(0_0,100%_0,100%_45%,0_45%)]"
            aria-hidden="true"
          >
            {text}
          </span>
          <span 
            className="absolute top-0 -left-[2px] text-[#00f0ff] opacity-75 z-0 pointer-events-none select-none [clip-path:polygon(0_55%,100%_55%,100%_100%,0_100%)]"
            aria-hidden="true"
          >
            {text}
          </span>
        </>
      )}
    </Component>
  );
};
