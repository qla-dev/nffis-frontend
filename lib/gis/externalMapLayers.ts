import { MapLayer } from '../../types';

export interface ExternalBaseLayerConfig {
  url: string;
  attribution: string;
  className?: string;
  maxNativeZoom?: number;
  maxZoom?: number;
}

export const OPENSTREETMAP_BASE_LAYER: ExternalBaseLayerConfig = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  className: 'nffis-positron-basemap',
  maxNativeZoom: 19,
  maxZoom: 20,
};

/**
 * These entries are selected as mutually-exclusive map backgrounds. The NASA
 * thematic choices use OSM for geographic context and add their real data as
 * overlays in GISMap. Windy also uses OpenStreetMap for geographic context,
 * with the live wind vectors rendered above it. When no explicit imagery layer
 * is selected, OPENSTREETMAP_BASE_LAYER is used as the default map.
 */
export const EXTERNAL_BASE_LAYERS: Partial<Record<MapLayer, ExternalBaseLayerConfig>> = {
  [MapLayer.SATELLITE]: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri',
  },
  [MapLayer.SATELLITE_CLARITY]: {
    url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Clarity',
  },
  [MapLayer.SATELLITE_GOOGLE]: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: 'Google',
  },
  [MapLayer.TERRAIN]: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'OpenTopoMap',
  },
  [MapLayer.SENTINEL]: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: 'Sentinel-2 cloudless 2025 &copy; EOX; modified Copernicus Sentinel data 2025',
    maxNativeZoom: 14,
    maxZoom: 18,
  },
  [MapLayer.INFRARED]: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'NatGeo (simulated infrared)',
  },
  [MapLayer.NASA_FIRMS]: OPENSTREETMAP_BASE_LAYER,
  [MapLayer.THERMAL]: OPENSTREETMAP_BASE_LAYER,
  [MapLayer.WINDY]: OPENSTREETMAP_BASE_LAYER,
};

export function usesPlainBaseLayer(_layer: MapLayer | undefined): boolean {
  return false;
}

export const NASA_GIBS_WMS_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi';
export const NASA_FIRMS_LAYER = 'MODIS_Combined_Thermal_Anomalies_All';
export const NASA_LAND_SURFACE_TEMPERATURE_LAYER = 'MODIS_Terra_Land_Surface_Temp_Day';

export function gibsObservationDate(now = new Date()): string {
  // Near-real-time satellite products can arrive hours after acquisition. The
  // previous UTC day is consistently available for both layers.
  const observationDate = new Date(now.getTime());
  observationDate.setUTCDate(observationDate.getUTCDate() - 1);
  return observationDate.toISOString().slice(0, 10);
}
