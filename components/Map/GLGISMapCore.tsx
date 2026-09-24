import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  type IControl,
  type MapMouseEvent,
  type MapSourceDataEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import { BIH_CENTER } from '../../constants';
import { MapLayer } from '../../types';
import { fetchDatasetLayerFeatures, type DatasetLayer } from '../../services/datasetService';
import {
  EXTERNAL_BASE_LAYERS,
  NASA_FIRMS_LAYER,
  NASA_GIBS_WMS_URL,
  NASA_LAND_SURFACE_TEMPERATURE_LAYER,
  OPENSTREETMAP_BASE_LAYER,
  gibsObservationDate,
} from '../../lib/gis/externalMapLayers';
import { FOREST_RASTER_LAYERS, FOREST_WMS_URL } from '../../lib/gis/forestRasterLayers';
import { datasetTileQuery, mapLibreTileUrl, wmsTileUrl, type MapPerformanceMetrics } from '../../lib/gis/mapRendererPoc';
import { MapControls } from './MapControls';
import type { GISMapProps } from './GISMap';

export interface GLEngine {
  createMap: (options: Record<string, unknown>) => MapLibreMap;
  createNavigationControl: () => IControl;
  createScaleControl: () => IControl;
}

interface GLGISMapProps extends GISMapProps {
  engine: GLEngine;
  renderer: 'maplibre' | 'mapbox';
  configurationError?: string | null;
}

const BASE_LAYER_IDS = [
  MapLayer.SATELLITE,
  MapLayer.SATELLITE_CLARITY,
  MapLayer.SATELLITE_GOOGLE,
  MapLayer.SENTINEL,
  MapLayer.INFRARED,
  MapLayer.NASA_FIRMS,
  MapLayer.THERMAL,
  MapLayer.WINDY,
  MapLayer.TERRAIN,
];

const BASE_SOURCE_ID = 'poc-basemap-source';
const BASE_LAYER_ID = 'poc-basemap-layer';
const DATASET_PREFIX = 'poc-dataset-';
const WMS_PREFIX = 'poc-wms-';
const INCIDENT_SOURCE_ID = 'poc-incidents-source';
const INCIDENT_LAYER_PREFIX = 'poc-incidents-';
const BOSNIA_BOUNDS: [[number, number], [number, number]] = [[15.7, 42.5], [19.7, 45.4]];

function selectedBaseLayer(activeLayers: Set<MapLayer>) {
  const id = BASE_LAYER_IDS.find((candidate) => activeLayers.has(candidate));
  return (id && EXTERNAL_BASE_LAYERS[id]) || OPENSTREETMAP_BASE_LAYER;
}

function baseStyle(activeLayers: Set<MapLayer>): StyleSpecification {
  const base = selectedBaseLayer(activeLayers);
  return {
    version: 8,
    sources: {
      [BASE_SOURCE_ID]: {
        type: 'raster',
        tiles: [mapLibreTileUrl(base.url)],
        tileSize: 256,
        attribution: base.attribution,
        maxzoom: base.maxNativeZoom ?? 19,
      },
    },
    layers: [{ id: BASE_LAYER_ID, type: 'raster', source: BASE_SOURCE_ID }],
  };
}

function sourceId(layerId: number): string {
  return `${DATASET_PREFIX}${layerId}-source`;
}

function renderedLayerIds(layerId: number): string[] {
  return ['fill', 'line', 'circle'].map((kind) => `${DATASET_PREFIX}${layerId}-${kind}`);
}

function removeLayerAndSource(map: MapLibreMap, layerIds: string[], source: string): void {
  layerIds.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(source)) map.removeSource(source);
}

function removeByPrefix(map: MapLibreMap, layerPrefix: string, sourcePrefix = layerPrefix): void {
  const style = map.getStyle();
  [...(style.layers || [])].reverse().forEach((layer) => {
    if (layer.id.startsWith(layerPrefix) && map.getLayer(layer.id)) map.removeLayer(layer.id);
  });
  Object.keys(style.sources || {}).forEach((id) => {
    if (id.startsWith(sourcePrefix) && map.getSource(id)) map.removeSource(id);
  });
}

