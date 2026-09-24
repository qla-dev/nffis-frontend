export interface CanadianFwiWeatherData {
  current?: { time?: string };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
    precipitation?: number[];
  };
}

export interface CanadianFwiResult {
  ffmc: number;
  dmc: number;
  dc: number;
  isi: number;
  bui: number;
  fwi: number;
  observationTime: string;
  observationCount: number;
}

const DMC_DAY_LENGTH = [6.5, 7.5, 9, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8, 7, 6];
const DC_DRYING_FACTOR = [-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5, 2.4, 0.4, -1.6, -1.6];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const updateFfmc = (previous: number, temperature: number, humidity: number, windKmh: number, rainMm: number) => {
  const rh = clamp(humidity, 0, 100);
  let moisture = 147.2 * (101 - previous) / (59.5 + previous);

  if (rainMm > 0.5) {
    const effectiveRain = rainMm - 0.5;
    moisture += 42.5 * effectiveRain * Math.exp(-100 / (251 - moisture)) * (1 - Math.exp(-6.93 / effectiveRain));
    if (moisture > 150) moisture += 0.0015 * (moisture - 150) ** 2 * Math.sqrt(effectiveRain);
    moisture = Math.min(250, moisture);
  }

  const equilibriumDry = 0.942 * rh ** 0.679 + 11 * Math.exp((rh - 100) / 10)
    + 0.18 * (21.1 - temperature) * (1 - Math.exp(-0.115 * rh));
  const equilibriumWet = 0.618 * rh ** 0.753 + 10 * Math.exp((rh - 100) / 10)
    + 0.18 * (21.1 - temperature) * (1 - Math.exp(-0.115 * rh));

  if (moisture < equilibriumDry) {
    if (moisture < equilibriumWet) {
      const wettingRate = (0.424 * (1 - ((100 - rh) / 100) ** 1.7)
        + 0.0694 * Math.sqrt(Math.max(0, windKmh)) * (1 - ((100 - rh) / 100) ** 8))
        * 0.581 * Math.exp(0.0365 * temperature);
      moisture = equilibriumWet - (equilibriumWet - moisture) * 10 ** (-wettingRate);
    }
  } else {
    const dryingRate = (0.424 * (1 - (rh / 100) ** 1.7)
      + 0.0694 * Math.sqrt(Math.max(0, windKmh)) * (1 - (rh / 100) ** 8))
      * 0.581 * Math.exp(0.0365 * temperature);
    moisture = equilibriumDry + (moisture - equilibriumDry) * 10 ** (-dryingRate);
  }

  return clamp(59.5 * (250 - moisture) / (147.2 + moisture), 0, 101);
};

export const updateDmc = (previous: number, temperature: number, humidity: number, rainMm: number, month: number) => {
  let dmc = previous;
  if (rainMm > 1.5) {
    const effectiveRain = 0.92 * rainMm - 1.27;
    const moisture = 20 + Math.exp(5.6348 - dmc / 43.43);
    const coefficient = dmc <= 33
      ? 100 / (0.5 + 0.3 * dmc)
      : dmc <= 65 ? 14 - 1.3 * Math.log(dmc) : 6.2 * Math.log(dmc) - 17.2;
    const rainMoisture = moisture + 1000 * effectiveRain / (48.77 + coefficient * effectiveRain);
    dmc = Math.max(0, 244.72 - 43.43 * Math.log(Math.max(20.0001, rainMoisture) - 20));
  }
  const drying = temperature <= -1.1 ? 0 : 1.894 * (temperature + 1.1)
    * (100 - clamp(humidity, 0, 100)) * DMC_DAY_LENGTH[month] * 1e-6;
  return Math.max(0, dmc + 100 * drying);
};

export const updateDc = (previous: number, temperature: number, rainMm: number, month: number) => {
  let dc = previous;
  if (rainMm > 2.8) {
    const effectiveRain = 0.83 * rainMm - 1.27;
    const previousMoisture = 800 * Math.exp(-dc / 400);
    const rainMoisture = previousMoisture + 3.937 * effectiveRain;
    dc = Math.max(0, 400 * Math.log(800 / rainMoisture));
  }
  const drying = Math.max(0, 0.36 * (temperature + 2.8) + DC_DRYING_FACTOR[month]);
  return Math.max(0, dc + 0.5 * drying);
};

export const deriveFwi = (ffmc: number, dmc: number, dc: number, windKmh: number) => {
  const fineFuelMoisture = 147.2 * (101 - ffmc) / (59.5 + ffmc);
  const windFunction = Math.exp(0.05039 * Math.max(0, windKmh));
  const fuelFunction = 91.9 * Math.exp(-0.1386 * fineFuelMoisture)
    * (1 + fineFuelMoisture ** 5.31 / 49_300_000);
  const isi = 0.208 * windFunction * fuelFunction;
  const denominator = dmc + 0.4 * dc;
  const bui = denominator <= 0 ? 0 : Math.max(0, dmc <= 0.4 * dc
    ? 0.8 * dmc * dc / denominator
    : dmc - (1 - 0.8 * dc / denominator) * (0.92 + (0.0114 * dmc) ** 1.7));
  const droughtFunction = bui <= 80
    ? 0.626 * bui ** 0.809 + 2
    : 1000 / (25 + 108.64 * Math.exp(-0.023 * bui));
  const initialSpread = 0.1 * isi * droughtFunction;
  const fwi = initialSpread <= 1
    ? initialSpread
    : Math.exp(2.72 * (0.434 * Math.log(initialSpread)) ** 0.647);
  return { isi, bui, fwi };
};

// The Canadian system is stateful. Replaying local-noon observations gives the
// fuel-moisture codes time to respond to recent rain instead of treating the
// number of dry forecast days as drought history.
export const calculateCanadianFwi = (
  weather: CanadianFwiWeatherData,
  targetTime = weather.current?.time,
): CanadianFwiResult | null => {
  const hourly = weather.hourly;
  const times = hourly?.time ?? [];
  if (!targetTime || !times.length) return null;

  const targetHour = targetTime.slice(0, 13);
  const observations = times
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.slice(11, 13) === '12' && time.slice(0, 13) <= targetHour);
  if (!observations.length) return null;

  let ffmc = 85;
  let dmc = 6;
  let dc = 15;
  let lastResult: CanadianFwiResult | null = null;

  for (const { time, index } of observations) {
    const temperature = hourly?.temperature_2m?.[index];
    const humidity = hourly?.relative_humidity_2m?.[index];
    const windKmh = hourly?.wind_speed_10m?.[index];
    if (![temperature, humidity, windKmh].every(Number.isFinite)) continue;

    const rainMm = (hourly?.precipitation ?? [])
      .slice(Math.max(0, index - 23), index + 1)
      .reduce((sum, value) => sum + (Number.isFinite(value) ? Math.max(0, value) : 0), 0);
    const month = clamp(Number(time.slice(5, 7)) - 1, 0, 11);
    ffmc = updateFfmc(ffmc, temperature!, humidity!, windKmh!, rainMm);
    dmc = updateDmc(dmc, temperature!, humidity!, rainMm, month);
    dc = updateDc(dc, temperature!, rainMm, month);
    const derived = deriveFwi(ffmc, dmc, dc, windKmh!);
    lastResult = { ffmc, dmc, dc, ...derived, observationTime: time, observationCount: observations.length };
  }

  return lastResult;
};
