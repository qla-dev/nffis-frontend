import React from 'react';
import { Ruler } from 'lucide-react';

export const SCALE_STEPS = [
  10, 20, 50,
  100, 200, 500,
  1000, 2000, 5000,
  10000, 20000, 50000,
  100000, 200000, 500000,
];

export const MAX_BAR_WIDTH = 132;

export interface ScaleReading {
  meters: number;
  width: number;
}

export function scaleReading(spanMeters: number): ScaleReading {
  if (!Number.isFinite(spanMeters) || spanMeters <= 0) {
    return { meters: SCALE_STEPS[0], width: MAX_BAR_WIDTH };
  }

  const meters = SCALE_STEPS.reduce(
    (chosen, step) => (step <= spanMeters ? step : chosen),
    SCALE_STEPS[0],
  );

  return {
    meters,
    width: Math.min(MAX_BAR_WIDTH, Math.round(meters / spanMeters * MAX_BAR_WIDTH)),
  };
}

export function ScaleBar({ scale, positionClassName }: { scale: ScaleReading; positionClassName: string }) {
  return <div className={`pointer-events-none absolute z-[2200] hidden flex-col rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-3 shadow-2xl backdrop-blur-md md:flex ${positionClassName}`}>
    <div className="mb-2 flex items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <Ruler size={13} className="text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scale</span>
      </div>
      <span className="font-mono text-[11px] font-black tabular-nums text-white">
        {scale.meters >= 1000 ? `${scale.meters / 1000} km` : `${scale.meters} m`}
      </span>
    </div>
    <div className="relative h-3" style={{ width: MAX_BAR_WIDTH }}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
      <div className="absolute left-0 top-1/2 h-px bg-blue-500 transition-all duration-300 ease-out" style={{ width: scale.width }} />
      <div className="absolute left-0 top-0 h-full w-px bg-blue-500" />
      <div className="absolute top-0 h-full w-px bg-blue-500 transition-all duration-300 ease-out" style={{ left: scale.width - 1 }} />
    </div>
  </div>;
}
