import { csrfHeaders } from '../lib/auth/session';
import { API_BASE_URL } from './api';

export interface StatisticsCountItem {
  label: string;
  count: number;
}

export interface StatisticsDailyItem {
  date: string;
  count: number;
}

export interface ReportStatistics {
  total: number;
  by_incident_type: StatisticsCountItem[];
  daily: StatisticsDailyItem[];
  by_weather_condition: StatisticsCountItem[];
}

export interface ReportStatisticsFilters {
  from?: string;
  to?: string;
}

export interface CreateReportPayload {
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  reported_at: string;
  weather_condition?: string;
  temperature_c?: number;
  feels_like_c?: number;
  pressure_hpa?: number;
  precipitation_mm?: number;
  cloud_cover_percent?: number;
  wind_speed_kmh?: number;
  wind_direction_degrees?: number;
  wind_gust_kmh?: number;
  humidity_percent?: number;
}

export interface CreatedReport extends CreateReportPayload {
  id: number;
}

export async function createIncidentReport(payload: CreateReportPayload): Promise<CreatedReport> {
  const csrf = await csrfHeaders();
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrf,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 403) throw new Error('You do not have permission to submit incident reports.');
    if (response.status === 422) throw new Error('The incident report contains invalid data.');
    throw new Error('The incident report could not be submitted.');
  }

  const responseBody = await response.json() as { data: CreatedReport };
  return responseBody.data;
}

export async function fetchReportStatistics(
  filters: ReportStatisticsFilters = {},
  signal?: AbortSignal,
): Promise<ReportStatistics> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/reports/statistics${query ? `?${query}` : ''}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to view report statistics.');
    }
    throw new Error('Report statistics are currently unavailable.');
  }

  const data = await response.json() as Partial<ReportStatistics>;

  return {
    total: Number(data.total ?? 0),
    by_incident_type: Array.isArray(data.by_incident_type) ? data.by_incident_type : [],
    daily: Array.isArray(data.daily) ? data.daily : [],
    by_weather_condition: Array.isArray(data.by_weather_condition) ? data.by_weather_condition : [],
  };
}
