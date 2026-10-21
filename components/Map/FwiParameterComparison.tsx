import { useId, useState } from 'react';
import { FwiCodeHelp } from './FwiCodeHelp';
import { calculateBosnianFwi } from '../../lib/fwi/bosnianFwi';
import { deriveFwi } from '../../lib/fwi/canadianFwi';
import { calculateCanadianComparison, type FwiComparisonInputs } from '../../lib/fwi/compareFwi';

const fields = [
  ['temperatureC', 'Temperature (°C)', undefined, undefined],
  ['humidityPct', 'Humidity (%)', 0, 100],
  ['windKmh', 'Wind (km/h)', 0, undefined],
  ['dryDays', 'Dry days (< 2 mm)', 0, undefined],
  ['rainMm', 'Rain, previous 24 h (mm)', 0, undefined],
  ['month', 'Month', 1, 12],
  ['previousFfmc', 'Previous FFMC', 0, 101],
  ['previousDmc', 'Previous DMC', 0, undefined],
  ['previousDc', 'Previous DC', 0, undefined],
] as const;

export function FwiParameterComparison({ inputs, observationTime, locationName }: {
  inputs: FwiComparisonInputs; observationTime: string; locationName: string;
}) {
  const inputId = useId();
  const initial = Object.fromEntries(fields.map(([key]) => [key, inputs[key] == null ? '' : String(inputs[key])])) as Record<keyof FwiComparisonInputs, string>;
  const [values, setValues] = useState(initial);
  const validField = (key: keyof FwiComparisonInputs) => {
    const [, , min, max] = fields.find(field => field[0] === key)!;
    const value = Number(values[key]);
    return values[key].trim() !== '' && Number.isFinite(value) && (min == null || value >= min) && (max == null || value <= max)
      && ((key !== 'month' && key !== 'dryDays') || Number.isInteger(value));
  };
  const weatherValid = (['temperatureC', 'humidityPct', 'windKmh'] as const).every(validField);
  const bosnianValid = weatherValid && validField('dryDays');
  const canadianValid = weatherValid && (['rainMm', 'month', 'previousFfmc', 'previousDmc', 'previousDc'] as const).every(validField);
  const valid = bosnianValid && canadianValid;
  const temperature = Number(values.temperatureC), humidity = Number(values.humidityPct), wind = Number(values.windKmh);
  const bosnian = bosnianValid ? calculateBosnianFwi({ temperatureC: temperature, humidityPct: humidity, windKmh: wind, dryDays: Number(values.dryDays) }) : null;
  const canadian = canadianValid ? calculateCanadianComparison({
    temperatureC: temperature, humidityPct: humidity, windKmh: wind, dryDays: Number(values.dryDays),
    rainMm: Number(values.rainMm), month: Number(values.month), previousFfmc: Number(values.previousFfmc),
    previousDmc: Number(values.previousDmc), previousDc: Number(values.previousDc),
  }, observationTime) : null;
  const derived = canadian ? deriveFwi(canadian.ffmc, canadian.dmc, canadian.dc, canadian.windKmh) : null;
  const format = (value: number | null | undefined) => value == null ? '-' : value.toFixed(3);
  const changed = fields.some(([key]) => initial[key] !== values[key]);
  return <section aria-label="FWI parameter comparison" className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
    <h3 className="text-sm font-bold text-blue-200">Compare formulas · same weather inputs</h3>
    <p className="mt-2 text-xs text-slate-400">{locationName} · {observationTime} · Europe/Sarajevo. {changed ? 'Custom scenario' : 'Loaded weather inputs'}.</p>
    <p className="mt-2 text-xs text-slate-400">Both formulas use the temperature, humidity and wind below. Bosnian FWI uses the dry-day count; Canadian FWI uses 24-hour rain and previous moisture codes. Edit parameters to compare their response.</p>
    <div className="mt-3 grid grid-cols-2 gap-3">
      {fields.map(([key, label, min, max]) => <div key={key} className="text-[11px] text-slate-300"><div className="flex items-center"><label htmlFor={`${inputId}-${key}`}>{label}</label><FwiCodeHelp label={label} /></div>
        <input id={`${inputId}-${key}`} aria-label={`Comparison ${label}`} type="number" min={min} max={max} step={key === 'month' || key === 'dryDays' ? 1 : 'any'} value={values[key]}
          onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))}
          className="mt-1 w-full min-w-0 rounded border border-slate-600 bg-slate-900 p-2 text-white" />
      </div>)}
    </div>
    <button type="button" onClick={() => setValues(initial)} className="mt-3 rounded border border-slate-600 px-3 py-1.5 text-xs">Reset to loaded inputs</button>
    <p className="mt-3 text-xs text-slate-400">Previous codes come from the available daily replay before the selected day, starting at FFMC 85, DMC 6, DC 15. Without earlier observations these defaults are used. This scenario applies one update at the displayed hour; the saved map and daily noon replay may differ.</p>
    {inputs.rainMm == null && <p className="mt-2 text-xs text-amber-300">A complete 24-hour rain window is unavailable. Enter a rain total to calculate the Canadian result.</p>}
    {!valid && <p role="status" className="mt-2 text-xs text-amber-300">Enter valid values for every parameter; month and dry days must be whole numbers.</p>}
    <h4 className="mt-5 text-sm font-bold">Inputs and intermediate values</h4>
    <p className="mt-1 text-[11px] text-slate-400">- = not used by this formula or unavailable. Bosnian ISI and BUI are estimates.</p>
    <table aria-label="Bosnian and Canadian FWI comparison" className="mt-3 w-full text-xs [&_td]:border-b [&_td]:border-slate-800 [&_td]:py-2 [&_td:not(:first-child)]:text-right [&_td:not(:first-child)]:font-mono">
      <thead><tr className="border-b border-slate-700"><th scope="col" className="pb-2 text-left">Parameter</th><th scope="col" className="pb-2 text-right text-purple-300">Bosnian</th><th scope="col" className="pb-2 text-right text-orange-300">Canadian</th></tr></thead>
      <tbody>{([
        ['Temperature (\u00b0C)', validField('temperatureC') ? temperature : null, validField('temperatureC') ? temperature : null],
        ['Humidity (%)', validField('humidityPct') ? humidity : null, validField('humidityPct') ? humidity : null],
        ['Wind (km/h)', validField('windKmh') ? wind : null, validField('windKmh') ? wind : null],
        ['Dry days (< 2 mm)', validField('dryDays') ? Number(values.dryDays) : null, null],
        ['Rain, previous 24 h (mm)', null, canadian?.rainMm], ['Month', null, canadian?.month],
        ['Previous FFMC', null, canadian?.previousFfmc], ['Previous DMC', null, canadian?.previousDmc], ['Previous DC', null, canadian?.previousDc],
        ['Updated FFMC', null, canadian?.ffmc], ['Updated DMC', null, canadian?.dmc], ['Updated DC', null, canadian?.dc],
        ['Fine-fuel moisture m', null, derived?.fineFuelMoisture], ['Wind function fW', null, derived?.windFunction], ['Fuel function fF', null, derived?.fuelFunction],
        ['ISI', bosnian?.isi, canadian?.isi], ['BUI', bosnian?.bui, canadian?.bui], ['Drought function fD', bosnian?.droughtFunction, derived?.droughtFunction],
        ['B = 0.1 \u00d7 ISI \u00d7 fD', bosnian?.initialSpread, derived?.initialSpread], ['Point FWI', bosnian?.fwi, canadian?.fwi],
      ] as [string, number | null | undefined, number | null | undefined][]).map(([label, bosnianValue, canadianValue]) => <tr key={label} className={label === 'Point FWI' ? 'font-bold text-white' : ''}>
        <td>{label}<FwiCodeHelp label={label} /></td><td>{format(bosnianValue)}</td><td>{format(canadianValue)}</td>
      </tr>)}</tbody>
    </table>
    <p className="mt-3 text-sm font-bold">Canadian − Bosnian: <output aria-label="FWI difference">{bosnian && canadian ? format(canadian.fwi - bosnian.fwi) : '-'}</output></p>
  </section>;
}
