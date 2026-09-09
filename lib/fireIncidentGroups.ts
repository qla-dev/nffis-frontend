import type { FireEventProperties } from '../services/fireMonitoringService';

export interface FireIncidentReport {
  id: number;
  incident_type?: string | null;
  description?: string | null;
  locality?: string | null;
  latitude: number | null;
  longitude: number | null;
  reported_at: string | null;
}

export interface FireIncidentGroup {
  id: string;
  latitude: number;
  longitude: number;
  firstReportedAt: string;
  lastReportedAt: string;
  count: number;
  locality?: string | null;
}

export interface FireMonitoringRow {
  key: string;
  kind: 'satellite' | 'reported';
  event?: FireEventProperties;
  reportGroup?: FireIncidentGroup;
  linkedReportCount: number;
}

export const FIREWATCH_CLUSTER_RADIUS_KM = 3.5;
export const FIREWATCH_CLUSTER_GAP_HOURS = 8;

function distanceKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLatitude = radians(latitudeB - latitudeA);
  const dLongitude = radians(longitudeB - longitudeA);
  const a = Math.sin(dLatitude / 2) ** 2 + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(dLongitude / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const validReports = (reports: FireIncidentReport[]) => reports.filter((report): report is FireIncidentReport & { latitude: number; longitude: number; reported_at: string } =>
  report.latitude != null && report.longitude != null && Boolean(report.reported_at) && Number.isFinite(new Date(report.reported_at!).getTime()),
);

/** Clusters user reports with the same spatial/temporal thresholds as FireWatch. */
export function groupFireIncidentReports(reports: FireIncidentReport[]): FireIncidentGroup[] {
  const groups: Array<{ reports: Array<FireIncidentReport & { latitude: number; longitude: number; reported_at: string }> }> = [];
  for (const report of validReports(reports).sort((a, b) => Date.parse(a.reported_at) - Date.parse(b.reported_at))) {
    const target = groups.find(group => group.reports.some(candidate =>
      Math.abs(Date.parse(report.reported_at) - Date.parse(candidate.reported_at)) <= FIREWATCH_CLUSTER_GAP_HOURS * 3_600_000
      && distanceKm(report.latitude, report.longitude, candidate.latitude, candidate.longitude) <= FIREWATCH_CLUSTER_RADIUS_KM,
    ));
    if (target) target.reports.push(report); else groups.push({ reports: [report] });
  }

  return groups.map(group => {
    const reportsInGroup = group.reports;
    const newest = reportsInGroup[reportsInGroup.length - 1];
    return {
      id: `report-${reportsInGroup.map(report => report.id).join('-')}`,
      latitude: reportsInGroup.reduce((total, report) => total + report.latitude, 0) / reportsInGroup.length,
      longitude: reportsInGroup.reduce((total, report) => total + report.longitude, 0) / reportsInGroup.length,
      firstReportedAt: reportsInGroup[0].reported_at,
      lastReportedAt: newest.reported_at,
      count: reportsInGroup.length,
      locality: newest.locality,
    };
  });
}

function groupMatchesEvent(group: FireIncidentGroup, event: FireEventProperties): boolean {
  const groupTime = Date.parse(group.lastReportedAt);
  const eventTime = Date.parse(event.last_seen_at);
  return Math.abs(groupTime - eventTime) <= FIREWATCH_CLUSTER_GAP_HOURS * 3_600_000
    && distanceKm(group.latitude, group.longitude, event.latitude, event.longitude) <= FIREWATCH_CLUSTER_RADIUS_KM;
}

export function combineFireMonitoringRows(events: FireEventProperties[], reports: FireIncidentReport[]): FireMonitoringRow[] {
  const groups = groupFireIncidentReports(reports);
  const linked = new Set<string>();
  const rows = events.map(event => {
    const matching = groups.filter(group => groupMatchesEvent(group, event));
    matching.forEach(group => linked.add(group.id));
    return { key: `event-${event.id}`, kind: 'satellite' as const, event, linkedReportCount: matching.reduce((total, group) => total + group.count, 0) };
  });
  return [...rows, ...groups.filter(group => !linked.has(group.id)).map(group => ({ key: group.id, kind: 'reported' as const, reportGroup: group, linkedReportCount: group.count }))];
}
