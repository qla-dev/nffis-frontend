import { describe, expect, it } from 'vitest';
import { calculateBosnianFwi } from '../lib/fwi/bosnianFwi';
import { calculateCanadianFwi } from '../lib/fwi/canadianFwi';
import { inspectFwiWeather } from '../services/fwiCalculationService';

const weather = {
  current: { time: '2026-10-09T14:15' },
  hourly: { time: ['2026-10-08T12:00', '2026-10-09T12:00', '2026-10-09T14:00'], temperature_2m: [20, 25, 30], relative_humidity_2m: [50, 40, 20], wind_speed_10m: [10, 15, 20], precipitation: [0, 2, 0] },
  daily: { time: ['2026-10-08', '2026-10-09', '2026-10-10'], precipitation_sum: [2, 0, 0] },
};
describe('original Bosnian NFFIS calculation', () => {
  it('preserves original ISI and BUI estimates and the nonlinear FWI branch', () => {
    const result = calculateBosnianFwi({ temperatureC: 30, humidityPct: 20, windKmh: 20, dryDays: 10 })!;
    expect(result.isi).toBeCloseTo(5.6);
    expect(result.bui).toBeCloseTo(63.75);
    expect(result.initialSpread).toBeCloseTo(.1 * result.isi * result.droughtFunction);
    expect(result.fwi).toBeGreaterThan(result.initialSpread);
  });
  it('uses the high-BUI branch and returns zero with no wind', () => {
    const result = calculateBosnianFwi({ temperatureC: 25, humidityPct: 40, windKmh: 0, dryDays: 30 })!;
    expect(result.bui).toBeGreaterThan(80);
    expect(result.droughtFunction).toBeCloseTo(1000 / (25 + 108.64 * Math.exp(-.023 * result.bui)));
    expect(result.fwi).toBe(0);
  });
  it('rejects missing weather instead of treating it as zero', () => {
    expect(calculateBosnianFwi({ temperatureC: NaN, humidityPct: 20, windKmh: 20, dryDays: 10 })).toBeNull();
    expect(() => inspectFwiWeather({ ...weather, daily: { time: ['2026-10-09'], precipitation_sum: [null] } }, { date: '2026-10-09', historical: false })).toThrow('incomplete');
  });
  it('uses the selected hourly observation for the original current-day calculation', () => {
    const result = inspectFwiWeather(weather, { date: '2026-10-09', historical: false });
    expect(result.bosnian).toMatchObject({ temperatureC: 30, humidityPct: 20, windKmh: 20, dryDays: 2 });
    expect(result.precipitationDays.map(day => day.dry)).toEqual([false, true, true]);
  });
  it('compares the same current weather without applying the selected day twice to Canadian codes', () => {
    const result = inspectFwiWeather(weather, { date: '2026-10-09', historical: false });
    const prior = result.canadian!.steps[0];
    expect(result.comparisonInputs).toMatchObject({
      temperatureC: 30, humidityPct: 20, windKmh: 20, dryDays: 2, month: 10,
      previousFfmc: prior.ffmc, previousDmc: prior.dmc, previousDc: prior.dc,
      rainMm: null,
    });
  });
  it('uses exactly the trailing 24 hourly precipitation values for the comparison', () => {
    const times = Array.from({ length: 37 }, (_, index) => new Date(Date.UTC(2026, 9, 8, index)).toISOString().slice(0, 16));
    const result = inspectFwiWeather({
      hourly: { time: times, temperature_2m: times.map(() => 25), relative_humidity_2m: times.map(() => 40),
        wind_speed_10m: times.map(() => 15), precipitation: times.map((_, index) => index <= 12 ? 100 : 1) },
      daily: { time: ['2026-10-08', '2026-10-09'], precipitation_sum: [100, 12] },
    }, { date: '2026-10-09', historical: true });
    expect(result.comparisonInputs.rainMm).toBe(24);
  });
  it('replays Canadian noon observations with traceable previous moisture codes', () => {
    const result = calculateCanadianFwi(weather)!;
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]).toMatchObject({ previousFfmc: 85, previousDmc: 6, previousDc: 15 });
    expect(result.steps[1].previousFfmc).toBe(result.steps[0].ffmc);
    expect(result.steps[1].fwi).toBe(result.fwi);
    expect(result.fwi).not.toBeCloseTo(inspectFwiWeather(weather, { date: '2026-10-09', historical: false }).bosnian.fwi);
  });
});
