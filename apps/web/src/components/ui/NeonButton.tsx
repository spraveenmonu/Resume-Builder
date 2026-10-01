import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  chamfer?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  chamfer = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md font-rajdhani',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-lg font-rajdhani',
    lg: 'text-base px-7 py-3.5 gap-2.5 rounded-xl font-rajdhani tracking-widest',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#00f0ff] via-[#00c8ff] to-[#ff2bd6] text-black shadow-neon-cyan hover:shadow-neon-pink hover:-translate-y-0.5 border border-white/20',
    secondary: 'glass text-[#00f0ff] border border-[#00f0ff]/40 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:shadow-neon-cyan hover:-translate-y-0.5',
    pink: 'glass text-[#ff2bd6] border border-[#ff2bd6]/40 hover:border-[#ff2bd6] hover:bg-[#ff2bd6]/10 hover:shadow-neon-pink hover:-translate-y-0.5',
    danger: 'glass text-rose-400 border border-rose-500/40 hover:border-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    ghost: 'text-slate-300 hover:text-[#00f0ff] hover:bg-white/5 border border-transparent',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          chamfer && (size === 'lg' ? 'chamfer-lg rounded-none' : 'chamfer rounded-none'),
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
