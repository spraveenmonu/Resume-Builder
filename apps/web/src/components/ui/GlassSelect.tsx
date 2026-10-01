import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  terminalLabel?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, terminalLabel, error, options, children, className, ...props }, ref) => {
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

        <select
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-[#0a0b1e]/90 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100',
              'focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] focus:shadow-[0_0_15px_rgba(0,240,255,0.25)]',
              'transition-all duration-200 cursor-pointer',
              error && 'border-rose-500 focus:border-rose-500',
              className
            )
          )}
          {...props}
        >
          {options ? options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0a0b1e] text-slate-100">
              {opt.label}
            </option>
          )) : children}
        </select>

        {error && (
          <p className="text-xs text-rose-400 font-mono mt-1 flex items-center gap-1">
            <span>[!]</span> {error}
          </p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
