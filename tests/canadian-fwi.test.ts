import { describe, expect, it } from 'vitest';
import { calculateCanadianFwi, deriveFwi, updateDc, updateDmc, updateFfmc } from '../lib/fwi/canadianFwi';

describe('Canadian FWI calculation', () => {
  it('keeps every component finite and within its physical range', () => {
    const ffmc = updateFfmc(85, 30, 25, 20, 0);
    const dmc = updateDmc(6, 30, 25, 0, 6);
    const dc = updateDc(15, 30, 0, 6);
    const result = deriveFwi(ffmc, dmc, dc, 20);

    expect(ffmc).toBeGreaterThan(85);
    expect(ffmc).toBeLessThanOrEqual(101);
    expect(dmc).toBeGreaterThan(6);
    expect(dc).toBeGreaterThan(15);
    expect(result.fwi).toBeGreaterThan(0);
    Object.values(result).forEach(value => expect(Number.isFinite(value)).toBe(true));
  });

  it('replays recent weather and makes sustained dry heat riskier than wet weather', () => {
    const makeWeather = (rain: number, humidity: number) => {
      const time: string[] = [];
      const temperature: number[] = [];
      const relative_humidity_2m: number[] = [];
      const wind_speed_10m: number[] = [];
      const precipitation: number[] = [];
      for (let day = 1; day <= 20; day += 1) {
        for (let hour = 0; hour < 24; hour += 1) {
          time.push(`2026-07-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`);
          temperature.push(hour === 12 ? 32 : 24);
          relative_humidity_2m.push(humidity);
          wind_speed_10m.push(18);
          precipitation.push(hour === 6 ? rain : 0);
        }
      }
      return { current: { time: '2026-07-20T16:00' }, hourly: { time, temperature_2m: temperature, relative_humidity_2m, wind_speed_10m, precipitation } };
    };

    const dry = calculateCanadianFwi(makeWeather(0, 25));
    const wet = calculateCanadianFwi(makeWeather(8, 80));
    expect(dry).not.toBeNull();
    expect(wet).not.toBeNull();
    expect(dry!.observationCount).toBe(20);
    expect(dry!.fwi).toBeGreaterThan(wet!.fwi);
    expect(dry!.fwi).toBeGreaterThan(11.2);
  });
});
