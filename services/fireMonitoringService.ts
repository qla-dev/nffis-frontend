import { API_BASE_URL, apiRequest } from './api';
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
  weather?: {
    temp?: number;
    humidity?: number;
    speed?: number;
    gusts?: number;
    dir_deg?: number | null;
    from?: string;
    towards?: string;
    time?: string;
    enriched_at?: string;
    provider?: string;
  } | null;
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
    reference_radius_m?: number;
    within_reference_radius?: boolean;
    calculated_at?: string;
    properties?: Record<string, unknown>;
  } | null;
  nearest_water_source?: FireEventProperties['nearest_road'];
  initial_exposure?: {
    status: 'preliminary';
    radius_m: number;
    summary: string;
    land_cover?: { code: number; label: string; color: string; source: string; reference_year: number; resolution_m: number; method: string } | null;
    forest_composition?: { code: number; label: string; source: string; reference_year: number; resolution_m: number; method: string } | null;
    protected_areas?: Array<{ name: string; layer: string; layer_id: number }>;
    mapped_buildings?: { count: number; count_capped: boolean; layer: string; layer_id: number } | null;
    forest_context?: Record<string, string>;
    potentially_exposed?: Array<{ kind: string; label: string }>;
    warnings?: string[];
    calculated_at: string;
  } | null;
  incident_case?: FireIncidentCase | null;
  linked_report_count?: number;
}

export type FireWorkflowStatus = 'new' | 'acknowledged' | 'verified' | 'assigned' | 'contained' | 'closed' | 'false_positive';
export type FirePriority = 'low' | 'normal' | 'high' | 'critical';
export interface FireCaseAction { id: number; action: string; from_status?: string | null; to_status?: string | null; note?: string | null; user_name?: string | null; created_at: string; }
export interface FireIncidentCase { id: number; fire_event_id: number; workflow_status: FireWorkflowStatus; priority: FirePriority; assigned_user_id?: number | null; assigned_user_name?: string | null; latest_note?: string | null; acknowledged_at?: string | null; verified_at?: string | null; assigned_at?: string | null; contained_at?: string | null; closed_at?: string | null; actions?: FireCaseAction[]; }
export type IntelligenceStatus = 'draft' | 'processing' | 'review_required' | 'approved' | 'rejected' | 'failed' | 'superseded';
export interface FirePerimeter { id: number; version: number; geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon; source: string; observed_at: string; status: IntelligenceStatus; review_note?: string | null; }
export interface BurnSeverityAssessment { id: number; status: IntelligenceStatus; imagery?: Record<string, unknown> | null; quality_metrics?: { usable_coverage?: number; state?: string } | null; warnings?: string[] | null; dnbr_cog_path?: string | null; classes_geojson_path?: string | null; }
export interface FireWeatherProduct { id: number; index_type: string; forecast_day: number; valid_at: string; status: IntelligenceStatus; quality_state: string; statistics?: { min: number; max: number; mean: number; count: number }; warnings?: string[] | null; artifact_urls?: { geojson: string; cog: string } | null; }
export interface FireScenarioRun { id: number; fire_event_id: number; status: IntelligenceStatus; settings: { test_mode?: boolean; engine?: string; engine_version?: string; duration_hours?: number }; outputs?: { metrics?: { horizon_area_ha?: Record<string, number>; stop_time_minutes?: number; stop_condition?: string }; warnings?: string[]; software?: string }; artifact_urls?: { arrival: string; perimeters: string } | null; created_at: string; }
export interface FuelModelVersion { id: number; version: string; kind: string; status: IntelligenceStatus; resolution_m?: number | null; review_note?: string | null; crosswalk: Array<{ source_class: string; fuel_class: string; evidence?: string; review_status?: string; review_note?: string }>; review_signoffs?: Record<string, { reviewer_name: string; at: string }> | null; }
export interface FireIntelligenceHealth { enabled: boolean; pilot: { code: string; name: string }; readiness: { ready: boolean; blocking_gaps: string[]; inputs: Array<{ key: string; required: boolean; available: boolean; approval_status: string }> }; runs: { processing: number; failed: number; pending_review: number; latest?: Record<string, unknown> }; worker_queue: string; }
export interface FireEventDetails extends FireEventProperties {
  observations: Array<Record<string, unknown>>;
  transitions: Array<Record<string, unknown>>;
  reports: Array<Record<string, unknown>>;
  fire_intelligence?: {
    eligible: boolean;
    pilot_code: string;
    determination: 'postgis_point_in_polygon' | 'canton_label_fallback';
    reason: string;
  };
  perimeters?: FirePerimeter[];
  burn_severity_assessments?: BurnSeverityAssessment[];
}
export interface FireSourceStatus { source: string; status: 'healthy' | 'stale' | 'unknown'; last_started_at?: string | null; last_success_at?: string | null; last_failure_at?: string | null; duration_ms?: number | null; consecutive_failures: number; last_error?: string | null; stale_after_seconds: number; }
export interface FireHealth { enabled: boolean; checked_at: string; sources: FireSourceStatus[]; }
export interface FireNotification { id: string; data: { fire_event_id: number; external_id: string; transition: string; detail: string; priority: string; municipality?: string | null; canton?: string | null; occurred_at: string }; read_at?: string | null; created_at: string; }

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

export function fetchFires(signal?: AbortSignal, updatedSince?: string): Promise<{ data: FireEventProperties[]; meta: { server_time?: string } }> {
  const query = new URLSearchParams({ per_page: '200', page: '1' });
  if (updatedSince) query.set('updated_since', updatedSince);
  return apiRequest(`/fires?${query.toString()}`, { signal });
}

