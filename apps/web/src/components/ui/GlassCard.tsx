import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cyan' | 'pink' | 'purple' | 'interactive';
  chamfer?: boolean;
  hudCorners?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  chamfer = false,
  hudCorners = false,
  glow = false,
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'glass border-white/10 hover:border-white/20',
    cyan: 'glass border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]',
    pink: 'glass border-[#ff2bd6]/30 shadow-[0_0_20px_rgba(255,43,214,0.1)]',
    purple: 'glass border-[#8b5cf6]/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]',
    interactive: 'glass border-white/10 hover:border-[#00f0ff]/50 hover:shadow-neon-cyan hover:-translate-y-1 transition-all duration-300 cursor-pointer',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-xl p-6 transition-all duration-200',
          variantStyles[variant],
          chamfer && 'chamfer rounded-none',
          glow && 'shadow-neon-cyan',
          className
        )
      )}
      {...props}
    >
      {/* Optional Cyberpunk HUD Corner Brackets */}
      {hudCorners && (
        <>
          <span className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[#00f0ff]/70 pointer-events-none" />
          <span className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[#00f0ff]/70 pointer-events-none" />
          <span className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[#00f0ff]/70 pointer-events-none" />
          <span className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[#00f0ff]/70 pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
};
