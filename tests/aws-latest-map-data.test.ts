import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scrape as scrapeFbih } from '../AWSFBiHData';
import { scrapeRs } from '../AWSRsData';

describe('latest uploaded AWS map data', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses the newest stored JSON instead of external feeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ history_id: 2, updated_at: '2026-10-02T10:00:00Z', data: {
        scrapedAt: '2026-10-02T09:00:00Z',
        meteo: [{ type: 'meteo', station: 'Test FBiH', tempC: 17 }],
        stations: [{ type: 'meteo', name: 'Test RS', lat: 44, lon: 18, tempC: 16 }],
      } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    expect((await scrapeFbih()).all[0]).toMatchObject({ station: 'Test FBiH', tempC: 17 });
    expect((await scrapeRs()).stations[0]).toMatchObject({ name: 'Test RS', tempC: 16 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(([url]) => url === '/api/aws')).toBe(true);
  });

  it('keeps unclassified channels and uploader attribution from the latest file', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ history_id: 3, updated_at: '2026-10-02T10:00:00Z', uploaded_by_name: 'Station uploader', data: {
        all: [{ type: 'unclassified', station: 'mp_stolac_1', observedAtLocal: '2024-11-20T00:00:00', sensorValues: { mp_stolac_1: 10.78, mp_stolac_3: 0 }, lat: 43.0753, lon: 17.954 }],
      } }),
    }));
    const station = (await scrapeFbih()).all[0];
    expect(station).toMatchObject({ type: 'unclassified', station: 'mp_stolac_1', uploadedByName: 'Station uploader' });
  });
});
