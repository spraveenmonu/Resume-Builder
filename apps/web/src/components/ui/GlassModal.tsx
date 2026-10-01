import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hudLabel?: string;
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  hudLabel,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('scroll-locked');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('scroll-locked');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-7xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={twMerge(
          clsx(
            'relative w-full glass-strong border border-[#00f0ff]/30 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col',
            maxWidthStyles[maxWidth],
            className
          )
        )}
      >
        {/* HUD top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div>
            {hudLabel && (
              <span className="text-[10px] font-mono tracking-widest text-[#00f0ff] uppercase block mb-0.5">
                // {hudLabel}
              </span>
            )}
            {title && (
              <h2 className="text-xl font-bold font-orbitron text-white tracking-wide flex items-center gap-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body with internal scroll */}
        <div className="p-6 overflow-y-auto max-h-[calc(90dvh-5rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};
