export interface BosnianFwiInputs {
  temperatureC: number;
  humidityPct: number;
  windKmh: number;
  dryDays: number;
}

/** Original NFFIS formula, preserved independently of Canadian FWI. */
export function calculateBosnianFwi(inputs: BosnianFwiInputs) {
  const { temperatureC: temp, humidityPct: humidity, windKmh, dryDays } = inputs;
  if (![temp, humidity, windKmh, dryDays].every(Number.isFinite)) return null;
  if (humidity < 0 || humidity > 100 || windKmh < 0 || dryDays < 0) return null;
  const isi = windKmh * 0.12 * (1 + Math.max(0, 30 - humidity) / 60) * (Math.max(0, temp) / 15);
  const bui = dryDays * 6 + Math.max(0, temp) / 8;
  const droughtFunction = bui <= 80
    ? 0.626 * Math.max(0, bui) ** 0.809 + 2
    : 1000 / (25 + 108.64 * Math.exp(-0.023 * Math.max(0, bui)));
  const initialSpread = 0.1 * isi * droughtFunction;
  const fwi = initialSpread > 1
    ? Math.exp(2.72 * Math.max(0, 0.434 * Math.log(Math.max(initialSpread, 1e-6))) ** 0.647)
    : Math.max(0, initialSpread);
  return { ...inputs, isi, bui, droughtFunction, initialSpread, fwi };
}

export const BOSNIAN_FWI_FORMULAS = [
  'Dry days = count of daily precipitation totals < 2 mm in the displayed window',
  'ISI = wind × 0.12 × (1 + max(0, 30 − humidity) / 60) × (max(0, temperature) / 15)',
  'BUI = dry days × 6 + max(0, temperature) / 8',
  'fD = 0.626 × BUI^0.809 + 2 (BUI ≤ 80); otherwise 1000 / (25 + 108.64 × exp(−0.023 × BUI))',
  'B = 0.1 × ISI × fD',
  'FWI = exp(2.72 × (0.434 × ln(B))^0.647) when B > 1; otherwise max(0, B)',
];