export function fetchFireIncidentReports(signal?: AbortSignal): Promise<{ data: FireIncidentReport[] }> {
  return apiRequest('/reports?per_page=100&incident_type=FIRE', { signal });
}

export function fetchFireStatistics(signal?: AbortSignal): Promise<FireStatistics> {
  return apiRequest('/fires/statistics', { signal });
}

export function fetchFireDetails(id: number, signal?: AbortSignal): Promise<{ data: FireEventDetails }> {
  return apiRequest(`/fires/${id}`, { signal });
}

export function updateFireIncidentCase(id: number, payload: { workflow_status?: FireWorkflowStatus; priority?: FirePriority; assign_to_me?: boolean; assigned_user_id?: number | null; note?: string }): Promise<{ data: FireIncidentCase }> {
  return apiRequest(`/fires/${id}/case`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function fetchFireHealth(signal?: AbortSignal): Promise<FireHealth> {
  return apiRequest('/fires/health', { signal });
}

export function fetchFireNotifications(signal?: AbortSignal): Promise<{ data: FireNotification[]; unread_count: number }> {
  return apiRequest('/notifications', { signal });
}

export function markFireNotificationRead(id: string): Promise<{ data: FireNotification }> {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
}

export function fetchFireIntelligenceHealth(signal?: AbortSignal): Promise<FireIntelligenceHealth> { return apiRequest('/fire-intelligence/health', { signal }); }
export function fetchFireIntelligenceProducts(signal?: AbortSignal): Promise<{ data: FireWeatherProduct[] }> { return apiRequest('/fire-intelligence/products', { signal }); }
export function fetchFireIntelligenceGrid(productId: number, signal?: AbortSignal): Promise<GeoJSON.FeatureCollection<GeoJSON.Point, { value: number; danger_class?: string }>> { return apiRequest(`/fire-intelligence/products/${productId}/artifact/geojson`, { signal }); }
export async function fetchFireIntelligenceCog(productId: number, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE_URL}/fire-intelligence/products/${productId}/artifact/cog`, { credentials: 'include', headers: { Accept: 'image/tiff' }, signal });
  if (!response.ok) throw new Error(`Unable to load the approved COG (${response.status}).`);
  return response.arrayBuffer();
}
export function fetchFuelModels(signal?: AbortSignal): Promise<{ data: FuelModelVersion[] }> { return apiRequest('/fire-intelligence/fuel-models', { signal }); }
export function buildFuelModel(): Promise<{ data: FuelModelVersion }> { return apiRequest('/fire-intelligence/fuel-models/build', { method: 'POST', body: JSON.stringify({ resolution_m: 100 }) }); }
export function reviewFuelModel(id: number, status: 'approved' | 'rejected', note: string, crosswalkReviews?: Array<{ source_class: string; status: 'approved' | 'rejected'; note: string }>): Promise<{ data: FuelModelVersion; message: string }> { return apiRequest(`/fire-intelligence/fuel-models/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, note, crosswalk_reviews: crosswalkReviews }) }); }
export function fetchFireImpacts(id: number, signal?: AbortSignal): Promise<{ data: Array<Record<string, unknown>> }> { return apiRequest(`/fires/${id}/impacts`, { signal }); }
export function fetchFireRecovery(id: number, signal?: AbortSignal): Promise<{ data: Array<Record<string, unknown>> }> { return apiRequest(`/fires/${id}/recovery`, { signal }); }
export function fetchFirePerimeters(id: number, signal?: AbortSignal): Promise<{ data: FirePerimeter[] }> { return apiRequest(`/fires/${id}/perimeters`, { signal }); }
export function fetchBurnSeverity(id: number, signal?: AbortSignal): Promise<{ data: BurnSeverityAssessment[] }> { return apiRequest(`/fires/${id}/burn-severity`, { signal }); }
export function fetchFireScenarios(id: number, signal?: AbortSignal): Promise<{ data: FireScenarioRun[] }> { return apiRequest(`/fires/${id}/scenarios`, { signal }); }
export function runFireScenario(id: number, testMode = true): Promise<{ data: FireScenarioRun; message: string }> { return apiRequest(`/fires/${id}/scenarios`, { method: 'POST', body: JSON.stringify({ test_mode: testMode }) }); }
export function fetchFireScenarioPerimeters(fireId: number, scenarioId: number, signal?: AbortSignal): Promise<GeoJSON.FeatureCollection> { return apiRequest(`/fires/${fireId}/scenarios/${scenarioId}/artifact/perimeters`, { signal }); }
export function createFirePerimeter(id: number, payload: { geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon; source: string; observed_at: string }): Promise<{ data: FirePerimeter }> { return apiRequest(`/fires/${id}/perimeters`, { method: 'POST', body: JSON.stringify(payload) }); }
export function reviewFirePerimeter(fireId: number, perimeterId: number, status: 'approved' | 'rejected', note: string): Promise<{ data: FirePerimeter }> { return apiRequest(`/fires/${fireId}/perimeters/${perimeterId}/review`, { method: 'PATCH', body: JSON.stringify({ status, note }) }); }
export function requestBurnSeverity(id: number, preImage?: File, postImage?: File): Promise<{ data: BurnSeverityAssessment }> { const body = new FormData(); if (preImage) body.append('pre_image', preImage); if (postImage) body.append('post_image', postImage); return apiRequest(`/fires/${id}/burn-severity`, { method: 'POST', body }); }
export function reviewBurnSeverity(fireId: number, assessmentId: number, status: 'approved' | 'rejected', note: string): Promise<{ data: BurnSeverityAssessment }> { return apiRequest(`/fires/${fireId}/burn-severity/${assessmentId}/review`, { method: 'PATCH', body: JSON.stringify({ status, note }) }); }
