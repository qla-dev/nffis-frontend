import { apiRequest } from './api';
import type { FireIncidentReport } from '../lib/fireIncidentGroups';

export interface FireEventProperties {
  id: number;
  external_id: string;
  latitude: number;
  longitude: number;
  status: 'new' | 'intensified' | 'grew' | 'reignited' | 'corroborated' | 'extinguished' | string;
  is_active: boolean;
  confidence_level: 'unconfirmed_anomaly' | 'likely_fire' | 'high_confidence' | string;
  first_seen_at: string;
  last_seen_at: string;
  extinguished_at?: string | null;
  latest_frp?: number | null;
  peak_frp?: number | null;
  detection_count: number;
  extent_km: number;
  sources: string[];
  sensors: string[];
  weather?: { temp?: number; humidity?: number; speed?: number; gusts?: number; from?: string } | null;
  entity?: string | null;
  canton?: string | null;
  municipality?: string | null;
  management_area?: string | null;
  management_unit?: string | null;
  compartment?: string | null;
  sub_compartment?: string | null;
  forest_type?: string | null;
  protected_area?: string | null;
  nearest_road?: {
    layer_id?: number;
    layer?: string;
    source?: string;
    distance_m?: number;
    calculated_at?: string;
    properties?: Record<string, unknown>;
  } | null;
}

export type FireFeature = GeoJSON.Feature<GeoJSON.Point, FireEventProperties>;
export type FireFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, FireEventProperties>;

export interface FireStatistics {
  active_events: number; new_last_hour: number; new_last_24h: number; high_priority: number;
  extinguished_last_24h: number; highest_current_frp: number; recently_changed: number;
  by_canton: { label: string; count: number }[]; by_source: { label: string; count: number }[];
}

export const FIRE_REFRESH_MS = 60_000;

export function fetchActiveFires(includeRecentExtinguished = false, signal?: AbortSignal): Promise<FireFeatureCollection> {
  return apiRequest(`/fires/active?include_recent_extinguished=${includeRecentExtinguished ? 1 : 0}`, { signal });
}

export function fetchFires(signal?: AbortSignal): Promise<{ data: FireEventProperties[] }> {
  return apiRequest('/fires?limit=500', { signal });
}

export function fetchFireIncidentReports(signal?: AbortSignal): Promise<{ data: FireIncidentReport[] }> {
  return apiRequest('/reports?per_page=100&incident_type=FIRE', { signal });
}

export function fetchFireStatistics(signal?: AbortSignal): Promise<FireStatistics> {
  return apiRequest('/fires/statistics', { signal });
}
