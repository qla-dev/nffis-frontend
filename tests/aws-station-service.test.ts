import { beforeEach, describe, expect, it, vi } from 'vitest';

const { csrfHeaders } = vi.hoisted(() => ({ csrfHeaders: vi.fn() }));
vi.mock('../lib/auth/session', () => ({ csrfHeaders }));

import {
  adjustAwsStation,
  awsStationIdentity,
  fetchAwsStationAdjustments,
  fetchAwsStationHistory,
} from '../services/awsStationService';

describe('AWS station service', () => {
  beforeEach(() => csrfHeaders.mockResolvedValue({ 'X-XSRF-TOKEN': 'csrf' }));

  it('builds stable station identities', () => {
    expect(awsStationIdentity('fbih', 'meteo', 'Sarajevo')).toBe('fbih|meteo|Sarajevo');
  });

  it('loads current adjustments and safely handles a missing data array', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 1 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAwsStationAdjustments()).resolves.toEqual([{ id: 1 }]);
    await expect(fetchAwsStationAdjustments()).resolves.toEqual([]);
  });

  it('updates every supplied station field with baseline and CSRF data', async () => {
    const values = { tempC: 19.5, humidityPct: 70, precipMm: 2, pressureHpa: 1008, windSpeedMs: 3.4, windDir: 'NW' };
    const baseline = { tempC: 18, humidityPct: 65 };
    const saved = { id: 9, source: 'fbih', station_key: 'Šeherdžik', station_type: 'precipitation', values };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: saved }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(adjustAwsStation('fbih', 'precipitation', 'Šeherdžik', values, baseline)).resolves.toEqual(saved);
    expect(fetchMock).toHaveBeenCalledWith('/api/aws/stations/%C5%A0eherd%C5%BEik', expect.objectContaining({
      method: 'PATCH',
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf' }),
      body: JSON.stringify({ source: 'fbih', station_type: 'precipitation', values, baseline }),
    }));
  });

  it('loads encoded station history and surfaces backend validation errors', async () => {
    const entry = { id: 1, changed_fields: ['tempC'], values: { tempC: 20 }, origin: 'manual' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [entry] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAwsStationHistory('rs', 'meteo', 'Banja Luka')).resolves.toEqual([entry]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/aws/stations/Banja%20Luka/history?source=rs&station_type=meteo');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: { values: ['Temperature is invalid.'] },
    }), { status: 422 })));
    await expect(fetchAwsStationHistory('rs', 'meteo', 'x')).rejects.toThrow('Temperature is invalid.');
  });
});
