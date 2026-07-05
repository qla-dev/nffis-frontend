import React, { useEffect, useMemo, useState } from 'react';
import { GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetLayer, DatasetLayerFilterState } from '../../../../services/datasetService';
import { fetchDatasetLayerFeatures } from '../../../../services/datasetService';

interface DatasetGeoJsonLayerProps {
  layer: DatasetLayer;
  filters?: DatasetLayerFilterState;
  pane: string;
  onPolygonClick?: (layerId: number) => void;
}

function bboxForMap(map: L.Map): string {
  const bounds = map.getBounds();

  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ].map((value) => value.toFixed(6)).join(',');
}

function toleranceForZoom(zoom: number): number {
  if (zoom <= 7) return 0.003;
  if (zoom <= 9) return 0.0012;
  if (zoom <= 11) return 0.00035;

  return 0;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tooltipHtml(layer: DatasetLayer, feature: GeoJSON.Feature): string {
  const properties = (feature.properties || {}) as Record<string, unknown>;
  const rows = Object.entries(properties)
    .filter(([key, value]) => key !== 'id' && value !== null && value !== undefined && String(value) !== '')
    .slice(0, 6)
    .map(([key, value]) => `
      <div style="display:grid;grid-template-columns:96px 1fr;gap:8px;font-size:11px;line-height:1.35;">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#64748b;font-weight:700;">${escapeHtml(key)}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e2e8f0;">${escapeHtml(value)}</span>
      </div>
    `)
    .join('');

  const color = layer.style.markerColor || layer.style.color || layer.style.fillColor || '#60a5fa';

  return `
    <div style="min-width:192px;max-width:288px;border:1px solid #334155;background:#020617;color:#e2e8f0;padding:12px;border-radius:6px;box-shadow:0 20px 50px rgba(0,0,0,.45);">
      <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid #1e293b;padding-bottom:8px;margin-bottom:8px;">
        <span style="width:10px;height:10px;border-radius:999px;background:${escapeHtml(color)};flex:0 0 auto;"></span>
        <span style="font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(layer.display_name)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;">${rows}</div>
    </div>
  `;
}

export const DatasetGeoJsonLayer: React.FC<DatasetGeoJsonLayerProps> = ({
  layer,
  filters,
  pane,
  onPolygonClick,
}) => {
  const map = useMap();
  const [bbox, setBbox] = useState(() => bboxForMap(map));
  const [featureCollection, setFeatureCollection] = useState<GeoJSON.FeatureCollection | null>(null);
  const filterKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  useMapEvents({
    moveend: () => setBbox(bboxForMap(map)),
    zoomend: () => setBbox(bboxForMap(map)),
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      fetchDatasetLayerFeatures(layer.id, {
        bbox,
        filters,
        limit: 1800,
        tolerance: toleranceForZoom(map.getZoom()),
      })
        .then((data) => {
          if (!controller.signal.aborted) {
            setFeatureCollection(data);
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            console.error(`Failed to fetch dataset layer ${layer.id}`, error);
            setFeatureCollection(null);
          }
        });
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [bbox, filterKey, layer.id, map, filters]);

  const pathStyle = useMemo(() => {
    const style = layer.style || {};

    return {
      pane,
      color: style.color || style.markerColor || '#2563eb',
      fillColor: style.fillColor || style.color || '#93c5fd',
      fillOpacity: style.fillOpacity ?? (layer.geometry_family === 'polygon' ? 0.22 : 0),
      opacity: style.opacity ?? 0.86,
      weight: style.weight ?? (layer.geometry_family === 'line' ? 2 : 1.4),
    };
  }, [layer.geometry_family, layer.style, pane]);

  if (!featureCollection || featureCollection.features.length === 0) {
    return null;
  }

  return (
    <GeoJSON
      key={`${layer.id}-${bbox}-${filterKey}`}
      data={featureCollection as any}
      pane={pane}
      style={() => pathStyle}
      pointToLayer={(feature, latlng) => (
        L.circleMarker(latlng, {
          pane,
          radius: layer.style.radius || 5,
          color: layer.style.strokeColor || '#0f172a',
          weight: 1.5,
          fillColor: layer.style.markerColor || layer.style.color || '#2563eb',
          fillOpacity: layer.style.opacity ?? 0.92,
        }) as any
      )}
      onEachFeature={(feature, leafletLayer) => {
        leafletLayer.bindTooltip(tooltipHtml(layer, feature as GeoJSON.Feature), {
          sticky: true,
          opacity: 1,
          className: 'nffis-dataset-tooltip',
        });

        if (layer.geometry_family === 'polygon' && onPolygonClick) {
          leafletLayer.on('click', (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event.originalEvent);
            onPolygonClick(layer.id);
          });
        }
      }}
    />
  );
};
