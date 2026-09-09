import type { FirefighterStation } from '../firefighterData';
import type { FireEventProperties } from '../services/fireMonitoringService';

export type RecommendationConfidence = 'high' | 'medium' | 'low';

export interface FireResponseRecommendation {
  title: string;
  summary: string;
  confidence: RecommendationConfidence;
  reasons: string[];
  nearestStation?: { name: string; distanceKm: number; precision: FirefighterStation['locationPrecision'] };
}

const ROAD_ACCESS_LIMIT_M = 2_000;
const NEARBY_STATION_LIMIT_KM = 15;

function haversineKm([latitudeA, longitudeA]: [number, number], [latitudeB, longitudeB]: [number, number]): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLatitude = radians(latitudeB - latitudeA);
  const dLongitude = radians(longitudeB - longitudeA);
  const a = Math.sin(dLatitude / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(dLongitude / 2) ** 2;

  return 6_371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function closestStation(event: FireEventProperties, stations: readonly FirefighterStation[]): FireResponseRecommendation['nearestStation'] {
  const nearest = stations.reduce<{ station: FirefighterStation; distanceKm: number } | null>((current, station) => {
    const distanceKm = haversineKm([event.latitude, event.longitude], station.coordinates);
    return !current || distanceKm < current.distanceKm ? { station, distanceKm } : current;
  }, null);

  return nearest ? { name: nearest.station.name, distanceKm: Number(nearest.distanceKm.toFixed(1)), precision: nearest.station.locationPrecision } : undefined;
}

/** Decision support only; it never dispatches resources or replaces incident command. */
export function getFireResponseRecommendation(event: FireEventProperties, stations: readonly FirefighterStation[]): FireResponseRecommendation {
  const roadDistanceM = event.nearest_road?.distance_m;
  const nearestStation = closestStation(event, stations);
  const reasons: string[] = [];
  const hasReliableDetection = event.confidence_level === 'high_confidence' || event.confidence_level === 'likely_fire';
  const difficultGroundAccess = roadDistanceM == null || roadDistanceM > ROAD_ACCESS_LIMIT_M;
  const highIntensity = (event.peak_frp ?? event.latest_frp ?? 0) >= 50;

  if (!hasReliableDetection) reasons.push('Satellite anomaly has not yet been corroborated.');
  if (roadDistanceM == null) reasons.push('No mapped access road was found within the configured search area.');
  else if (roadDistanceM > ROAD_ACCESS_LIMIT_M) reasons.push(`Nearest mapped road is ${Math.round(roadDistanceM)} m away (review threshold: ${ROAD_ACCESS_LIMIT_M} m).`);
  else reasons.push(`Nearest mapped road is ${Math.round(roadDistanceM)} m away.`);
  if (nearestStation) reasons.push(`Nearest listed station: ${nearestStation.name}, about ${nearestStation.distanceKm} km straight-line.`);
  else reasons.push('No station location is available for this estimate.');
  if (highIntensity) reasons.push(`Peak FRP is ${event.peak_frp ?? event.latest_frp} MW; elevated fire intensity requires command review.`);

  let title: string;
  let summary: string;
  if (!hasReliableDetection) {
    title = 'Verify first';
    summary = 'Confirm the anomaly with field, camera, or additional satellite evidence; prepare an access assessment.';
  } else if (difficultGroundAccess) {
    title = 'Consider aerial';
    summary = 'Ground access appears limited. Incident command should assess aerial support alongside a ground approach.';
  } else if (nearestStation && nearestStation.distanceKm <= NEARBY_STATION_LIMIT_KM) {
    title = 'Ground response';
    summary = 'Mapped road access and a nearby listed station support a ground-response assessment.';
  } else {
    title = 'Check availability';
    summary = 'Mapped road access exists, but station proximity or availability needs operational confirmation.';
  }

  const confidence: RecommendationConfidence = !hasReliableDetection || roadDistanceM == null || !nearestStation
    ? 'low'
    : nearestStation.precision === 'exact' || nearestStation.precision === 'facility-center' ? 'high' : 'medium';

  return { title, summary, confidence, reasons, nearestStation };
}