function categoryExpression(layer: DatasetLayer, property: 'color' | 'fillColor', fallback: string): unknown {
  const categorized = layer.style.renderer === 'categorized' ? layer.style.categorized : undefined;
  if (!categorized?.field || !categorized.categories.length) return fallback;

  const cases = categorized.categories
    .filter((category) => category.enabled !== false)
    .flatMap((category) => [String(category.value), category[property] || category.color || fallback]);

  return ['match', ['to-string', ['get', categorized.field]], ...cases, fallback];
}

function categoryOpacityExpression(layer: DatasetLayer, property: 'opacity' | 'fillOpacity', fallback: number): unknown {
  const categorized = layer.style.renderer === 'categorized' ? layer.style.categorized : undefined;
  if (!categorized?.field || !categorized.categories.length) return fallback;

  const cases = categorized.categories.flatMap((category) => [
    String(category.value),
    category.enabled === false ? 0 : category[property] ?? fallback,
  ]);
  return ['match', ['to-string', ['get', categorized.field]], ...cases, fallback];
}

function addDatasetStyleLayers(
  map: MapLibreMap,
  layer: DatasetLayer,
  source: string,
  vectorSourceLayer?: string,
): string[] {
  if (layer.style.renderer === 'none') return [];

  const ids = renderedLayerIds(layer.id);
  const common = vectorSourceLayer ? { source, 'source-layer': vectorSourceLayer } : { source };
  const color = categoryExpression(layer, 'color', layer.style.color || layer.style.markerColor || '#2563eb');
  const fillColor = categoryExpression(layer, 'fillColor', layer.style.fillColor || layer.style.color || '#60a5fa');

  if (layer.geometry_family === 'polygon' || layer.geometry_family === 'mixed') {
    map.addLayer({
      id: ids[0], type: 'fill', ...common,
      paint: {
        'fill-color': fillColor as never,
        'fill-opacity': categoryOpacityExpression(layer, 'fillOpacity', layer.style.fillOpacity ?? 0.24) as never,
      },
    });
    map.addLayer({
      id: ids[1], type: 'line', ...common,
      paint: {
        'line-color': color as never,
        'line-opacity': categoryOpacityExpression(layer, 'opacity', layer.style.opacity ?? 0.88) as never,
        'line-width': layer.style.weight ?? 1.4,
      },
    });
  } else if (layer.geometry_family === 'line') {
    map.addLayer({
      id: ids[1], type: 'line', ...common,
      paint: {
        'line-color': color as never,
        'line-opacity': categoryOpacityExpression(layer, 'opacity', layer.style.opacity ?? 0.88) as never,
        'line-width': layer.style.weight ?? 2,
      },
    });
  }

  if (layer.geometry_family === 'point' || layer.geometry_family === 'mixed') {
    map.addLayer({
      id: ids[2], type: 'circle', ...common,
      paint: {
        'circle-radius': layer.style.radius ?? 5,
        'circle-color': fillColor as never,
        'circle-opacity': categoryOpacityExpression(layer, 'opacity', layer.style.opacity ?? 0.92) as never,
        'circle-stroke-color': layer.style.strokeColor || '#0f172a',
        'circle-stroke-width': 1.5,
      },
    });
  }

  return ids.filter((id) => Boolean(map.getLayer(id)));
}

function mapBbox(map: MapLibreMap): string {
  const bounds = map.getBounds();
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    .map((value) => value.toFixed(6))
    .join(',');
}

function toleranceForZoom(zoom: number): number {
  if (zoom <= 7) return 0.003;
  if (zoom <= 9) return 0.0012;
  if (zoom <= 11) return 0.00035;
  return 0;
}

function datasetIntersectsViewport(map: MapLibreMap, layer: DatasetLayer): boolean {
  if (!layer.bounds) return true;
  const bounds = map.getBounds();
  return !(
    bounds.getEast() < layer.bounds.minx || bounds.getWest() > layer.bounds.maxx
    || bounds.getNorth() < layer.bounds.miny || bounds.getSouth() > layer.bounds.maxy
  );
}

