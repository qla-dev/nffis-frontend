import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/api', () => ({ API_BASE_URL: 'https://api.nffis.com:81/api' }));

import { scrape, fhmzRealDummyData } from '../AWSFBiHData';
import { scrapeRs } from '../AWSRsData';

describe('AWS feeds on the deployed frontend', () => {
  it('requests both feeds from the API host with session credentials', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.nffis.com:81/api/aws') return { ok: false, status: 404 };
      if (url === 'https://api.nffis.com:81/api/weather-stations/fbih') return {
        ok: true, text: async () => '<table><tr><td>12:00</td><td>Kupres</td><td>12</td><td>60</td><td>3</td></tr></table>',
      };
      if (url === 'https://api.nffis.com:81/api/weather-stations/rs') return {
        ok: true, json: async () => ({ countries: { country: [{ '@name': 'Bosnia', location_id: [{
          name: 'Banja Luka', lat: '44.82', lon: '17.21',
          observations: { observation: [{ temperature: '18' }] },
        }] }] } }),
      };
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await scrape()).precipitation).toMatchObject([{ city: 'Kupres', precipMm: 3 }]);
    expect((await scrapeRs()).stations).toMatchObject([{ name: 'Banja Luka', tempC: 18 }]);
    for (const region of ['fbih', 'rs']) {
      expect(fetchMock).toHaveBeenCalledWith(`https://api.nffis.com:81/api/weather-stations/${region}`,
        expect.objectContaining({ credentials: 'include' }));
    }
  });

  it('does not accept an HTML app shell as an empty station feed', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/aws')
      ? { ok: false, status: 404 }
      : { ok: true, text: async () => '<html><body><div id="root"></div></body></html>' }));
    expect((await scrape()).precipitation).toEqual(fhmzRealDummyData.precipitation);
  });
});
