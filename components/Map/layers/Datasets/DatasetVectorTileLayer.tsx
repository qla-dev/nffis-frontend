import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetLayer } from '../../../../services/datasetService';

interface DatasetVectorTileLayerProps {
  layer: DatasetLayer;
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

export function DatasetVectorTileLayer({ layer, pane, onPolygonClick, onLoadingChange }: DatasetVectorTileLayerProps) {
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
      const grid = vectorGrid.protobuf(`/api/dataset-layers/${layer.id}/tiles/{z}/{x}/{y}.pbf`, {
        pane,
        interactive: true,
        rendererFactory: L.canvas.tile,
        minZoom: layer.min_zoom ?? 0,
        maxNativeZoom: 22,
        vectorTileLayerStyles: {
          dataset: {
            color: style.color || style.markerColor || '#d97706',
            fillColor: style.fillColor || style.color || '#fcd34d',
            fillOpacity: style.fillOpacity ?? 0.24,
            opacity: style.opacity ?? 0.88,
            weight: style.weight ?? 1,
          },
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
  }, [layer, map, onLoadingChange, onPolygonClick, pane]);

  return null;
}
