import { beforeEach, describe, expect, it, vi } from 'vitest';

const { csrfHeaders } = vi.hoisted(() => ({ csrfHeaders: vi.fn() }));
vi.mock('../lib/auth/session', () => ({ csrfHeaders }));

import { createIncidentReport, fetchReportStatistics } from '../services/reportStatisticsService';

describe('report and statistics service', () => {
  beforeEach(() => csrfHeaders.mockResolvedValue({ 'X-XSRF-TOKEN': 'csrf' }));

  it('submits an incident with CSRF credentials', async () => {
    const payload = {
      incident_type: 'fire', description: 'Smoke seen', latitude: 43.8, longitude: 18.3,
      reported_at: '2026-08-24T12:00:00Z', temperature_c: 32,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 44, ...payload } }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createIncidentReport(payload)).resolves.toMatchObject({ id: 44, description: 'Smoke seen' });
    expect(fetchMock).toHaveBeenCalledWith('/api/reports', expect.objectContaining({
      method: 'POST', body: JSON.stringify(payload), credentials: 'include',
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf' }),
    }));
  });

  it.each([
    [403, 'permission'],
    [422, 'invalid data'],
    [500, 'could not be submitted'],
  ])('maps report submission status %s to a useful message', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
    await expect(createIncidentReport({
      incident_type: 'fire', description: 'x', latitude: 1, longitude: 2, reported_at: 'now',
    })).rejects.toThrow(message);
  });

  it('applies date filters and normalizes missing statistics arrays', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ total: '3' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await expect(fetchReportStatistics({ from: '2026-08-01', to: '2026-08-24' }, controller.signal)).resolves.toEqual({
      total: 3, by_incident_type: [], daily: [], by_weather_condition: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reports/statistics?from=2026-08-01&to=2026-08-24',
      expect.objectContaining({ signal: controller.signal, credentials: 'include' }),
    );
  });

  it('distinguishes missing statistics permission from a service outage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 403 })));
    await expect(fetchReportStatistics()).rejects.toThrow('permission');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })));
    await expect(fetchReportStatistics()).rejects.toThrow('unavailable');
  });
});
