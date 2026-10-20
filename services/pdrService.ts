import { API_BASE_URL, apiRequest } from './api';

export type PdrStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type PdrJurisdiction = 'fbih' | 'rs' | 'shared';
export type Bilingual = { en: string; bs: string };

export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface PdrMetadata {
  started_at?: string | null;
  detected_at?: string | null;
  contained_at?: string | null;
  region?: string | null;
  canton?: string | null;
  municipality?: string | null;
  locality?: string | null;
  cause?: string | null;
  description?: string | null;
  intervention?: string | null;
  personnel_deployed?: number | null;
  vehicles_deployed?: number | null;
  aerial_assets?: number | null;
  fatalities?: number | null;
  injured?: number | null;
  evacuated?: number | null;
  dangerous_substances?: string | null;
  assistance_required?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

export interface LandCoverClass { code: string; label: Bilingual; group: string; area_ha: number; share: number; features: number }
export interface LandCoverGroup { key: string; label: Bilingual; area_ha: number; share: number }
export interface DataSource { dataset: string; label: string; source: string; table: string; scale: string; features_used: number | null; data_as_of: string | null }
export interface DamageItem { category: string; key: string; label: Bilingual; quantity: number; unit: string; rate: number; amount: number }

export interface PdrResults {
  perimeter: { area_ha: number };
  land_cover: { classes: LandCoverClass[]; groups: LandCoverGroup[]; covered_ha: number; unclassified_ha: number; overlap_ha: number } | null;
  roads: { inside_km: number; buffer_km: number; by_class: { class: string; inside_km: number; buffer_km: number; inside_segments: number }[] } | null;
  buildings: { inside_count: number; buffer_count: number; inside_footprint_m2: number; residential_inside: number; residential_buffer: number; by_type: { type: string; inside: number; buffer: number; inside_footprint_m2: number }[] } | null;
  protected_areas: { total_ha: number; share: number; sites: { name: string; designation: string | null; burnt_ha: number; site_ha: number; share_of_site: number }[] } | null;
  population: { inside_estimate: number; buffer_estimate: number; persons_per_building: number; method: string } | null;
  damage: {
    available: boolean;
    reason?: string;
    currency?: string;
    coefficient_set?: { id: number; version: number; name: string; approved_at: string | null; approved_by: string | null };
    items?: DamageItem[];
    by_category?: Record<string, number>;
    total?: number;
    formula: string;
  };
  exposure_buffer_m: number;
  warnings: string[];
  data_sources: DataSource[];
  duration_ms: number;
  calculated_at: string;
}

export interface PdrReport {
  id: number;
  reference: string | null;
  title: string;
  status: PdrStatus;
  jurisdiction: PdrJurisdiction;
  fire_event_id: number | null;
  incident_report_id: number | null;
  metadata: PdrMetadata | null;
  perimeter_geometry?: MultiPolygon | null;
  perimeter_source: string | null;
  perimeter_file_name?: string | null;
  perimeter_area_ha: number | null;
  perimeter_vertex_count?: number | null;
  perimeter_version: number;
  perimeter_warnings?: string[] | null;
  results?: PdrResults | null;
  data_sources?: DataSource[] | null;
  calculated_at: string | null;
  submitted_at: string | null;
  reviewer_name: string | null;
  review_note?: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PdrPermissions { update: boolean; calculate: boolean; submit: boolean; delete: boolean; review: boolean }

export interface PerimeterPreview { geometry: MultiPolygon; area_ha: number; vertex_count: number; warnings: string[] }

export interface CoefficientSet {
  id: number;
  version: number;
  name: string;
  status: 'draft' | 'approved' | 'retired';
  currency: string;
  coefficients: {
    land_cover_groups: Record<string, number>;
    land_cover_codes: Record<string, number>;
    roads: Record<string, number | null>;
    buildings: Record<string, number>;
    protected_area_eur_per_ha: number;
  };
  notes: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  updated_at: string;
}

export interface CoefficientCatalogue {
  data: CoefficientSet[];
  template: CoefficientSet['coefficients'];
  land_cover_groups: { key: string; label: Bilingual; codes: string[] }[];
  land_cover_codes: { code: string; label: Bilingual; group: string }[];
  formula: string;
}

interface Paginated<T> { data: T[]; total: number; current_page: number; last_page: number }

export function listPdrReports(filters: { status?: string; jurisdiction?: string; q?: string } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]).toString();
  return apiRequest<Paginated<PdrReport>>(`/pdr-reports${query ? `?${query}` : ''}`, { signal });
}

