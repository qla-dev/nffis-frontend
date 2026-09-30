import type { DatasetLayer } from '../../services/datasetService';

export const MAX_CONCURRENT_GEOJSON_LAYERS = 3;
export const MAX_CONCURRENT_VECTOR_TILE_LAYERS = 1;
export const LARGE_VECTOR_LAYER_THRESHOLD = 5_000;
export const BULK_LAYER_COST_BUDGET = 20_000;
export const BULK_LAYER_COUNT_BUDGET = 12;

export function shouldUseVectorTiles(layer: DatasetLayer): boolean {
  return layer.layer_kind !== 'raster'
    && layer.data_delivery === 'vector_tile';
}

export function datasetLayerCost(layer: DatasetLayer): number {
  if (layer.layer_kind === 'raster') return 1_200;
  if (shouldUseVectorTiles(layer)) return 1_500;
  return Math.min(Math.max(layer.feature_count, 1), 1_800);
}

export interface BulkLayerCost {
  layerCount: number;
  estimatedCost: number;
  vectorTileCount: number;
  rasterCount: number;
  requiresConfirmation: boolean;
}

export function bulkLayerCost(layers: DatasetLayer[]): BulkLayerCost {
  const estimatedCost = layers.reduce((total, layer) => total + datasetLayerCost(layer), 0);
  return {
    layerCount: layers.length,
    estimatedCost,
    vectorTileCount: layers.filter(shouldUseVectorTiles).length,
    rasterCount: layers.filter((layer) => layer.layer_kind === 'raster').length,
    requiresConfirmation: layers.length > BULK_LAYER_COUNT_BUDGET || estimatedCost > BULK_LAYER_COST_BUDGET,
  };
}

type PendingTask<T> = {
  run: () => Promise<T>;
  signal?: AbortSignal;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

let activeGeoJsonRequests = 0;
const pendingGeoJsonRequests: PendingTask<unknown>[] = [];

function pumpGeoJsonRequests(): void {
  while (activeGeoJsonRequests < MAX_CONCURRENT_GEOJSON_LAYERS && pendingGeoJsonRequests.length > 0) {
    const task = pendingGeoJsonRequests.shift()!;
    if (task.signal?.aborted) {
      task.reject(new DOMException('The request was aborted.', 'AbortError'));
      continue;
    }

    activeGeoJsonRequests += 1;
    task.run()
      .then(task.resolve, task.reject)
      .finally(() => {
        activeGeoJsonRequests -= 1;
        pumpGeoJsonRequests();
      });
  }
}

/** Limits viewport GeoJSON work across every mounted dataset layer. */
export function scheduleGeoJsonRequest<T>(run: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The request was aborted.', 'AbortError'));
      return;
    }

    pendingGeoJsonRequests.push({ run, signal, resolve, reject } as PendingTask<unknown>);
    pumpGeoJsonRequests();
  });
}
