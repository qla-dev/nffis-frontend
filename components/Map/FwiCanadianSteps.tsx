import { deriveFwi, type CanadianFwiStep } from '../../lib/fwi/canadianFwi';
import { FwiCodeHelp } from './FwiCodeHelp';

const format = (value: number) => value.toFixed(3);
export function FwiCanadianSteps({ step }: { step: CanadianFwiStep }) {
  const derived = deriveFwi(step.ffmc, step.dmc, step.dc, step.windKmh);
  const rows: [string, string | number][] = [
    ['Observation', step.time], ['Temperature (°C)', format(step.temperatureC)], ['Humidity (%)', format(step.humidityPct)],
    ['Wind (km/h)', format(step.windKmh)], ['Rain, previous 24 h (mm)', format(step.rainMm)], ['Month', step.month],
    ['Previous FFMC', format(step.previousFfmc)], ['Previous DMC', format(step.previousDmc)], ['Previous DC', format(step.previousDc)],
    ['Updated FFMC', format(step.ffmc)], ['Updated DMC', format(step.dmc)], ['Updated DC', format(step.dc)],
    ['Fine-fuel moisture m', format(derived.fineFuelMoisture)], ['Wind function fW', format(derived.windFunction)],
    ['Fuel function fF', format(derived.fuelFunction)], ['ISI', format(step.isi)], ['BUI', format(step.bui)],
    ['Drought function fD', format(derived.droughtFunction)], ['B = 0.1 × ISI × fD', format(derived.initialSpread)], ['Point FWI', format(step.fwi)],
  ];
  return <table aria-label="Canadian inputs and intermediate values" className="w-full text-xs [&_td]:border-b [&_td]:border-slate-800 [&_td]:py-2 [&_td:last-child]:text-right [&_td:last-child]:font-mono">
    <tbody>{rows.map(([label, value]) => <tr key={label}><td>{label}<FwiCodeHelp label={label} /></td><td>{value}</td></tr>)}</tbody>
  </table>;
}
