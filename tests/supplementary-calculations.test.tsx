import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import reference from './fixtures/supplementary-worker-reference.json';
import { calculateAngstrom, calculateGfdi, calculateKbdi, inspectSupplementaryWeather, type SupplementaryInputs } from '../lib/fwi/supplementaryCalculations';
import { SupplementaryIndexCalculations } from '../components/Map/SupplementaryIndexCalculations';

const inputs: SupplementaryInputs = { temperature13C: 30, humidity13Pct: 30, noonTemperatureC: 30, noonHumidityPct: 20, noonWindKmh: 20, curingPct: 100, rain24hMm: 0, maximumTemperatureC: 30, previousKbdiMm: 100, runoffRemainingMm: 5.08, annualRainfallMm: 1250, replayedDays: 29 };
describe('supplementary calculator compatibility with the Python raster worker', () => {
  it('matches Python reference values, metric units, rain interception and state bounds', () => {
    for (const item of reference.angstrom) expect(calculateAngstrom(...item.inputs as [number, number])).toBeCloseTo(item.value, 9);
    for (const item of reference.gfdi) expect(calculateGfdi(...item.inputs as [number, number, number, number])).toBeCloseTo(item.value, 9);
    for (const item of reference.kbdi) {
      const result = calculateKbdi(...item.inputs as [number, number, number, number, number])!;
      expect(result.kbdi).toBeCloseTo(item.value, 9);
      expect(result.runoffRemainingMm).toBeCloseTo(item.remaining, 9);
    }
  });
  it('does not replace missing or invalid weather and state values with zero', () => {
    expect(calculateAngstrom(null, 20)).toBeNull();
    expect(calculateGfdi(30, 101, 20, 100)).toBeNull();
    expect(calculateGfdi(30, 20, 20, -1)).toBeNull();
    expect(calculateKbdi(100, 30, null, 1250, 5.08)).toBeNull();
    expect(calculateKbdi(204, 30, 0, 1250, 5.08)).toBeNull();
  });
  it('loads 13:00 Angström, noon GFDI, full rainfall, monthly curing and daily maximum', () => {
    const time = Array.from({ length: 72 }, (_, i) => `2026-08-${String(8 + Math.floor(i / 24)).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00`);
    const rain = Array(72).fill(0), temperature = Array(72).fill(20), humidity = Array(72).fill(40);
    rain[36] = 100; rain[37] = 6; rain[47] = 3; rain[48] = 2; rain[60] = 4; rain[61] = 200;
    temperature[60] = 30; temperature[61] = 35; humidity[61] = 25;
    const result = inspectSupplementaryWeather({ hourly: { time, temperature_2m: temperature, relative_humidity_2m: humidity, wind_speed_10m: Array(72).fill(15), precipitation: rain } }, '2026-08-10', { mean_annual_rainfall_mm: 800, grass_curing_percent_by_month: Array(12).fill(55) });
    expect(result).toMatchObject({ temperature13C: 35, humidity13Pct: 25, noonTemperatureC: 30, maximumTemperatureC: 35, rain24hMm: 15, curingPct: 55, annualRainfallMm: 800, replayedDays: 1 });
    temperature[58] = Number.NaN;
    expect(inspectSupplementaryWeather({ hourly: { time, temperature_2m: temperature } }, '2026-08-10').maximumTemperatureC).toBeNull();
  });
  it('edits the rainfall scenario, displays its water balance and resets loaded values', () => {
    render(<SupplementaryIndexCalculations inputs={inputs} date="2026-08-10" />);
    const kbdi = () => within(screen.getByRole('table', { name: 'Daily supplementary index results' })).getByRole('row', { name: /KBDI/ }).textContent;
    const original = kbdi();
    fireEvent.change(screen.getByLabelText('Supplementary Noon-to-noon rainfall (mm)'), { target: { value: '50' } });
    expect(kbdi()).not.toBe(original);
    expect(within(screen.getByRole('table', { name: 'KBDI calculation steps', hidden: true })).getByText('44.920')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reset supplementary inputs'));
    expect(kbdi()).toBe(original);
    fireEvent.change(screen.getByLabelText('Supplementary 13:00 humidity (%)'), { target: { value: '101' } });
    expect(screen.getByRole('row', { name: /Angström/ })).toHaveTextContent('—');
  });
});
