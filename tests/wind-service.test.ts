import { describe, expect, it, vi } from 'vitest';
import { fetchWindGrid, WIND_REFRESH_MS } from '../services/windService';

describe('live wind service', () => {
  it('builds a leaflet-velocity u/v grid from Open-Meteo points', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const count = url.searchParams.get('latitude')!.split(',').length;
      const points = Array.from({ length: count }, (_, index) => ({
        current: index === 1
          ? { time: '2026-08-24T12:00', wind_speed_10m: null, wind_direction_10m: null }
          : { time: '2026-08-24T12:00', wind_speed_10m: 10, wind_direction_10m: 90 },
      }));
      return new Response(JSON.stringify(points), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const [u, v] = await fetchWindGrid();
    expect(WIND_REFRESH_MS).toBe(600_000);
    expect(u.header).toMatchObject({ parameterNumber: 2, parameterNumberName: 'eastward_wind', parameterUnit: 'm.s-1' });
    expect(v.header).toMatchObject({ parameterNumber: 3, parameterNumberName: 'northward_wind' });
    expect(u.data[0]).toBe(-10);
    expect(v.data[0]).toBeCloseTo(0);
    expect(u.data[1]).toBe(0);
    expect(u.data).toHaveLength(Number(u.header.nx) * Number(u.header.ny));
  });

  it('rejects API errors and incomplete point grids', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })));
    await expect(fetchWindGrid()).rejects.toThrow('503');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([{ current: {} }]), { status: 200 })));
    await expect(fetchWindGrid()).rejects.toThrow(/returned 1 points, expected/);
  });
});
