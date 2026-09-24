export type FireSpreadWarningLevel = 'watch' | 'elevated' | 'high' | 'extreme';

export interface FireSpreadFwiPoint {
  lat: number;
  lng: number;
  fwiBosnian: number;
}

export interface FireSpreadInput {
  id?: number;
  external_id?: string;
  latitude: number;
  longitude: number;
  peak_frp?: number | null;
  confidence_level?: string;
  weather?: {
    speed?: number | null;
    gusts?: number | null;
    dir_deg?: number | null;
    towards?: string | null;
  } | null;
}

export interface FireSpreadWarning {
  level: FireSpreadWarningLevel;
  score: number;
  fwi: number | null;
  windKmh: number;
  bearing: number;
  distanceKm: number;
  origin: [number, number];
  positions: Array<[number, number]>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const interpolateFwiAt = (lat: number, lng: number, points: FireSpreadFwiPoint[]): number | null => {
  let weighted = 0;
  let totalWeight = 0;
  for (const point of points) {
    const dx = (lng - point.lng) * Math.cos(lat * Math.PI / 180);
    const dy = lat - point.lat;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < 1e-8) return point.fwiBosnian;
    const weight = 1 / distanceSquared;
    weighted += point.fwiBosnian * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : null;
};

export const destinationPoint = (lat: number, lng: number, bearing: number, distanceKm: number): [number, number] => {
  const radiusKm = 6371.0088;
  const angularDistance = distanceKm / radiusKm;
  const latitude = lat * Math.PI / 180;
  const longitude = lng * Math.PI / 180;
  const heading = bearing * Math.PI / 180;
  const resultLat = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance)
      + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(heading),
  );
  const resultLng = longitude + Math.atan2(
    Math.sin(heading) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(resultLat),
  );
  return [resultLat * 180 / Math.PI, resultLng * 180 / Math.PI];
};

const distanceAndBearing = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const radiusKm = 6371.0088;
  const phi1 = fromLat * Math.PI / 180;
  const phi2 = toLat * Math.PI / 180;
  const deltaPhi = (toLat - fromLat) * Math.PI / 180;
  const deltaLambda = (toLng - fromLng) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const distanceKm = radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return { distanceKm, bearing };
};

const angularDifference = (first: number, second: number) => ((first - second + 540) % 360) - 180;

/** Blends an active-fire warning into the scalar display surface. The result is
 * deliberately a localized advisory plume, not a forecast fire perimeter. */
export const applySpreadWarningsToFwi = (
  baseFwi: number,
  lat: number,
  lng: number,
  warnings: FireSpreadWarning[],
) => warnings.reduce((value, warning) => {
  const offset = distanceAndBearing(warning.origin[0], warning.origin[1], lat, lng);
  const angle = angularDifference(offset.bearing, warning.bearing) * Math.PI / 180;
  const alongKm = offset.distanceKm * Math.cos(angle);
  const crossKm = Math.abs(offset.distanceKm * Math.sin(angle));
  const peak = warning.level === 'extreme' ? 80 : warning.level === 'high' ? 65 : warning.level === 'elevated' ? 45 : 28;

  const sourceInfluence = Math.exp(-0.5 * (offset.distanceKm / 1.6) ** 2);
  let downwindInfluence = 0;
  if (alongKm >= 0 && alongKm <= warning.distanceKm) {
    const halfWidthKm = 1.2 + alongKm * 0.2;
    const lateral = Math.exp(-0.5 * (crossKm / halfWidthKm) ** 2);
    const longitudinal = Math.max(0, 1 - alongKm / (warning.distanceKm * 1.08));
    downwindInfluence = lateral * longitudinal;
  }

  return Math.max(value, peak * Math.max(sourceInfluence, downwindInfluence));
}, baseFwi);

export const assessFireSpreadWarning = (
  event: FireSpreadInput,
  fwiPoints: FireSpreadFwiPoint[],
): FireSpreadWarning | null => {
  const windFrom = event.weather?.dir_deg;
  if (!Number.isFinite(windFrom)) return null;

  const windKmh = Math.max(0, event.weather?.gusts ?? event.weather?.speed ?? 0);
  const fwi = interpolateFwiAt(event.latitude, event.longitude, fwiPoints);
  const fwiFactor = clamp((fwi ?? 0) / 50, 0, 1);
  const windFactor = clamp(windKmh / 50, 0, 1);
  const frpFactor = clamp((event.peak_frp ?? 0) / 100, 0, 1);
  const confidenceFactor = event.confidence_level === 'high_confidence'
    ? 1
    : event.confidence_level === 'likely_fire' ? 0.7 : 0.35;
  const score = clamp(0.45 * fwiFactor + 0.3 * windFactor + 0.15 * frpFactor + 0.1 * confidenceFactor, 0, 1);
  const level: FireSpreadWarningLevel = score >= 0.8
    ? 'extreme'
    : score >= 0.6 ? 'high' : score >= 0.35 ? 'elevated' : 'watch';
  const distanceKm = clamp(3 + windKmh * 0.35 + (fwi ?? 0) * 0.12, 3, 30);
  // Meteorological direction is where wind comes FROM; spread warning points downwind.
  const bearing = (windFrom! + 180) % 360;
  const shoulderDistance = distanceKm * 0.78;
  const positions: Array<[number, number]> = [
    [event.latitude, event.longitude],
    destinationPoint(event.latitude, event.longitude, bearing - 28, shoulderDistance),
    destinationPoint(event.latitude, event.longitude, bearing, distanceKm),
    destinationPoint(event.latitude, event.longitude, bearing + 28, shoulderDistance),
  ];

  return { level, score, fwi, windKmh, bearing, distanceKm, origin: [event.latitude, event.longitude], positions };
};

export const FIRE_SPREAD_WARNING_COLORS: Record<FireSpreadWarningLevel, string> = {
  watch: '#facc15',
  elevated: '#f97316',
  high: '#dc2626',
  extreme: '#7f1d1d',
};
