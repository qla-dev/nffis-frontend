import type { OpenMeteoResponse } from '../types';
import { apiRequest } from './api';

export function fetchLocationWeather(latitude: number, longitude: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  return apiRequest<{ data: OpenMeteoResponse; stale: boolean }>(`/weather/location?${query}`, { signal });
}
