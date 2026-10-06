import { describe, expect, it } from 'vitest';
import { inspectAwsFile } from '../services/awsUploadService';

describe('AWS upload inspection', () => {
  it('previews station JSON accepted by the existing import format', async () => {
    const file = new File([JSON.stringify({ scrapedAt: '2026-10-02T00:00:00Z', meteo: [{ type: 'meteo', city: 'Test', tempC: 12 }] })], 'stations.json', { type: 'application/json' });
    await expect(inspectAwsFile(file)).resolves.toEqual({ groups: [{ name: 'meteo', count: 1 }], total: 1 });
  });

  it('previews the supplied Stolac sensor CSV without assigning units', async () => {
    const file = new File(['date/time;mp_stolac_1;mp_stolac_3\n19.11.2024 0:00;9,960;0,000'], 'mp_stolac_1.csv', { type: 'text/csv' });
    await expect(inspectAwsFile(file)).resolves.toEqual({ groups: [{ name: 'Unclassified sensor readings', count: 2 }], total: 2 });
  });

  it('previews the supplied DAT sensor format', async () => {
    const file = new File([';;;;;mp_stolac;;0001\n19.11.2024;0:00;9,960'], 'mp_stolac_1.dat');
    await expect(inspectAwsFile(file)).resolves.toEqual({ groups: [{ name: 'Unclassified sensor readings', count: 1 }], total: 1 });
  });

  it('previews the multi-station FHMZ CSV', async () => {
    const file = new File(['station;datetime;precipitation;temperature;humidity;wind_speed\nTuzla;202412080000;0.0;-0.9;100.0;1.1\nUstikolina;202412080000;0.0;1.0;98.0;---'], 'fhmz4nffis_202412091356.csv', { type: 'text/csv' });
    await expect(inspectAwsFile(file)).resolves.toEqual({ groups: [{ name: 'FHMZ station rows', count: 2 }], total: 2 });
  });

  it('accepts CSV with named measurements and an observation timestamp', async () => {
    const file = new File(['source;station_type;station;observed_at;tempC\nfbih;meteo;Stolac;2024-11-19T10:00:00+01:00;11,380'], 'stolac.csv', { type: 'text/csv' });
    await expect(inspectAwsFile(file)).resolves.toEqual({ groups: [{ name: 'CSV observations', count: 1 }], total: 1 });
  });
});
