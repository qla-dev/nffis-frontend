import { csrfHeaders } from '../lib/auth/session';
import { API_BASE_URL } from './api';
import { AWS_DATASET_UPDATED_EVENT } from './awsCurrentService';

export interface AwsUploadPreview {
  groups: Array<{ name: string; count: number }>;
  total: number;
}

const GROUPS = ['all', 'precipitation', 'agro', 'meteo', 'airQuality', 'stations'] as const;
const VALUE_FIELDS = ['tempC', 'humidityPct', 'precipMm', 'pressureHpa', 'windSpeedMs', 'windDir'];

export async function inspectAwsFile(file: File): Promise<AwsUploadPreview> {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension !== 'json' && extension !== 'csv' && extension !== 'dat') throw new Error('Only AWS JSON, CSV and DAT files are supported.');
  if (file.size > 10 * 1024 * 1024) throw new Error('The AWS file must be 10 MB or smaller.');
  if (extension === 'csv' || extension === 'dat') {
    const contents = await file.text();
    const firstLine = contents.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, '');
    if (extension === 'dat' || firstLine.toLowerCase().startsWith('date/time;')) {
      const headers = firstLine.split(';');
      if (extension === 'csv' && (headers.length < 2 || headers.slice(1).some((name) => !name.trim()))) {
        throw new Error('The CSV needs date/time followed by sensor columns.');
      }
      if (extension === 'dat' && (headers.length < 8 || !headers[5] || !/^\d+$/.test(headers[7]))) {
        throw new Error('The DAT header does not identify a station and sensor.');
      }
      const count = contents.split(/\r?\n/).slice(1).filter((line) => line.trim()).length;
      if (!count) throw new Error('The AWS file has no observations.');
      return { groups: [{ name: 'Unclassified sensor readings', count: count * (extension === 'csv' ? headers.length - 1 : 1) }], total: count * (extension === 'csv' ? headers.length - 1 : 1) };
    }
    if (firstLine.toLowerCase().startsWith('station;datetime;')) {
      const headers = firstLine.split(';');
      const allowed = ['station', 'datetime', 'precipitation', 'temperature', 'humidity', 'wind_speed'];
      if (headers.some((name) => !allowed.includes(name)) || !headers.includes('station') || !headers.includes('datetime')) {
        throw new Error('FHMZ CSV columns differ from the expected station, datetime and measurement columns.');
      }
      const count = contents.split(/\r?\n/).slice(1).filter((line) => line.trim()).length;
      if (!count) throw new Error('The CSV file has no observations.');
      return { groups: [{ name: 'FHMZ station rows', count }], total: count };
    }
    const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const headers = firstLine.split(separator).map((value) => value.trim());
    const required = ['source', 'station_type', 'station', 'observed_at'];
    const allowed = [...required, ...VALUE_FIELDS, 'lat', 'lon'];
    const missing = required.filter((name) => !headers.includes(name));
    const unsupported = headers.filter((name) => !allowed.includes(name));
    if (missing.length || unsupported.length || !headers.some((name) => VALUE_FIELDS.includes(name))) {
      throw new Error(`CSV columns differ from the AWS format. Missing: ${missing.join(', ') || 'none'}. Unsupported: ${unsupported.join(', ') || 'none'}.`);
    }
    const count = contents.split(/\r?\n/).slice(1).filter((line) => line.trim()).length;
    if (!count) throw new Error('The CSV file has no observations.');
    return { groups: [{ name: 'CSV observations', count }], total: count };
  }
  let payload: unknown;
  try { payload = JSON.parse(await file.text()); } catch { throw new Error('The file is not valid JSON.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('The AWS file must contain a JSON object.');
  const data = payload as Record<string, unknown>;
  const groups = GROUPS.filter((name) => Array.isArray(data[name])).map((name) => ({ name, count: (data[name] as unknown[]).length }));
  if (!groups.length || groups.every((group) => group.count === 0)) throw new Error('No recognized AWS station group was found.');
  for (const group of groups) {
    for (const station of data[group.name] as unknown[]) {
      if (!station || typeof station !== 'object' || Array.isArray(station)) throw new Error(`${group.name} contains an invalid station.`);
      const record = station as Record<string, unknown>;
      const key = record.city ?? record.station ?? record.name;
      if (typeof key !== 'string' || !key.trim() || !['meteo', 'agro', 'precipitation', 'air_quality'].includes(String(record.type)) || !VALUE_FIELDS.some((field) => field in record)) {
        throw new Error(`${group.name} contains a station without a name, type or AWS value.`);
      }
      if (group.name === 'stations' && (!Number.isFinite(Number(record.lat)) || !Number.isFinite(Number(record.lon)) || record.lat == null || record.lon == null)) {
        throw new Error('RS stations need latitude and longitude.');
      }
    }
  }
  return { groups, total: groups.reduce((sum, group) => sum + group.count, 0) };
}

export async function uploadAwsFile(file: File): Promise<{ history_id: number; updated_at?: string; history_records?: number }> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_BASE_URL}/aws/upload`, {
    method: 'POST', credentials: 'include',
    headers: { Accept: 'application/json', ...await csrfHeaders() }, body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `AWS upload failed (${response.status}).`);
  window.dispatchEvent(new Event(AWS_DATASET_UPDATED_EVENT));
  return payload;
}
