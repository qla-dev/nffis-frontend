import { describe, expect, it } from 'vitest';
import { combineFireMonitoringRows, groupFireIncidentReports, type FireIncidentReport } from '../lib/fireIncidentGroups';
import type { FireEventProperties } from '../services/fireMonitoringService';

const reports: FireIncidentReport[] = [
  { id: 1, latitude: 43.856, longitude: 18.413, reported_at: '2026-09-09T10:00:00Z', locality: 'Sarajevo' },
  { id: 2, latitude: 43.857, longitude: 18.414, reported_at: '2026-09-09T12:00:00Z', locality: 'Sarajevo' },
  { id: 3, latitude: 44.0, longitude: 18.6, reported_at: '2026-09-09T10:00:00Z', locality: 'Elsewhere' },
];
const event: FireEventProperties = { id: 1, external_id: 'FW-1', latitude: 43.856, longitude: 18.413, status: 'new', is_active: true, confidence_level: 'likely_fire', first_seen_at: '2026-09-09T10:00:00Z', last_seen_at: '2026-09-09T12:00:00Z', detection_count: 1, extent_km: 0, sources: ['viirs'], sensors: [] };

describe('FireWatch incident-report grouping', () => {
  it('groups nearby reports in the same FireWatch time window', () => expect(groupFireIncidentReports(reports)).toHaveLength(2));
  it('links a matching report group to a satellite event and retains an unmatched group', () => {
    const rows = combineFireMonitoringRows([event], reports);
    expect(rows).toHaveLength(2);
    expect(rows[0].linkedReportCount).toBe(2);
    expect(rows[1].kind).toBe('reported');
  });
});