export function pdrExportUrl(id: number, format: 'pdf' | 'json'): string {
  return `${API_BASE_URL}/pdr-reports/${id}/export.${format}`;
}

export function getPdrReport(id: number, signal?: AbortSignal) {
  return apiRequest<{ data: PdrReport; permissions: PdrPermissions }>(`/pdr-reports/${id}`, { signal });
}

export function createPdrReport(body: { title: string; jurisdiction?: PdrJurisdiction | null; fire_event_id?: number | null; metadata?: PdrMetadata }) {
  return apiRequest<{ data: PdrReport }>('/pdr-reports', { method: 'POST', body: JSON.stringify(body) });
}

export function updatePdrReport(id: number, body: Partial<{ title: string; jurisdiction: PdrJurisdiction; metadata: PdrMetadata }>) {
  return apiRequest<{ data: PdrReport }>(`/pdr-reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deletePdrReport(id: number) {
  return apiRequest<void>(`/pdr-reports/${id}`, { method: 'DELETE' });
}

function perimeterBody(input: { file?: File; geometry?: MultiPolygon; sourceSrid?: number | null }): BodyInit {
  if (input.file) {
    const form = new FormData();
    form.append('file', input.file);
    if (input.sourceSrid) form.append('source_srid', String(input.sourceSrid));
    return form;
  }
  return JSON.stringify({ geometry: input.geometry, source_srid: input.sourceSrid || undefined });
}

export function previewPerimeter(input: { file?: File; geometry?: MultiPolygon; sourceSrid?: number | null }) {
  return apiRequest<{ data: PerimeterPreview }>('/pdr-reports/perimeter/preview', { method: 'POST', body: perimeterBody(input) });
}

export function savePerimeter(id: number, input: { file?: File; geometry?: MultiPolygon; sourceSrid?: number | null }) {
  return apiRequest<{ data: PdrReport }>(`/pdr-reports/${id}/perimeter`, { method: 'POST', body: perimeterBody(input) });
}

export function calculatePdrReport(id: number) {
  return apiRequest<{ data: PdrReport }>(`/pdr-reports/${id}/calculate`, { method: 'POST' });
}

export function submitPdrReport(id: number) {
  return apiRequest<{ data: PdrReport }>(`/pdr-reports/${id}/submit`, { method: 'POST' });
}

export function reviewPdrReport(id: number, status: 'approved' | 'rejected', note: string) {
  return apiRequest<{ data: PdrReport }>(`/pdr-reports/${id}/review`, { method: 'POST', body: JSON.stringify({ status, note }) });
}

export function aoiStatistics(input: { file?: File; geometry?: MultiPolygon; sourceSrid?: number | null }) {
  return apiRequest<{ data: { geometry: MultiPolygon; warnings: string[]; results: PdrResults } }>('/pdr-reports/aoi-statistics', { method: 'POST', body: perimeterBody(input) });
}

export function listCoefficientSets(signal?: AbortSignal) {
  return apiRequest<CoefficientCatalogue>('/pdr-coefficient-sets', { signal });
}

export function createCoefficientSet(body: { name: string; notes?: string; coefficients?: CoefficientSet['coefficients'] }) {
  return apiRequest<{ data: CoefficientSet }>('/pdr-coefficient-sets', { method: 'POST', body: JSON.stringify(body) });
}

export function updateCoefficientSet(id: number, body: Partial<{ name: string; notes: string; coefficients: CoefficientSet['coefficients'] }>) {
  return apiRequest<{ data: CoefficientSet }>(`/pdr-coefficient-sets/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function approveCoefficientSet(id: number) {
  return apiRequest<{ data: CoefficientSet }>(`/pdr-coefficient-sets/${id}/approve`, { method: 'POST' });
}
