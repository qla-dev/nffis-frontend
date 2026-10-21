import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrape as scrapeFbih } from '../AWSFBiHData';
import { scrapeRs } from '../AWSRsData';

const raw = { type: 'unclassified', station: 'Tuzla', sensorValues: { temperature: 10 }, observedAtLocal: '2024-12-09T13:56:00' };
function mockSources(data: Record<string, unknown>, failFeed = false, failUpload = false) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/api/aws') {
      if (failUpload) throw new Error('Upload unavailable');
      return { ok: true, status: 200, json: async () => ({ data, uploaded_by_name: 'Station uploader' }) };
    }
    if (failFeed) throw new Error('Feed unavailable');
    if (url.endsWith('/fbih')) return { ok: true, text: async () => `
      <table><tr><td>12:00</td><td>Rain station</td><td>12</td><td>60</td><td>3</td></tr></table>
      <table><tr><td>12:00</td><td>Agro station</td><td>N</td><td>2</td><td>1000</td><td>15</td><td>50</td><td>0</td></tr></table>
      <table><tr><td>09.10.2026</td><td>12:00</td><td>Tuzla</td><td>N</td><td>2</td><td>1000</td><td>16</td><td>50</td><td>0</td></tr></table>` };
    return { ok: true, json: async () => ({ countries: { country: [{ '@name': 'Bosnia', location_id: [
      { name: 'Banja Luka', lat: '44.82', lon: '17.21', observations: { observation: [{ temperature: '18' }] } },
    ] }] } }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('AWS feeds alongside uploaded map data', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserves all original categories and RS stations when a raw dataset is uploaded', async () => {
    mockSources({ all: [raw], stations: [] });
    const fbih = await scrapeFbih();
    expect(fbih.precipitation).toHaveLength(1);
    expect(fbih.agro).toHaveLength(1);
    expect(fbih.meteo).toHaveLength(1);
    expect(fbih.all).toHaveLength(4);
    expect(fbih.all.find(s => s.type === 'unclassified')).toMatchObject({ station: 'Tuzla', uploadedByName: 'Station uploader' });
    expect((await scrapeRs()).stations).toMatchObject([{ name: 'Banja Luka', tempC: 18 }]);
  });

  it('lets matching typed uploads override measurements without removing other feed categories', async () => {
    mockSources({ meteo: [{ type: 'meteo', station: 'Tuzla', tempC: 20 }], stations: [{ type: 'meteo', name: 'Banja Luka', lat: 44.82, lon: 17.21, tempC: 21 }] });
    const fbih = await scrapeFbih();
    expect(fbih.meteo).toMatchObject([{ station: 'Tuzla', tempC: 20 }]);
    expect(fbih.precipitation).toHaveLength(1);
    expect(fbih.agro).toHaveLength(1);
    expect((await scrapeRs()).stations).toMatchObject([{ name: 'Banja Luka', tempC: 21 }]);
  });

  it('preserves the existing feed fallback and uploaded raw stations when feeds fail', async () => {
    mockSources({ all: [raw] }, true);
    const fbih = await scrapeFbih();
    expect(fbih.precipitation.length).toBeGreaterThan(0);
    expect(fbih.agro.length).toBeGreaterThan(0);
    expect(fbih.meteo.length).toBeGreaterThan(0);
    expect(fbih.all.some(s => s.type === 'unclassified')).toBe(true);
    expect((await scrapeRs()).stations.length).toBeGreaterThan(0);
  });

  it('still loads the original feeds when the uploaded dataset request fails', async () => {
    mockSources({}, false, true);
    expect((await scrapeFbih()).meteo).toMatchObject([{ station: 'Tuzla', tempC: 16 }]);
    expect((await scrapeRs()).stations).toMatchObject([{ name: 'Banja Luka', tempC: 18 }]);
  });
});
