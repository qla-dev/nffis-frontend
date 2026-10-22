import { useId, useState } from 'react';
import { calculateSupplementary, type SupplementaryInputs } from '../../lib/fwi/supplementaryCalculations';
import { classifyIndexValue } from '../../lib/fwi/supplementaryIndices';

const fields = [
  ['temperature13C', '13:00 temperature (°C)', undefined, undefined],
  ['humidity13Pct', '13:00 humidity (%)', 0, 100],
  ['noonTemperatureC', 'Noon temperature (°C)', undefined, undefined],
  ['noonHumidityPct', 'Noon humidity (%)', 0, 100],
  ['noonWindKmh', 'Noon wind (km/h)', 0, undefined],
  ['rain24hMm', 'Noon-to-noon rainfall (mm)', 0, undefined],
  ['maximumTemperatureC', 'Daily maximum temperature (°C)', undefined, undefined],
  ['curingPct', 'Grass curing (%)', 0, 100],
  ['previousKbdiMm', 'Previous KBDI (mm)', 0, 203.2],
  ['runoffRemainingMm', 'Remaining interception allowance (mm)', 0, 5.08],
  ['annualRainfallMm', 'Mean annual rainfall (mm)', 0, undefined],
] as const;
type Field = typeof fields[number][0];
const format = (value: number | null | undefined) => value == null ? '—' : value.toFixed(3);
export function SupplementaryIndexSummary({ inputs }: { inputs: SupplementaryInputs }) {
  const result = calculateSupplementary(inputs);
  return <table aria-label="Daily supplementary index results" className="w-full text-xs [&_td]:py-2 [&_td:last-child]:text-right">
    <tbody>{([
      ['Angström', 'ANGSTROM', result.angstrom, ''], ['GFDI', 'GFDI', result.gfdi, ''], ['KBDI', 'KBDI', result.kbdi?.kbdi ?? null, ' mm'],
    ] as const).map(([name, type, value, unit]) => <tr key={type}><td>{name}</td><td>{format(value)}{unit}{value != null && <span className="ml-2 text-slate-400">{classifyIndexValue(type, value).label.en}</span>}</td></tr>)}</tbody>
  </table>;
}
export function SupplementaryIndexCalculations({ inputs, date }: { inputs: SupplementaryInputs; date: string }) {
  const id = useId();
  const initial = Object.fromEntries(fields.map(([key]) => [key, inputs[key] == null ? '' : String(inputs[key])])) as Record<Field, string>;
  const [values, setValues] = useState(initial);
  const parsed = { replayedDays: inputs.replayedDays } as SupplementaryInputs;
  fields.forEach(([key, , min, max]) => {
    const value = Number(values[key]);
    parsed[key] = values[key].trim() !== '' && Number.isFinite(value) && (min == null || value >= min) && (max == null || value <= max) ? value : null;
  });
  const result = calculateSupplementary(parsed);
  const changed = fields.some(([key]) => values[key] !== initial[key]);
  return <section aria-label="Supplementary index formula comparison" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
    <h3 className="text-sm font-bold text-emerald-200">Angström, GFDI and KBDI calculations</h3>
    <p className="mt-2 text-xs text-slate-400">{date} · Europe/Sarajevo · {changed ? 'Custom scenario' : 'Loaded daily weather'}. Angström uses 13:00; GFDI uses noon; KBDI uses the daily maximum and complete noon-to-noon rainfall. These daily inputs differ from the current-hour FWI scenario above.</p>
    <div className="mt-3 grid grid-cols-2 gap-3">{fields.map(([key, label, min, max]) => <label key={key} htmlFor={`${id}-${key}`} className="text-[11px]">{label}<input id={`${id}-${key}`} aria-label={`Supplementary ${label}`} type="number" step="any" min={min} max={max} value={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-white" /></label>)}</div>
    <button type="button" onClick={() => setValues(initial)} className="mt-3 rounded border border-slate-600 px-3 py-1.5 text-xs">Reset supplementary inputs</button>
    <p className="mt-3 text-xs text-amber-200">Grass curing and annual rainfall are configured assumptions. Previous KBDI replays {inputs.replayedDays} available days from the configured initial state. This independent point calculation can differ from the saved grid's longer warm-up. Missing inputs remain blank.</p>
    <SupplementaryIndexSummary inputs={parsed} />
    <div className="mt-3 space-y-3 text-xs">
      <details><summary>Angström formula and terms</summary><p className="mt-2 font-mono">I = RH₁₃/20 + (27 − T₁₃)/10</p><p>Humidity term: {format(parsed.humidity13Pct == null ? null : parsed.humidity13Pct / 20)}; temperature term: {format(parsed.temperature13C == null ? null : (27 - parsed.temperature13C) / 10)}. Lower values mean greater danger.</p></details>
      <details><summary>GFDI formula and assumptions</summary><p className="mt-2 break-words font-mono">F = 2 × exp(−23.6 + 5.01 ln C + 0.0281 T − 0.226 √RH + 0.633 √V)</p><p>T in °C, RH and curing C in %, wind V in km/h. C = 0 produces zero. This is McArthur Mark 3, not a measured grass moisture value.</p></details>
      <details><summary>KBDI water balance and drying</summary><p className="mt-2 font-mono">Q = max(0, previous KBDI − effective rain)</p><p className="mt-2 break-words font-mono">D = (203.2 − Q) × max(0, 0.968 exp(0.0875 Tmax + 1.5552) − 8.30) / (1 + 10.88 exp(−0.001736 R)) × 0.001</p><p className="mt-2">Today = clamp(Q + D, 0, 203.2) mm. R is mean annual rainfall in mm. The first 5.08 mm of each rain spell is intercepted; unused allowance carries into consecutive wet days and resets after a dry day.</p><table aria-label="KBDI calculation steps" className="mt-2 w-full [&_td]:py-1 [&_td:last-child]:text-right"><tbody>{[
        ['Intercepted rain (mm)', result.kbdi?.interception], ['Effective rain (mm)', result.kbdi?.effectiveRain], ['Deficit after rain (mm)', result.kbdi?.afterRain], ['Drying increment (mm)', result.kbdi?.drying], ['Next interception allowance (mm)', result.kbdi?.runoffRemainingMm],
      ].map(([label, value]) => <tr key={label as string}><td>{label}</td><td>{format(value as number | undefined)}</td></tr>)}</tbody></table></details>
    </div>
  </section>;
}
