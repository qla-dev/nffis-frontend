import { EFFIS_FWI_DISPLAY_MAX } from '../../lib/fwi/effisFwiScale';

export const FWI_SCALE_LABELS = [0, 20, 40, 60, 80] as const;

export function FwiScaleLabels() {
  return <div className="relative mt-1 h-4 font-mono text-[10px] font-bold text-slate-400" aria-label="FWI scale from 0 to 80">
    {FWI_SCALE_LABELS.map((value, index) => <span key={value}
      className={`absolute top-0 ${index === 0 ? '' : index === FWI_SCALE_LABELS.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
      style={{ left: `${value / EFFIS_FWI_DISPLAY_MAX * 100}%` }}>{value}</span>)}
  </div>;
}

export const FWI_LEGEND_SCALE = {
  valueLabel: 'FWI',
  ticks: FWI_SCALE_LABELS.map(value => ({ value, position: value / EFFIS_FWI_DISPLAY_MAX })),
};

/** Class-boundary labels for the Angström, GFDI and KBDI legends. */
export function IndexScaleLabels({ ticks, label }: { ticks: Array<{ value: number; position: number }>; label: string }) {
  return <div className="relative mt-1 h-4 font-mono text-[10px] font-bold text-slate-400" aria-label={`${label} scale`}>
    {ticks.map((tick, index) => <span key={tick.value}
      className={`absolute top-0 ${index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
      style={{ left: `${tick.position * 100}%` }}>{Number.isInteger(tick.value) ? tick.value : tick.value.toFixed(1)}</span>)}
  </div>;
}
