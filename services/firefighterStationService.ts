import type { FirefighterStation, FirefighterStationType } from '../firefighterData';
import { fetchDatasetLayerFeatures, fetchDatasetLayers } from './datasetService';

const STATION_TABLE = 'firefighter_stations';
const STATION_TYPES = new Set<FirefighterStationType>(['territorial', 'volunteer', 'industrial', 'unknown']);

export async function fetchFirefighterStations(signal?: AbortSignal): Promise<FirefighterStation[]> {
  const layers = await fetchDatasetLayers();
  const stationLayer = layers.find((layer) => layer.table_name === STATION_TABLE);
  if (!stationLayer) return [];

  const collection = await fetchDatasetLayerFeatures(stationLayer.id, { limit: 500, signal });
  return collection.features.flatMap((feature) => {
    if (feature.geometry?.type !== 'Point') return [];
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const [longitude, latitude] = feature.geometry.coordinates;
    const stationType = String(properties.station_type || '') as FirefighterStationType;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !STATION_TYPES.has(stationType)) return [];

    return [{
      id: String(properties.external_id || feature.id || ''),
      name: String(properties.name || 'Firefighter station'),
      stationType,
      municipality: String(properties.municipality || ''),
      coordinates: [Number(latitude), Number(longitude)] as [number, number],
      address: String(properties.address || ''),
      phone: String(properties.phone || 'N/A'),
      phoneAlt: properties.phone_alt ? String(properties.phone_alt) : undefined,
      mobile: properties.mobile ? String(properties.mobile) : undefined,
      email: properties.email ? String(properties.email) : undefined,
      postalCode: properties.postal_code ? String(properties.postal_code) : undefined,
      capacity: Number(properties.firefighter_capacity || 0),
      vehicleCount: properties.vehicle_count == null ? undefined : Number(properties.vehicle_count),
      supervisor: String(properties.supervisor || ''),
      capacitySource: properties.capacity_source === 'reported'
        ? 'reported'
        : properties.capacity_source === 'estimated' ? 'estimated' : 'unknown',
      locationPrecision: ['exact', 'village-center', 'facility-center', 'municipality-seat'].includes(String(properties.location_precision))
        ? properties.location_precision as FirefighterStation['locationPrecision']
        : 'municipality-seat',
      note: properties.note ? String(properties.note) : undefined,
    }];
  });
}
