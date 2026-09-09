import { describe, expect, it } from 'vitest';
import { getFireResponseRecommendation } from '../lib/fireResponseRecommendation';
import type { FireEventProperties } from '../services/fireMonitoringService';

const event = (overrides: Partial<FireEventProperties> = {}): FireEventProperties => ({
  id: 1, external_id: 'FW-1', latitude: 44.772, longitude: 17.192, status: 'corroborated', is_active: true,
  confidence_level: 'high_confidence', first_seen_at: '2026-09-09T10:00:00Z', last_seen_at: '2026-09-09T10:10:00Z',
  detection_count: 2, extent_km: 0, sources: ['viirs'], sensors: ['VIIRS'], peak_frp: 10, ...overrides,
});

describe('getFireResponseRecommendation', () => {
  it('recommends an aerial assessment when mapped access is beyond the review threshold', () => {
    const result = getFireResponseRecommendation(event({ nearest_road: { distance_m: 2_100 } }), []);
    expect(result.title).toContain('aerial');
    expect(result.confidence).toBe('low');
  });

  it('recommends a ground assessment when access and a nearby station are available', () => {
    const result = getFireResponseRecommendation(event({ nearest_road: { distance_m: 300 } }), [{
      id: 'station', name: 'Test station', stationType: 'territorial', municipality: 'Test', coordinates: [44.773, 17.193],
      address: '', phone: '', capacity: 1, supervisor: '', capacitySource: 'reported', locationPrecision: 'exact',
    }]);
    expect(result.title).toContain('Ground');
    expect(result.confidence).toBe('high');
  });

  it('requires verification for an unconfirmed anomaly', () => {
    expect(getFireResponseRecommendation(event({ confidence_level: 'unconfirmed_anomaly', nearest_road: { distance_m: 300 } }), []).title).toContain('Verify');
  });
});
