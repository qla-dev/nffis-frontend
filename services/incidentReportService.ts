import { API_BASE_URL, apiRequest } from './api';
import type { CreateReportPayload, IncidentStatus } from './reportStatisticsService';

export interface IncidentReportRecord extends CreateReportPayload {
  id: number;
  status: IncidentStatus;
  locality: string | null;
  region: string | null;
  jurisdiction: string;
  fire_event_id: number | null;
  user?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

export function listIncidentReports(filters: { from?: string; to?: string; page?: number } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)])).toString();
  return apiRequest<{ data: IncidentReportRecord[]; total: number; current_page: number; last_page: number }>(`/reports${query ? `?${query}` : ''}`, { signal });
}

export function updateIncidentReport(id: number, body: Partial<IncidentReportRecord>) {
  return apiRequest<{ data: IncidentReportRecord }>(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function incidentReportPdfUrl(id: number): string {
  return `${API_BASE_URL}/reports/${id}/pdf`;
}
