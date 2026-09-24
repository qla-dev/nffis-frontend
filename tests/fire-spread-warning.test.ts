import { describe, expect, it } from 'vitest';
import { applySpreadWarningsToFwi, assessFireSpreadWarning, destinationPoint, interpolateFwiAt } from '../lib/fwi/fireSpreadWarning';

describe('fire spread warning', () => {
  it('interpolates FWI and points the corridor downwind', () => {
    const result = assessFireSpreadWarning({
      latitude: 44,
      longitude: 18,
      peak_frp: 20,
      confidence_level: 'likely_fire',
      weather: { speed: 20, gusts: 30, dir_deg: 270 },
    }, [{ lat: 44, lng: 18, fwiBosnian: 30 }]);

    expect(result).not.toBeNull();
    expect(result!.bearing).toBe(90);
    expect(result!.positions[2][1]).toBeGreaterThan(18);
    expect(result!.fwi).toBe(30);
  });

  it('raises severity as FWI, wind, confidence and FRP increase', () => {
    const low = assessFireSpreadWarning({
      latitude: 44, longitude: 18, peak_frp: 2, confidence_level: 'unconfirmed_anomaly',
      weather: { speed: 3, dir_deg: 0 },
    }, [{ lat: 44, lng: 18, fwiBosnian: 4 }]);
    const high = assessFireSpreadWarning({
      latitude: 44, longitude: 18, peak_frp: 100, confidence_level: 'high_confidence',
      weather: { speed: 45, gusts: 60, dir_deg: 0 },
    }, [{ lat: 44, lng: 18, fwiBosnian: 60 }]);

    expect(high!.score).toBeGreaterThan(low!.score);
    expect(low!.level).toBe('watch');
    expect(high!.level).toBe('extreme');
  });

  it('handles basic geodesic destinations and missing inputs', () => {
    const north = destinationPoint(44, 18, 0, 10);
    expect(north[0]).toBeGreaterThan(44);
    expect(interpolateFwiAt(44, 18, [])).toBeNull();
    expect(assessFireSpreadWarning({ latitude: 44, longitude: 18 }, [])).toBeNull();
  });

  it('embeds a localized downwind plume into the FWI surface', () => {
    const warning = assessFireSpreadWarning({
      latitude: 43.05, longitude: 17.78, peak_frp: 100, confidence_level: 'high_confidence',
      weather: { gusts: 50, dir_deg: 270 },
    }, [{ lat: 43.05, lng: 17.78, fwiBosnian: 80 }])!;

    const atFire = applySpreadWarningsToFwi(8, 43.05, 17.78, [warning]);
    const downwind = applySpreadWarningsToFwi(8, 43.05, 17.9, [warning]);
    const upwind = applySpreadWarningsToFwi(8, 43.05, 17.6, [warning]);
    const farAway = applySpreadWarningsToFwi(8, 44, 18, [warning]);

    expect(atFire).toBe(80);
    expect(downwind).toBeGreaterThan(upwind);
    expect(upwind).toBeLessThan(20);
    expect(farAway).toBe(8);
  });
});
