import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetLayer, DatasetLayerFilterState } from '../../../../services/datasetService';

interface DatasetVectorTileLayerProps {
  layer: DatasetLayer;
  filters?: DatasetLayerFilterState;
  pane: string;
  onPolygonClick?: (layerId: number, feature: GeoJSON.Feature) => void;
  onLoadingChange?: (layerId: number, isLoading: boolean) => void;
}

let vectorGridLoader: Promise<void> | null = null;

function loadVectorGrid(): Promise<void> {
  if (!vectorGridLoader) {
    (window as Window & { L?: typeof L }).L = L;
    vectorGridLoader = import('leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js').then(() => undefined);
  }

  return vectorGridLoader;
}

function tileQuery(version: string, filters: DatasetLayerFilterState = {}): string {
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

export function DatasetVectorTileLayer({ layer, filters, pane, onPolygonClick, onLoadingChange }: DatasetVectorTileLayerProps) {
  const map = useMap();
  const gridRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    let disposed = false;
    onLoadingChange?.(layer.id, true);

    loadVectorGrid().then(() => {
      if (disposed) return;

      const vectorGrid = (L as typeof L & {
        vectorGrid: {
          protobuf: (url: string, options: Record<string, unknown>) => L.Layer;
        };
      }).vectorGrid;
      const style = layer.style || {};
      const styleForFeature = (properties: Record<string, unknown>) => {
        const categorized = style.renderer === 'categorized' ? style.categorized : undefined;
        const category = categorized?.categories.find((item) => String(item.value) === String(properties[categorized.field] ?? ''));
        const hidden = style.renderer === 'none' || category?.enabled === false;
        return {
          color: category?.color || style.color || style.markerColor || '#d97706',
          fillColor: category?.fillColor || category?.color || style.fillColor || style.color || '#fcd34d',
          fillOpacity: hidden ? 0 : category?.fillOpacity ?? style.fillOpacity ?? 0.24,
          opacity: hidden ? 0 : category?.opacity ?? style.opacity ?? 0.88,
          weight: hidden ? 0 : category?.weight ?? style.weight ?? 1,
        };
      };
      const query = tileQuery(layer.tile_version || '1', filters);
      const grid = vectorGrid.protobuf(`/api/dataset-layers/${layer.id}/tiles/{z}/{x}/{y}.pbf?${query}`, {
        pane,
        interactive: true,
        rendererFactory: L.canvas.tile,
        minZoom: layer.min_zoom ?? 0,
        maxNativeZoom: 22,
        vectorTileLayerStyles: {
          dataset: styleForFeature,
        },
      });

      grid.on('load', () => onLoadingChange?.(layer.id, false));
      grid.on('tileerror', () => onLoadingChange?.(layer.id, false));
      grid.on('click', (event: L.LeafletMouseEvent & { layer?: { properties?: Record<string, unknown> } }) => {
        if (!onPolygonClick) return;

        const properties = event.layer?.properties || {};
        onPolygonClick(layer.id, {
          type: 'Feature',
          id: properties.id as string | number | undefined,
          properties,
          geometry: null,
        });
      });
      grid.addTo(map);
      gridRef.current = grid;
    }).catch((error) => {
      console.error(`Failed to initialize vector tiles for dataset layer ${layer.id}`, error);
      onLoadingChange?.(layer.id, false);
    });

    return () => {
      disposed = true;
      gridRef.current?.remove();
      gridRef.current = null;
      onLoadingChange?.(layer.id, false);
    };
  }, [filters, layer, map, onLoadingChange, onPolygonClick, pane]);

  return null;
}
