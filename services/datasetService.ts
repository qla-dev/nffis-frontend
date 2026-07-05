export interface DatasetLayerStyle {
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  markerColor?: string;
  opacity?: number;
  radius?: number;
  strokeColor?: string;
  weight?: number;
}

export interface DatasetFilterField {
  name: string;
  type: string;
  kind: 'values' | 'range';
}

export interface DatasetLayer {
  id: number;
  table_schema: string;
  table_name: string;
  display_name: string;
  source_path?: string | null;
  source_driver?: string | null;
  category: string;
  subcategory?: string | null;
  geometry_type?: string | null;
  geometry_family: 'point' | 'line' | 'polygon' | 'mixed';
  srid: number;
  feature_count: number;
  bounds?: {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
  } | null;
  style: DatasetLayerStyle;
  filter_fields: DatasetFilterField[];
  visible_by_default: boolean;
}

export interface DatasetFilterValue {
  value: string | number | null;
  count: number;
}

export interface DatasetFilterOption extends DatasetFilterField {
  values?: DatasetFilterValue[];
  min?: number | string | null;
  max?: number | string | null;
}

export interface DatasetLayerFilterState {
  values?: Record<string, string[]>;
  min?: Record<string, string>;
  max?: Record<string, string>;
  q?: string;
}

interface FetchFeaturesOptions {
  bbox?: string;
  filters?: DatasetLayerFilterState;
  limit?: number;
  tolerance?: number;
}

const env = (import.meta as any).env || {};
const API_BASE_URL = String(env.VITE_NFFIS_API_URL || '/api').replace(/\/$/, '');

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Dataset API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDatasetLayers(): Promise<DatasetLayer[]> {
  const data = await requestJson<{ layers: DatasetLayer[] }>('/dataset-layers');

  return data.layers;
}

export async function fetchDatasetLayerFilterOptions(layerId: number): Promise<DatasetFilterOption[]> {
  const data = await requestJson<{ fields: DatasetFilterOption[] }>(`/dataset-layers/${layerId}/filter-options`);

  return data.fields;
}

export async function fetchDatasetLayerFeatures(
  layerId: number,
  options: FetchFeaturesOptions = {}
): Promise<GeoJSON.FeatureCollection> {
  const params = new URLSearchParams();

  if (options.bbox) {
    params.set('bbox', options.bbox);
  }

  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  if (options.tolerance && options.tolerance > 0) {
    params.set('tolerance', String(options.tolerance));
  }

  const filters = options.filters || {};

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  Object.entries(filters.values || {}).forEach(([field, values]) => {
    const cleanValues = values.filter(Boolean);
    if (cleanValues.length > 0) {
      params.set(`filter[${field}]`, cleanValues.join(','));
    }
  });

  Object.entries(filters.min || {}).forEach(([field, value]) => {
    if (value !== '') {
      params.set(`min[${field}]`, value);
    }
  });

  Object.entries(filters.max || {}).forEach(([field, value]) => {
    if (value !== '') {
      params.set(`max[${field}]`, value);
    }
  });

  const query = params.toString();
  const data = await requestJson<{ geojson: GeoJSON.FeatureCollection }>(
    `/dataset-layers/${layerId}/features${query ? `?${query}` : ''}`
  );

  return data.geojson;
}
