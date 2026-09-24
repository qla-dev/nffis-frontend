import type { DatasetLayerFilterState } from '../../services/datasetService';

export type MapRendererName = 'leaflet' | 'maplibre' | 'mapbox';

export interface MapPerformanceMetrics {
  renderer: MapRendererName;
  startedAt: number;
  mapLoadMs: number | null;
  operationalMs: number | null;
  sourceErrors: number;
  longTasks: number;
  longTaskDurationMs: number;
}

declare global {
  interface Window {
    __NFFIS_MAP_METRICS__?: MapPerformanceMetrics;
  }
}

export function selectMapRenderer(
  search: string,
  options: { enabled: boolean; mapboxEnabled?: boolean; defaultRenderer?: string },
): MapRendererName {
  const requested = new URLSearchParams(search).get('mapRenderer');
  if (requested === 'leaflet') return 'leaflet';
  if (requested === 'maplibre' && options.enabled) return 'maplibre';
  if (requested === 'mapbox' && options.mapboxEnabled) return 'mapbox';

  if (options.defaultRenderer === 'maplibre' && options.enabled) return 'maplibre';
  if (options.defaultRenderer === 'mapbox' && options.mapboxEnabled) return 'mapbox';
  return 'leaflet';
}

export function mapLibreTileUrl(url: string): string {
  // GL tile templates do not expand Leaflet's subdomain token. A fixed
  // OpenTopoMap subdomain is sufficient for the comparison build.
  return url.replace('{s}', 'a');
}

export function datasetTileQuery(version: string, filters: DatasetLayerFilterState = {}): string {
  const params = new URLSearchParams({ v: version });
  if (filters.q?.trim()) params.set('q', filters.q.trim());

  Object.entries(filters.values || {}).forEach(([field, values]) => {
    const clean = values.filter(Boolean);
    if (clean.length) params.set(`filter[${field}]`, clean.join(','));
  });
  Object.entries(filters.min || {}).forEach(([field, value]) => {
    if (value !== '') params.set(`min[${field}]`, value);
  });
  Object.entries(filters.max || {}).forEach(([field, value]) => {
    if (value !== '') params.set(`max[${field}]`, value);
  });

  return params.toString();
}

export function wmsTileUrl(
  baseUrl: string,
  layerName: string,
  extra: Record<string, string> = {},
): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const parameters = [
    'service=WMS',
    'request=GetMap',
    'version=1.1.1',
    `layers=${encodeURIComponent(layerName)}`,
    'styles=default',
    'format=image%2Fpng',
    'transparent=true',
    'srs=EPSG%3A3857',
    'width=256',
    'height=256',
    // Keep the token literal: MapLibre substitutes it for each requested tile.
    'bbox={bbox-epsg-3857}',
    ...Object.entries(extra).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`),
  ];

  return `${baseUrl}${separator}${parameters.join('&')}`;
}
