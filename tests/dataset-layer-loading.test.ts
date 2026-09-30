import { describe, expect, it } from 'vitest';
import {
  BULK_LAYER_COST_BUDGET,
  bulkLayerCost,
  LARGE_VECTOR_LAYER_THRESHOLD,
  MAX_CONCURRENT_GEOJSON_LAYERS,
  scheduleGeoJsonRequest,
  shouldUseVectorTiles,
} from '../lib/gis/datasetLayerLoading';
import type { DatasetLayer } from '../services/datasetService';

function layer(overrides: Partial<DatasetLayer> = {}): DatasetLayer {
  return {
    id: 1,
    table_schema: 'public',
    table_name: 'sample',
    display_name: 'Sample',
    jurisdiction: 'shared',
    category: 'natural',
    geometry_family: 'polygon',
    layer_kind: 'vector',
    nearest_road_enabled: false,
    srid: 4326,
    feature_count: 100,
    style: {},
    filter_fields: [],
    visible_by_default: false,
    data_delivery: 'geojson',
    ...overrides,
  };
}

describe('dataset layer load policy', () => {
  it('uses vector tiles only when the backend catalogue enables their endpoint', () => {
    expect(shouldUseVectorTiles(layer({ data_delivery: 'vector_tile' }))).toBe(true);
    expect(shouldUseVectorTiles(layer({ feature_count: LARGE_VECTOR_LAYER_THRESHOLD }))).toBe(false);
    expect(shouldUseVectorTiles(layer({ feature_count: LARGE_VECTOR_LAYER_THRESHOLD - 1 }))).toBe(false);
    expect(shouldUseVectorTiles(layer({ layer_kind: 'raster', data_delivery: 'vector_tile', feature_count: 1_000_000 }))).toBe(false);
    expect(shouldUseVectorTiles(layer({ layer_kind: 'raster', feature_count: 1_000_000 }))).toBe(false);
  });

  it('requires confirmation when a group exceeds the load budget', () => {
    const expensive = Array.from({ length: 12 }, (_, index) => layer({ id: index + 1, feature_count: 1_800 }));
    const cost = bulkLayerCost(expensive);
    expect(cost.estimatedCost).toBeGreaterThan(BULK_LAYER_COST_BUDGET);
    expect(cost.requiresConfirmation).toBe(true);
    expect(bulkLayerCost([layer()]).requiresConfirmation).toBe(false);
  });

  it('caps concurrent GeoJSON requests across layers', async () => {
    let running = 0;
    let maximumRunning = 0;
    const tasks = Array.from({ length: 8 }, () => scheduleGeoJsonRequest(() => new Promise<void>((resolve) => {
      running += 1;
      maximumRunning = Math.max(maximumRunning, running);
      window.setTimeout(() => {
        running -= 1;
        resolve();
      }, 1);
    })));

    await Promise.all(tasks);
    expect(maximumRunning).toBe(MAX_CONCURRENT_GEOJSON_LAYERS);
  });
});
