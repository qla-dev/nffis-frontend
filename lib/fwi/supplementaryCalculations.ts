import type { CanadianFwiWeatherData } from './canadianFwi';

export interface SupplementarySettings {
  mean_annual_rainfall_mm?: number;
  grass_curing_percent_by_month?: number[];
  initial_kbdi_mm?: number;
}
export interface SupplementaryInputs {
  temperature13C: number | null; humidity13Pct: number | null;
  noonTemperatureC: number | null; noonHumidityPct: number | null; noonWindKmh: number | null;
  rain24hMm: number | null; maximumTemperatureC: number | null;
  curingPct: number | null; previousKbdiMm: number | null; runoffRemainingMm: number | null; annualRainfallMm: number | null;
  replayedDays: number;
}
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const valid = (value: unknown, min = -Infinity, max = Infinity): value is number => finite(value) && value >= min && value <= max;
export function calculateAngstrom(temperature: number | null, humidity: number | null): number | null {
  return finite(temperature) && valid(humidity, 0, 100) ? humidity / 20 + (27 - temperature) / 10 : null;
}
export function calculateGfdi(temperature: number | null, humidity: number | null, wind: number | null, curing: number | null): number | null {
  if (!finite(temperature) || !valid(humidity, 0, 100) || !valid(wind, 0) || !valid(curing, 0, 100)) return null;
  const value = curing === 0 ? 0 : 2 * Math.exp(-23.6 + 5.01 * Math.log(curing) + 0.0281 * temperature - 0.226 * Math.sqrt(humidity) + 0.633 * Math.sqrt(wind));
  return finite(value) ? value : null;
}
export function calculateKbdi(previous: number | null, maximumTemperature: number | null, rain: number | null, annualRain: number | null, remaining: number | null) {
  if (!valid(previous, 0, 203.2) || !finite(maximumTemperature) || !valid(rain, 0) || !valid(annualRain, 0) || !valid(remaining, 0, 5.08)) return null;
  const interception = rain > 0 ? Math.min(rain, remaining) : 0;
  const effectiveRain = rain - interception;
  const afterRain = Math.max(0, previous - effectiveRain);
  const drying = (203.2 - afterRain) * Math.max(0, 0.968 * Math.exp(0.0875 * maximumTemperature + 1.5552) - 8.30) / (1 + 10.88 * Math.exp(-0.001736 * annualRain)) * 0.001;
  const kbdi = Math.max(0, Math.min(203.2, afterRain + drying));
  if (!finite(kbdi) || !finite(drying)) return null;
  return { kbdi, interception, effectiveRain, afterRain, drying, runoffRemainingMm: rain > 0 ? remaining - interception : 5.08 };
}
export function calculateSupplementary(inputs: SupplementaryInputs) {
  return {
    angstrom: calculateAngstrom(inputs.temperature13C, inputs.humidity13Pct),
    gfdi: calculateGfdi(inputs.noonTemperatureC, inputs.noonHumidityPct, inputs.noonWindKmh, inputs.curingPct),
    kbdi: calculateKbdi(inputs.previousKbdiMm, inputs.maximumTemperatureC, inputs.rain24hMm, inputs.annualRainfallMm, inputs.runoffRemainingMm),
  };
}
export function inspectSupplementaryWeather(weather: CanadianFwiWeatherData, date: string, settings: SupplementarySettings = {}): SupplementaryInputs {
  const h = weather.hourly ?? {}, times = h.time ?? [];
  const at = (values: number[] | undefined, index: number) => index >= 0 && finite(values?.[index]) ? values![index] : null;
  const noon = (day: string) => times.indexOf(`${day}T12:00`);
  const maximum = (day: string) => {
    const indexes = times.flatMap((time, index) => time.startsWith(day) ? [index] : []);
    const values = indexes.map(index => at(h.temperature_2m, index));
    return indexes.length === 24 && values.every(finite) ? Math.max(...values) : null;
  };
  const rain = (index: number) => {
    if (index < 23) return null;
    const end = Date.parse(times[index] + 'Z');
    const values = Array.from({ length: 24 }, (_, i) => {
      const offset = index - 23 + i;
      return Date.parse(times[offset] + 'Z') === end - (23 - i) * 3600_000 ? at(h.precipitation, offset) : null;
    });
    return values.every(value => valid(value, 0)) ? (values as number[]).reduce((sum, value) => sum + value, 0) : null;
  };
  const annualRain = settings.mean_annual_rainfall_mm ?? 1250;
  let previous: number | null = settings.initial_kbdi_mm ?? 0, remaining: number | null = 5.08, replayedDays = 0;
  for (const day of [...new Set(times.map(time => time.slice(0, 10)))].filter(day => day < date)) {
    const index = noon(day);
    // The first returned day has no preceding full rainfall window.
    if (index < 23 && replayedDays === 0) continue;
    const step = calculateKbdi(previous, maximum(day), rain(index), annualRain, remaining);
    if (!step) { previous = null; remaining = null; break; }
    previous = step.kbdi; remaining = step.runoffRemainingMm; replayedDays++;
  }
  const index = noon(date), afternoon = times.indexOf(`${date}T13:00`);
  return {
    temperature13C: at(h.temperature_2m, afternoon), humidity13Pct: at(h.relative_humidity_2m, afternoon),
    noonTemperatureC: at(h.temperature_2m, index), noonHumidityPct: at(h.relative_humidity_2m, index), noonWindKmh: at(h.wind_speed_10m, index),
    maximumTemperatureC: maximum(date), rain24hMm: rain(index),
    curingPct: (settings.grass_curing_percent_by_month ?? [60,55,45,35,35,50,75,90,90,80,70,65])[Number(date.slice(5,7))-1] ?? null,
    previousKbdiMm: previous, runoffRemainingMm: remaining, annualRainfallMm: annualRain, replayedDays,
  };
}
