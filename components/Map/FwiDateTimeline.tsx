import type { FireWeatherProduct } from '../../services/fireMonitoringService';

export interface FwiDateRange { from: string; to: string }
const DAY_MS = 86_400_000;

export function defaultFwiDateRange(): FwiDateRange {
  const now = new Date();
  const to = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  return { from: new Date(Date.parse(`${to}T12:00:00Z`) - 89 * DAY_MS).toISOString().slice(0, 10), to };
}

export function archiveFwiDateRange(products: FireWeatherProduct[]): FwiDateRange {
  const fallback = defaultFwiDateRange();
  if (!products.length) return fallback;
  return { from: products.reduce((first, product) => product.valid_at.slice(0, 10) < first ? product.valid_at.slice(0, 10) : first, products[0].valid_at.slice(0, 10)), to: fallback.to };
}

export function filterFwiProducts(products: FireWeatherProduct[], range: FwiDateRange): FireWeatherProduct[] {
  return products.filter(product => {
    const date = product.valid_at.slice(0, 10);
    return date >= range.from && date <= range.to;
  });
}

function formatDate(date: string, language: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-GB', { ...options, timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

export function FwiDateRangePicker({ range, onChange, language, maxDate, firstAvailableDate }: {
  range: FwiDateRange; onChange: (range: FwiDateRange) => void; language: string; maxDate?: string; firstAvailableDate?: string;
}) {
  const bosnian = language === 'bs';
  const inputClass = 'w-full min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white [color-scheme:dark] focus:border-orange-400 focus:outline-none';
  return <div>
    <div className="grid grid-cols-2 gap-2 text-slate-300">
      <label className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{bosnian ? 'Prikaži od' : 'Show from'}</span>
        <input type="date" value={range.from} max={maxDate} aria-label={bosnian ? 'FWI od datuma' : 'FWI from date'}
          onChange={event => { const from = event.target.value; if (from) onChange({ from, to: from > range.to ? from : range.to }); }} className={inputClass} />
      </label>
      <label className="min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{bosnian ? 'Prikaži do' : 'Show to'}</span>
        <input type="date" value={range.to} max={maxDate} aria-label={bosnian ? 'FWI do datuma' : 'FWI to date'}
          onChange={event => { const to = event.target.value; if (to) onChange({ from: to < range.from ? to : range.from, to }); }} className={inputClass} />
      </label>
    </div>
    {firstAvailableDate && range.from < firstAvailableDate && <p className="mt-2 text-[11px] text-amber-300" role="status">
      {bosnian ? 'Najstariji sačuvani FWI: ' : 'Earliest saved FWI: '}
      {formatDate(firstAvailableDate, language, { day: 'numeric', month: 'long', year: 'numeric' })}.
    </p>}
  </div>;
}

interface Props {
  products: FireWeatherProduct[]; range: FwiDateRange; index: number;
  onSelect: (index: number) => void; language: string;
}

export function FwiDateTimeline({ products, index, onSelect, language }: Props) {
  const bosnian = language === 'bs';
  const selectedIndex = Math.max(0, Math.min(index, products.length - 1));
  if (!products.length) return <p className="mt-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300" role="status">
    {bosnian ? 'Nema sačuvanog FWI za odabrani period. Promijenite datume iznad.' : 'No saved FWI for these dates. Change the range above.'}
  </p>;

  const referenceIndices = [...new Set(Array.from({ length: 4 }, (_, position) =>
    Math.round(position * (products.length - 1) / 3)))];
  const selectedDate = products[selectedIndex].valid_at.slice(0, 10);
  const selectDate = (date: string) => {
    if (!date) return;
    const requestedTime = Date.parse(`${date}T12:00:00Z`);
    const nearestIndex = products.reduce((nearest, product, productIndex) => {
      const distance = Math.abs(Date.parse(product.valid_at) - requestedTime);
      const nearestDistance = Math.abs(Date.parse(products[nearest].valid_at) - requestedTime);
      return distance < nearestDistance ? productIndex : nearest;
    }, 0);
    onSelect(nearestIndex);
  };
  return <div className="mt-3 border-t border-slate-700/70 pt-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <input type="date" value={selectedDate} min={products[0].valid_at.slice(0, 10)}
          max={products[products.length - 1].valid_at.slice(0, 10)} onChange={event => selectDate(event.target.value)}
          aria-label={bosnian ? 'Datum prikazan na mapi' : 'Date shown on map'}
          className="min-w-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-orange-300 [color-scheme:dark] focus:border-orange-400 focus:outline-none" />
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => onSelect(selectedIndex - 1)} disabled={selectedIndex === 0}
          aria-label={bosnian ? 'Prethodni FWI datum' : 'Previous FWI date'}
          className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40">←</button>
        <button type="button" onClick={() => onSelect(selectedIndex + 1)} disabled={selectedIndex === products.length - 1}
          aria-label={bosnian ? 'Sljedeći FWI datum' : 'Next FWI date'}
          className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40">→</button>
      </div>
    </div>
    <input type="range" min={0} max={Math.max(0, products.length - 1)} step={1} value={selectedIndex}
      onChange={event => onSelect(Number(event.target.value))}
      className="block w-full cursor-pointer accent-orange-500"
      aria-label={bosnian ? 'Datum historijskog FWI rastera' : 'Historical FWI raster date'} />
    <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
      {referenceIndices.map((referenceIndex, position) => {
        const date = products[referenceIndex].valid_at.slice(0, 10);
        return <span key={referenceIndex} title={formatDate(date, language, { day: 'numeric', month: 'long', year: 'numeric' })}
          className={position === 0 ? 'text-left' : position === referenceIndices.length - 1 ? 'text-right' : 'text-center'}>
          {formatDate(date, language, { day: 'numeric', month: 'short' })}
        </span>;
      })}
    </div>
  </div>;
}
