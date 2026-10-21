import { apiRequest } from './api';

export interface TimeSeriesDate { date: string; product_id?: number; mean?: number | null; count?: number; title?: string }
export interface TimeSeriesLayer {
  key: string;
  label: { en: string; bs: string };
  type: 'raster' | 'points';
  group: 'fire_danger' | 'vegetation' | 'detections';
  scale?: string;
  min?: number;
  max?: number;
  dates: TimeSeriesDate[];
}

export function fetchTimeSeriesCatalogue(days = 365, signal?: AbortSignal) {
  return apiRequest<{ data: TimeSeriesLayer[]; meta: { date_from: string; date_to: string; timezone: string } }>(`/time-series?days=${days}`, { signal, cache: 'no-store' });
}

export function fetchHotspotsForDate(date: string, signal?: AbortSignal) {
  return apiRequest<GeoJSON.FeatureCollection<GeoJSON.Point, { id: number; source: string; sensor: string | null; detected_at: string; frp: number | null; confidence: number | null; jurisdiction: string }>>(`/time-series/hotspots?date=${date}`, { signal });
}

/** URL of the raster shown for a layer on one date (daily index product or archived raster). */
export function timeSeriesRasterUrl(layer: TimeSeriesLayer, entry: TimeSeriesDate): string | null {
  if (layer.group === 'fire_danger' && entry.product_id) return `/api/fire-intelligence/products/${entry.product_id}/artifact/cog`;
  if (layer.group === 'vegetation') return `/api/time-series/${layer.key}/${entry.date}/raster`;
  return null;
}
