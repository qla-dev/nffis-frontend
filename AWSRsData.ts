// ─── Types ───────────────────────────────────────────────────────────────────

export interface RsStation {
  type: 'meteo';
  name: string;
  lat: number;
  lon: number;
  tempC: number | null;
  pressureHpa: number | null;
  windSpeedMs: number | null;
  windDir: number | null;
  humidityPct: number | null;
}

export interface RsScrapedData {
  scrapedAt: string;
  stations: RsStation[];
}

// ─── Dummy data (Bosnia stations from RS RHMZ API, 2026-05-15) ───────────────

export const rsAwsDummyData: RsScrapedData = {
  scrapedAt: '2026-05-15T18:00:00.000Z',
  stations: [
    { type: 'meteo', name: 'Kozarska Dubica', lat: 45.05, lon: 16.38, tempC: 20, pressureHpa: 1002, windSpeedMs: 0, windDir: 0, humidityPct: 44 },
    { type: 'meteo', name: 'Prijedor', lat: 44.98, lon: 16.72, tempC: 19, pressureHpa: 1000, windSpeedMs: 1, windDir: 180, humidityPct: 56 },
    { type: 'meteo', name: 'Gradiška', lat: 45.15, lon: 17.25, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Banja Luka', lat: 44.82, lon: 17.21, tempC: 20, pressureHpa: 1001, windSpeedMs: 2, windDir: 160, humidityPct: 55 },
    { type: 'meteo', name: 'Doboj', lat: 44.74, lon: 18.09, tempC: 21, pressureHpa: 1002, windSpeedMs: 2, windDir: 200, humidityPct: 50 },
    { type: 'meteo', name: 'Brčko RS', lat: 44.87, lon: 18.81, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Bijeljina', lat: 44.76, lon: 19.20, tempC: 18, pressureHpa: 1003, windSpeedMs: 2, windDir: 270, humidityPct: 67 },
    { type: 'meteo', name: 'Rudo', lat: 43.80, lon: 19.30, tempC: 22, pressureHpa: null, windSpeedMs: 1, windDir: 270, humidityPct: null },
    { type: 'meteo', name: 'Nevesinje', lat: 43.27, lon: 18.12, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Trebinje', lat: 42.71, lon: 18.34, tempC: 17, pressureHpa: 1005, windSpeedMs: 4, windDir: 230, humidityPct: 65 },
    { type: 'meteo', name: 'Zvornik', lat: 44.39, lon: 19.10, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Foča', lat: 43.52, lon: 18.79, tempC: 16, pressureHpa: null, windSpeedMs: 0, windDir: 0, humidityPct: 64 },
    { type: 'meteo', name: 'Modriča', lat: 45.00, lon: 17.91, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Rogatica', lat: 43.93, lon: 18.79, tempC: 14, pressureHpa: 1003, windSpeedMs: 4, windDir: 180, humidityPct: 57 },
    { type: 'meteo', name: 'Mrkonjić Grad', lat: 44.42, lon: 17.08, tempC: 16, pressureHpa: 1006, windSpeedMs: 5, windDir: 140, humidityPct: 50 },
    { type: 'meteo', name: 'Vlasenica', lat: 44.12, lon: 19.30, tempC: 20, pressureHpa: 1001, windSpeedMs: 5, windDir: 180, humidityPct: 48 },
    { type: 'meteo', name: 'Bileća', lat: 42.87, lon: 18.42, tempC: 16, pressureHpa: 1008, windSpeedMs: 4, windDir: 180, humidityPct: 66 },
    { type: 'meteo', name: 'Gacko', lat: 43.17, lon: 18.52, tempC: 10, pressureHpa: 840, windSpeedMs: 1, windDir: 180, humidityPct: 94 },
    { type: 'meteo', name: 'Han Pijesak', lat: 44.09, lon: 18.95, tempC: 13, pressureHpa: null, windSpeedMs: 12, windDir: 180, humidityPct: 68 },
    { type: 'meteo', name: 'Šipovo', lat: 44.41, lon: 16.82, tempC: 18, pressureHpa: 1002, windSpeedMs: 1, windDir: 230, humidityPct: 65 },
    { type: 'meteo', name: 'Drvar', lat: 44.51, lon: 16.47, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Omarska', lat: 44.98, lon: 16.85, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Čajniče', lat: 43.62, lon: 19.37, tempC: 18, pressureHpa: 1004, windSpeedMs: 2, windDir: 140, humidityPct: 53 },
    { type: 'meteo', name: 'Kalinovik', lat: 43.25, lon: 18.61, tempC: 7, pressureHpa: null, windSpeedMs: 3, windDir: 230, humidityPct: 96 },
    { type: 'meteo', name: 'Jezero', lat: 44.50, lon: 17.40, tempC: 14, pressureHpa: null, windSpeedMs: 2, windDir: 180, humidityPct: null },
    { type: 'meteo', name: 'Novi Grad', lat: 45.18, lon: 16.81, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Jablanica RS', lat: 43.50, lon: 18.45, tempC: 12, pressureHpa: null, windSpeedMs: 0, windDir: 0, humidityPct: 85 },
    { type: 'meteo', name: 'Srebrenica', lat: 43.80, lon: 19.00, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Glamoč RS', lat: 44.39, lon: 16.62, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
    { type: 'meteo', name: 'Kostajnica', lat: 45.11, lon: 16.74, tempC: null, pressureHpa: null, windSpeedMs: null, windDir: null, humidityPct: null },
  ]
};

// ─── Scraper ─────────────────────────────────────────────────────────────────

const RS_API_URL = 'https://rhmzrs.com/data/feeds/pointweather.json';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '' || v === 'null') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (isNaN(n) || n === 999) return null;
  return n;
}

export async function scrapeRs(): Promise<RsScrapedData> {
  const url = CORS_PROXY + encodeURIComponent(RS_API_URL);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RHMZ RS fetch failed: HTTP ${res.status}`);

  const json = await res.json();
  const countries: any[] = json?.countries?.country ?? [];
  const bosniaCountry = countries.find((c: any) => c['@name'] === 'Bosnia');
  if (!bosniaCountry) return { scrapedAt: new Date().toISOString(), stations: [] };

  const locations: any[] = Array.isArray(bosniaCountry.location_id)
    ? bosniaCountry.location_id
    : [bosniaCountry.location_id];

  const stations: RsStation[] = locations
    .filter((loc: any) => loc.lat && loc.lat !== '0' && loc.lon && loc.lon !== '0')
    .map((loc: any) => {
      const obsArr: any[] = Array.isArray(loc?.observations?.observation)
        ? loc.observations.observation
        : [];
      const latest = obsArr[obsArr.length - 1] ?? null;
      return {
        type: 'meteo' as const,
        name: loc.name ?? 'Unknown',
        lat: parseFloat(loc.lat),
        lon: parseFloat(loc.lon),
        tempC: latest ? parseNum(latest.temperature) : null,
        pressureHpa: latest ? parseNum(latest.mslp) : null,
        windSpeedMs: latest ? parseNum(latest.windspeed) : null,
        windDir: latest ? parseNum(latest.winddir) : null,
        humidityPct: latest ? parseNum(latest.humid) : null,
      };
    });

  return { scrapedAt: new Date().toISOString(), stations };
}
