import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  terminalLabel?: string;
  error?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, terminalLabel, error, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {(label || terminalLabel) && (
          <div className="flex items-center justify-between">
            {terminalLabel && (
              <label className="text-xs font-mono font-medium text-[#00f0ff] tracking-wider uppercase">
                &gt; {terminalLabel}
              </label>
            )}
            {label && !terminalLabel && (
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                {label}
              </label>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-[#0a0b1e]/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] focus:shadow-[0_0_15px_rgba(0,240,255,0.25)]',
              'transition-all duration-200 resize-y min-h-[90px]',
              error && 'border-rose-500 focus:border-rose-500',
              className
            )
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-rose-400 font-mono mt-1 flex items-center gap-1">
            <span>[!]</span> {error}
          </p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';
