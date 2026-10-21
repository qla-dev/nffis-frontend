import { deriveFwi, updateDc, updateDmc, updateFfmc, type CanadianFwiStep } from './canadianFwi';

export interface FwiComparisonInputs {
  temperatureC: number; humidityPct: number; windKmh: number; dryDays: number;
  rainMm: number | null; month: number;
  previousFfmc: number; previousDmc: number; previousDc: number;
}

export function calculateCanadianComparison(inputs: FwiComparisonInputs, time: string): CanadianFwiStep | null {
  const { temperatureC, humidityPct, windKmh, rainMm, month, previousFfmc, previousDmc, previousDc } = inputs;
  if (rainMm == null || ![temperatureC, humidityPct, windKmh, rainMm, month, previousFfmc, previousDmc, previousDc].every(Number.isFinite)
    || humidityPct < 0 || humidityPct > 100 || windKmh < 0 || rainMm < 0 || !Number.isInteger(month) || month < 1 || month > 12
    || previousFfmc < 0 || previousFfmc > 101 || previousDmc < 0 || previousDc < 0) return null;
  const ffmc = updateFfmc(previousFfmc, temperatureC, humidityPct, windKmh, rainMm);
  const dmc = updateDmc(previousDmc, temperatureC, humidityPct, rainMm, month - 1);
  const dc = updateDc(previousDc, temperatureC, rainMm, month - 1);
  return { time, temperatureC, humidityPct, windKmh, rainMm, month, previousFfmc, previousDmc, previousDc,
    ffmc, dmc, dc, ...deriveFwi(ffmc, dmc, dc, windKmh) };
}