function switchToLeaflet(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('mapRenderer', 'leaflet');
  window.location.assign(url.toString());
}

export const GLGISMapCore: React.FC<GLGISMapProps> = ({
  engine,
  renderer,
  configurationError = null,
  incidents,
  activeLayers,
  onReportClick,
  onCancelReport,
  isReporting,
  onToggleLayer,
  onSetBaseLayer,
  datasetLayers,
  activeDatasetLayerIds,
  datasetLayerFilters,
  datasetLayerRefreshKey,
  onDatasetPolygonClick,
  onDatasetLayerLoadingChange,
  isDarkMode,
  onToggleTheme,
  language,
  canViewMapLayers,
  canViewFwi,
  canViewFireMonitoring,
  canViewAws,
  geoEditorMode,
  onDatasetFeaturesLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const interactiveLayersRef = useRef<string[]>([]);
  const datasetByRenderedLayerRef = useRef<Map<string, DatasetLayer>>(new Map());
  const operationalMeasurementArmedRef = useRef(false);
  const clickStateRef = useRef({ isReporting, geoEditorMode, onReportClick, onDatasetPolygonClick });
  const [mapReady, setMapReady] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(configurationError);
  const [showLegend, setShowLegend] = useState(true);
  const [metrics, setMetrics] = useState<MapPerformanceMetrics>(() => ({
    renderer, startedAt: performance.now(), mapLoadMs: null,
    operationalMs: null, sourceErrors: 0, longTasks: 0, longTaskDurationMs: 0,
  }));
  const startTimeRef = useRef(metrics.startedAt);

  const activeDatasetLayers = useMemo(
    () => datasetLayers.filter((layer) => activeDatasetLayerIds.has(layer.id)),
    [activeDatasetLayerIds, datasetLayers],
  );
  const datasetSignature = useMemo(
    () => JSON.stringify(activeDatasetLayers.map((layer) => ({
      id: layer.id, delivery: layer.data_delivery, kind: layer.layer_kind,
      version: layer.tile_version, style: layer.style, filters: datasetLayerFilters[layer.id],
    }))),
    [activeDatasetLayers, datasetLayerFilters],
  );
  const activeLayerSignature = useMemo(() => [...activeLayers].sort().join('|'), [activeLayers]);

  useEffect(() => {
    clickStateRef.current = { isReporting, geoEditorMode, onReportClick, onDatasetPolygonClick };
  }, [geoEditorMode, isReporting, onDatasetPolygonClick, onReportClick]);

  useEffect(() => {
    window.__NFFIS_MAP_METRICS__ = metrics;
  }, [metrics]);

  useEffect(() => {
    if (!containerRef.current || configurationError) return;

    let map: MapLibreMap;
    try {
      map = engine.createMap({
        container: containerRef.current,
        style: baseStyle(activeLayers),
        center: [BIH_CENTER[1], BIH_CENTER[0]],
        zoom: 7,
        attributionControl: { compact: true },
        canvasContextAttributes: { powerPreference: 'high-performance' },
      });
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'WebGL2 initialization failed.');
      return;
    }

    mapRef.current = map;
    map.addControl(engine.createNavigationControl(), 'bottom-right');
    map.addControl(engine.createScaleControl(), 'bottom-left');

    const onLoad = () => {
      setMapReady(true);
      setMetrics((current) => ({ ...current, mapLoadMs: performance.now() - startTimeRef.current }));
    };
    const onIdle = () => {
      if (!operationalMeasurementArmedRef.current) return;
      setMetrics((current) => current.operationalMs === null
        ? { ...current, operationalMs: performance.now() - startTimeRef.current }
        : current);
    };
    const onError = (event: ErrorEvent | MapSourceDataEvent) => {
      console.warn(`[${renderer} POC] map source/render error`, event);
      setMetrics((current) => ({ ...current, sourceErrors: current.sourceErrors + 1 }));
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFatalError('The WebGL context was lost. Use the Leaflet fallback or reload the map.');
    };
    const onMapClick = (event: MapMouseEvent) => {
      const clickState = clickStateRef.current;
      if (clickState.isReporting) {
        clickState.onReportClick(event.lngLat.lat, event.lngLat.lng);
        return;
      }
      if (clickState.geoEditorMode === 'draw' || clickState.geoEditorMode === 'edit-shared') return;
      const visibleIds = interactiveLayersRef.current.filter((id) => Boolean(map.getLayer(id)));
      if (!visibleIds.length) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: visibleIds })[0];
      if (!feature) return;
      const dataset = datasetByRenderedLayerRef.current.get(feature.layer.id);
      if (!dataset) return;
      clickState.onDatasetPolygonClick(dataset.id, {
        type: 'Feature', id: feature.id ?? feature.properties?.id,
        properties: feature.properties || {}, geometry: feature.geometry,
      });
    };

    map.on('load', onLoad);
    map.on('idle', onIdle);
    map.on('error', onError as never);
    map.on('click', onMapClick);
    map.getCanvas().addEventListener('webglcontextlost', onContextLost);

    let observer: PerformanceObserver | null = null;
    if ('PerformanceObserver' in window) {
      try {
        observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          setMetrics((current) => ({
            ...current,
            longTasks: current.longTasks + entries.length,
            longTaskDurationMs: current.longTaskDurationMs + entries.reduce((sum, entry) => sum + entry.duration, 0),
          }));
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch {
        observer = null;
      }
    }

    return () => {
      observer?.disconnect();
      map.getCanvas().removeEventListener('webglcontextlost', onContextLost);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // The renderer instance is intentionally stable; prop-driven behavior is
    // synchronized by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const base = selectedBaseLayer(activeLayers);
    removeLayerAndSource(map, [BASE_LAYER_ID], BASE_SOURCE_ID);
    map.addSource(BASE_SOURCE_ID, {
      type: 'raster', tiles: [mapLibreTileUrl(base.url)], tileSize: 256,
      attribution: base.attribution, maxzoom: base.maxNativeZoom ?? 19,
    });
    const firstLayer = map.getStyle().layers?.[0]?.id;
    map.addLayer({ id: BASE_LAYER_ID, type: 'raster', source: BASE_SOURCE_ID }, firstLayer);
  }, [activeLayerSignature, activeLayers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let disposed = false;
    let timer: number | null = null;
    let controllers: AbortController[] = [];

    const synchronize = async () => {
      controllers.forEach((controller) => controller.abort());
      controllers = [];
      removeByPrefix(map, DATASET_PREFIX);
      interactiveLayersRef.current = [];
      datasetByRenderedLayerRef.current.clear();

      for (const layer of activeDatasetLayers) {
        if (disposed || (layer.min_zoom != null && map.getZoom() < layer.min_zoom) || !datasetIntersectsViewport(map, layer)) {
          onDatasetFeaturesLoaded(layer.id, null);
          onDatasetLayerLoadingChange(layer.id, false);
          continue;
        }

        const source = sourceId(layer.id);
        onDatasetLayerLoadingChange(layer.id, true);
        try {
          let interactiveIds: string[] = [];
          if (layer.layer_kind === 'raster') {
            const id = `${DATASET_PREFIX}${layer.id}-raster`;
            map.addSource(source, {
              type: 'raster', tiles: [`/api/dataset-layers/${layer.id}/raster-tiles/{z}/{x}/{y}.png`],
              tileSize: 256, minzoom: layer.min_zoom ?? 0, maxzoom: 22,
            });
            map.addLayer({ id, type: 'raster', source, paint: { 'raster-opacity': layer.style.opacity ?? 0.9 } });
          } else if (layer.data_delivery === 'vector_tile') {
            const query = datasetTileQuery(layer.tile_version || '1', datasetLayerFilters[layer.id]);
            map.addSource(source, {
              type: 'vector',
              tiles: [`/api/dataset-layers/${layer.id}/tiles/{z}/{x}/{y}.pbf?${query}`],
              minzoom: layer.min_zoom ?? 0, maxzoom: 22, promoteId: 'id',
            });
            interactiveIds = addDatasetStyleLayers(map, layer, source, 'dataset');
            onDatasetFeaturesLoaded(layer.id, null);
          } else {
            const controller = new AbortController();
            controllers.push(controller);
            const collection = await fetchDatasetLayerFeatures(layer.id, {
              bbox: mapBbox(map), filters: datasetLayerFilters[layer.id], limit: 1800,
              tolerance: toleranceForZoom(map.getZoom()), signal: controller.signal,
            });
            if (disposed || controller.signal.aborted) continue;
            map.addSource(source, { type: 'geojson', data: collection, promoteId: 'id' });
            interactiveIds = addDatasetStyleLayers(map, layer, source);
            onDatasetFeaturesLoaded(layer.id, collection);
          }

          interactiveIds.forEach((id) => datasetByRenderedLayerRef.current.set(id, layer));
          interactiveLayersRef.current.push(...interactiveIds);
          onDatasetLayerLoadingChange(layer.id, false);
        } catch (error) {
          if (!disposed && (error as Error).name !== 'AbortError') {
            console.error(`[${renderer} POC] failed to render dataset ${layer.id}`, error);
            onDatasetFeaturesLoaded(layer.id, null);
            onDatasetLayerLoadingChange(layer.id, false);
          }
        }
      }
      operationalMeasurementArmedRef.current = true;
    };
    const queueSynchronize = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void synchronize(), 140);
    };

    void synchronize();
    map.on('moveend', queueSynchronize);
    return () => {
      disposed = true;
      if (timer !== null) window.clearTimeout(timer);
      controllers.forEach((controller) => controller.abort());
      map.off('moveend', queueSynchronize);
    };
  }, [activeDatasetLayers, datasetLayerFilters, datasetLayerRefreshKey, datasetSignature, mapReady, onDatasetFeaturesLoaded, onDatasetLayerLoadingChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    removeByPrefix(map, WMS_PREFIX);

    const addWms = (id: string, url: string, opacity: number, attribution: string) => {
      const source = `${id}-source`;
      map.addSource(source, { type: 'raster', tiles: [url], tileSize: 256, attribution });
      map.addLayer({ id, type: 'raster', source, paint: { 'raster-opacity': opacity } });
    };
    const date = gibsObservationDate();
    if (activeLayers.has(MapLayer.NASA_FIRMS)) {
      addWms(`${WMS_PREFIX}nasa-firms`, wmsTileUrl(NASA_GIBS_WMS_URL, NASA_FIRMS_LAYER, { time: date }), 0.95, 'NASA EOSDIS GIBS / FIRMS');
    }
    if (activeLayers.has(MapLayer.THERMAL)) {
      addWms(`${WMS_PREFIX}nasa-lst`, wmsTileUrl(NASA_GIBS_WMS_URL, NASA_LAND_SURFACE_TEMPERATURE_LAYER, { time: date }), 0.72, 'NASA EOSDIS GIBS');
    }
    FOREST_RASTER_LAYERS.filter((layer) => activeLayers.has(layer.id)).forEach((layer) => {
      const baseUrl = layer.wmsUrl || FOREST_WMS_URL;
      if (!baseUrl || !layer.wmsLayerName) return;
      addWms(`${WMS_PREFIX}forest-${layer.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`, wmsTileUrl(baseUrl, layer.wmsLayerName), layer.opacity, layer.attribution);
    });
  }, [activeLayerSignature, activeLayers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    removeLayerAndSource(map, [`${INCIDENT_LAYER_PREFIX}fire`, `${INCIDENT_LAYER_PREFIX}flood`], INCIDENT_SOURCE_ID);
    map.addSource(INCIDENT_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: incidents.map((incident) => ({
          type: 'Feature', properties: { type: incident.type, urgency: incident.urgency },
          geometry: { type: 'Point', coordinates: [incident.lng, incident.lat] },
        })),
      },
    });
    if (activeLayers.has(MapLayer.FIRE_RISK)) {
      map.addLayer({
        id: `${INCIDENT_LAYER_PREFIX}fire`, type: 'heatmap', source: INCIDENT_SOURCE_ID,
        filter: ['==', ['get', 'type'], 'FIRE'],
        paint: {
          'heatmap-radius': 46, 'heatmap-intensity': 1,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(253,230,138,0)', 0.35, '#fb923c', 0.7, '#ef4444', 1, '#7f1d1d'],
          'heatmap-opacity': 0.85,
        },
      });
    }
    if (activeLayers.has(MapLayer.FLOOD_RISK)) {
      map.addLayer({
        id: `${INCIDENT_LAYER_PREFIX}flood`, type: 'heatmap', source: INCIDENT_SOURCE_ID,
        filter: ['==', ['get', 'type'], 'FLOOD'],
        paint: {
          'heatmap-radius': 34,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(96,165,250,0)', 0.4, '#3b82f6', 0.75, '#2563eb', 1, '#1e3a8a'],
          'heatmap-opacity': 0.8,
        },
      });
    }
  }, [activeLayerSignature, activeLayers, incidents, mapReady]);

  const fitBosnia = useCallback(() => {
    mapRef.current?.fitBounds(BOSNIA_BOUNDS, { padding: 36, duration: 700 });
  }, []);

  if (fatalError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-lg rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-widest text-red-400">MapLibre unavailable</div>
          <p className="mt-3 text-sm text-slate-300">{fatalError}</p>
          <button onClick={switchToLeaflet} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500">Return to Leaflet</button>
        </div>
      </div>
    );
  }

  return (
      <div className="relative h-full min-h-0 w-full" data-map-renderer={renderer}>
      <div ref={containerRef} className="h-full w-full" style={{ background: isDarkMode ? '#0f172a' : '#f8fafc' }} />

      <div className="pointer-events-none absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[2000] md:left-20 md:right-auto md:top-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-cyan-500/40 bg-slate-950/90 px-4 py-2 text-[10px] font-bold text-slate-300 shadow-2xl backdrop-blur-md">
          <span className="uppercase tracking-widest text-cyan-400">{renderer === 'mapbox' ? 'Mapbox POC' : 'MapLibre POC'}</span>
          <span>load {metrics.mapLoadMs === null ? '…' : `${Math.round(metrics.mapLoadMs)} ms`}</span>
          <span>idle {metrics.operationalMs === null ? '…' : `${Math.round(metrics.operationalMs)} ms`}</span>
          <span>errors {metrics.sourceErrors}</span>
          <span>long tasks {metrics.longTasks}</span>
          <button onClick={switchToLeaflet} className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-600">Use Leaflet</button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-[1900] -translate-x-1/2">
        <div className="pointer-events-auto rounded-lg border border-amber-500/30 bg-slate-950/85 px-3 py-2 text-center text-[10px] font-semibold text-amber-200 shadow-xl backdrop-blur">
          {geoEditorMode === 'view'
            ? 'Comparison build: wind, AWS, FWI GeoTIFF and geometry editing still use the Leaflet fallback.'
            : 'Geometry editing is not enabled in the comparison renderer.'}
          {geoEditorMode !== 'view' && <button onClick={switchToLeaflet} className="ml-2 rounded bg-amber-500/20 px-2 py-1 text-white hover:bg-amber-500/30">Switch to Leaflet</button>}
        </div>
      </div>

      <MapControls
        containerRef={controlsRef}
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer}
        onSetBaseLayer={onSetBaseLayer}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend((value) => !value)}
        language={language}
        onFitBosnia={fitBosnia}
        canViewMapLayers={canViewMapLayers}
        canViewFwi={false}
        canViewFireMonitoring={false}
        canViewAws={false}
      />

      {isReporting && (
        <div className="absolute left-4 right-4 top-28 z-[2500] rounded-xl border border-blue-400 bg-blue-600 p-3 text-sm font-bold text-white shadow-2xl md:left-20 md:right-auto">
          Select the incident location on the map.
          <button onClick={onCancelReport} className="ml-4 rounded bg-white/15 px-2 py-1 hover:bg-white/25">Cancel</button>
        </div>
      )}
    </div>
  );
};
