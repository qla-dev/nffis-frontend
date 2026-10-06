import { EFFIS_FWI_DISPLAY_MAX } from '../../lib/fwi/effisFwiScale';

export const FWI_SCALE_LABELS = [0, 20, 40, 60, 80] as const;

export function FwiScaleLabels() {
  return <div className="relative mt-1 h-4 font-mono text-[10px] font-bold text-slate-400" aria-label="FWI scale from 0 to 80">
    {FWI_SCALE_LABELS.map((value, index) => <span key={value}
      className={`absolute top-0 ${index === 0 ? '' : index === FWI_SCALE_LABELS.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
      style={{ left: `${value / EFFIS_FWI_DISPLAY_MAX * 100}%` }}>{value}</span>)}
  </div>;
}
