import React from 'react';

export interface GlassSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[#00f0ff] font-bold">
          {value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#0a0b1e] rounded-lg appearance-none cursor-pointer accent-[#00f0ff] border border-white/10 focus:outline-none"
        />
        <div className="flex items-center border border-white/10 rounded-md bg-[#0a0b1e] overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - step))}
            className="px-2 py-1 text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 active:bg-white/10 font-bold select-none"
          >
            -
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-200 min-w-[32px] text-center">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + step))}
            className="px-2 py-1 text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 active:bg-white/10 font-bold select-none"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
