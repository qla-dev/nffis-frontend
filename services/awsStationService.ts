import { csrfHeaders } from '../lib/auth/session';

export type AwsStationSource = 'fbih' | 'rs';

export interface AwsStationValues {
  tempC?: number | null;
  humidityPct?: number | null;
  precipMm?: number | null;
  pressureHpa?: number | null;
  windSpeedMs?: number | null;
  windDir?: string | number | null;
}

export interface AwsStationAdjustment {
  id: number;
  source: AwsStationSource;
  station_key: string;
  station_type: string;
  values: AwsStationValues;
  adjusted_by: number;
  adjusted_at: string;
}

export interface AwsStationHistoryEntry {
  id: number;
  previous_values: AwsStationValues | null;
  values: AwsStationValues;
  changed_fields: Array<keyof AwsStationValues>;
  origin: 'manual' | 'import';
  recorded_at: string;
  changed_by: { id: number; name: string; username: string } | null;
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json();
    const validation = Object.values(payload?.errors ?? {}).flat().find((item) => typeof item === 'string');
    return new Error(typeof validation === 'string' ? validation : payload?.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export function awsStationIdentity(source: AwsStationSource, stationType: string, stationKey: string): string {
  return `${source}|${stationType}|${stationKey}`;
}

export async function fetchAwsStationAdjustments(signal?: AbortSignal): Promise<AwsStationAdjustment[]> {
  const response = await fetch('/api/aws/stations/adjustments', {
    credentials: 'include', headers: { Accept: 'application/json' }, signal,
  });
  if (!response.ok) throw await responseError(response, 'Station adjustments are unavailable.');
  const payload = await response.json() as { data?: AwsStationAdjustment[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function adjustAwsStation(source: AwsStationSource, stationType: string, stationKey: string, values: AwsStationValues, baseline: AwsStationValues): Promise<AwsStationAdjustment> {
  const csrf = await csrfHeaders();
  const response = await fetch(`/api/aws/stations/${encodeURIComponent(stationKey)}`, {
    method: 'PATCH', credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...csrf },
    body: JSON.stringify({ source, station_type: stationType, values, baseline }),
  });
  if (!response.ok) throw await responseError(response, 'Station values could not be updated.');
  return ((await response.json()) as { data: AwsStationAdjustment }).data;
}

export async function fetchAwsStationHistory(source: AwsStationSource, stationType: string, stationKey: string, signal?: AbortSignal): Promise<AwsStationHistoryEntry[]> {
  const params = new URLSearchParams({ source, station_type: stationType });
  const response = await fetch(`/api/aws/stations/${encodeURIComponent(stationKey)}/history?${params}`, {
    credentials: 'include', headers: { Accept: 'application/json' }, signal,
  });
  if (!response.ok) throw await responseError(response, 'Station history is unavailable.');
  const payload = await response.json() as { data?: AwsStationHistoryEntry[] };
  return Array.isArray(payload.data) ? payload.data : [];
}
