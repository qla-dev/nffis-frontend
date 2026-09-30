import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  type IControl,
  type MapMouseEvent,
  type MapSourceDataEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import { ChevronRight, Info, Trees } from 'lucide-react';
import { BIH_CENTER, REGION_STYLES, TRANSLATIONS } from '../../constants';
import { Language, MapLayer, RegionType, type OpenMeteoResponse } from '../../types';
import { fetchDatasetLayerEditFeatures, fetchDatasetLayerFeatures, type DatasetLayer } from '../../services/datasetService';
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
import { shouldUseVectorTiles } from '../../lib/gis/datasetLayerLoading';
import type { GISMapProps } from './GISMap';
import { MapControls } from './MapControls';
import { MapboxOperationalLayers } from './MapboxOperationalLayers';
import { fetchFwiAvailability, type FireWeatherProduct } from '../../services/fireMonitoringService';
import { BH_FWI_CSS_GRADIENT } from '../../lib/fwi/bhFwiColorScale';
import { recordApiUsage } from '../../services/apiUsageService';

export interface GLEngine {
  createMap: (options: Record<string, unknown>) => MapLibreMap;
  createNavigationControl: () => IControl;
  createScaleControl: () => IControl;
  createMarker: (element: HTMLElement) => {
    setLngLat: (point: [number, number]) => unknown;
    addTo: (map: MapLibreMap) => unknown;
    remove: () => void;
  };
  createPopup: () => {
    setLngLat: (point: [number, number]) => unknown;
    setHTML: (html: string) => unknown;
    setDOMContent: (element: HTMLElement) => unknown;
    addTo: (map: MapLibreMap) => unknown;
    on: (event: string, handler: () => void) => unknown;
    remove: () => void;
  };
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
const MAPBOX_TERRAIN_SOURCE_ID = 'nffis-mapbox-terrain-dem';
const MAPBOX_HILLSHADE_LAYER_ID = 'nffis-mapbox-terrain-hillshade';
const LEGEND_ICON_PATHS: Record<string, string> = {
  tree: `<path d="M12 19v3"/><path d="M12 19h-3a9 9 0 0 1 0-18h6a9 9 0 0 1 0 18h-3"/>`,
  pine: `<path d="m8 14 4-9 4 9"/><path d="m10 14-3 9"/><path d="m14 14 3 9"/>`,
  mixed: `<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .9-1.7l-2.6-5a1 1 0 0 0-1.8 0l-2.6 5a1 1 0 0 0 .9 1.7h.2l-1.4 2.5"/>`,
  shrub: `<path d="M12 22v-9"/><path d="M6.06 14a4 4 0 0 1 7.15-2.73"/><path d="M12.8 11.27a4 4 0 0 1 5.14 8.73"/><path d="M18.66 16.32a4 4 0 0 1-1.37 5.68"/><path d="M4.69 13.9a4 4 0 0 0-.25 7.84"/>`,
  sprout: `<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .5-3.5 1.3-3.5 1.3s-.9-2.4 0-4.6c.9-2.1 2.2-2 2.2-2"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
};
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

export const GLGISMapCore: React.FC<GLGISMapProps> = (allProps) => {
  const {
    engine,
    renderer,
    configurationError = null,
    ...gisMapProps
  } = allProps;
  const {
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
  canViewFbih,
  canViewRs,
  useCyrillicStationNames,
  canAdjustAws,
  geoEditorMode,
  onDatasetFeaturesLoaded,
  } = gisMapProps;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const interactiveLayersRef = useRef<string[]>([]);
  const datasetByRenderedLayerRef = useRef<Map<string, DatasetLayer>>(new Map());
  const datasetCallbacksRef = useRef({ onDatasetFeaturesLoaded, onDatasetLayerLoadingChange });
  const operationalMeasurementArmedRef = useRef(false);
  const clickStateRef = useRef({ isReporting, isPickingWeather: false, geoEditorMode, onReportClick, onDatasetPolygonClick });
  const [mapReady, setMapReady] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(configurationError);
  const [showLegend, setShowLegend] = useState(true);
  const [fwiArchive, setFwiArchive] = useState<FireWeatherProduct[]>([]);
  const [fwiIndex, setFwiIndex] = useState(0);
  const [fwiPlaying, setFwiPlaying] = useState(false);
  const [isPickingWeather, setIsPickingWeather] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<OpenMeteoResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
  const selectedBase = useMemo(() => selectedBaseLayer(activeLayers), [activeLayerSignature]);
  const baseLayerSignature = `${selectedBase.url}|${selectedBase.maxNativeZoom ?? 19}|${selectedBase.attribution}`;
  const renderedBaseSignatureRef = useRef(baseLayerSignature);
  const wmsLayerSignature = useMemo(() => [
    activeLayers.has(MapLayer.NASA_FIRMS),
    activeLayers.has(MapLayer.THERMAL),
    ...FOREST_RASTER_LAYERS.map((layer) => activeLayers.has(layer.id)),
  ].map(Number).join('|'), [activeLayerSignature]);
  const incidentLayerSignature = `${Number(activeLayers.has(MapLayer.FIRE_RISK))}|${Number(activeLayers.has(MapLayer.FLOOD_RISK))}`;
  const terrainEnabled = activeLayers.has(MapLayer.TERRAIN);
  const fwiVisible = canViewFwi && (activeLayers.has(MapLayer.FWI_BOSNIAN) || activeLayers.has(MapLayer.FIRE_INTELLIGENCE_FWI));
  const t = TRANSLATIONS[language];

  useEffect(() => {
    datasetCallbacksRef.current = { onDatasetFeaturesLoaded, onDatasetLayerLoadingChange };
  }, [onDatasetFeaturesLoaded, onDatasetLayerLoadingChange]);

  useEffect(() => {
    if (!fwiVisible) { setFwiPlaying(false); return; }
    const controller = new AbortController();
    fetchFwiAvailability(92, controller.signal).then(({ data }) => {
      const products = data.filter(product => product.product_kind === 'historical_reanalysis');
      setFwiArchive(products);
      setFwiIndex(Math.max(0, products.length - 1));
    }).catch(error => { if ((error as Error).name !== 'AbortError') console.warn('FWI archive unavailable', error); });
    return () => controller.abort();
  }, [fwiVisible]);

  useEffect(() => {
    if (!fwiPlaying || fwiArchive.length < 2) return;
    const timer = window.setInterval(() => setFwiIndex(index => (index + 1) % fwiArchive.length), 1400);
    return () => window.clearInterval(timer);
  }, [fwiArchive.length, fwiPlaying]);

  useEffect(() => {
    const map = mapRef.current;
    const layerId = gisMapProps.geoEditorLayerId;
    if (!mapReady || !map || layerId === null || gisMapProps.geoEditorMode === 'view') return;
    const controller = new AbortController();
    fetchDatasetLayerEditFeatures(layerId, { bbox: mapBbox(map), limit: 5000, signal: controller.signal })
      .then(features => { if (!controller.signal.aborted) gisMapProps.onDatasetEditorFeaturesLoaded(layerId, features); })
      .catch(error => {
        if (controller.signal.aborted) return;
        console.error(`Failed to load editing geometry for dataset layer ${layerId}`, error);
        gisMapProps.onDatasetEditorLoadError(error instanceof Error ? error.message : 'Unable to load editing geometry.');
      });
    return () => controller.abort();
  }, [gisMapProps.geoEditorLayerId, gisMapProps.geoEditorMode, gisMapProps.onDatasetEditorFeaturesLoaded, gisMapProps.onDatasetEditorLoadError, mapReady]);
  useEffect(() => {
    clickStateRef.current = { isReporting, isPickingWeather, geoEditorMode, onReportClick, onDatasetPolygonClick };
  }, [geoEditorMode, isPickingWeather, isReporting, onDatasetPolygonClick, onReportClick]);

  useEffect(() => {
    if (!weatherLocation) { setWeather(null); return; }
    const controller = new AbortController();
    setWeatherLoading(true);
    const { lat, lng } = weatherLocation;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
      .then(setWeather)
      .catch(error => { if ((error as Error).name !== 'AbortError') console.warn('Weather unavailable', error); })
      .finally(() => { if (!controller.signal.aborted) setWeatherLoading(false); });
    return () => controller.abort();
  }, [weatherLocation]);

  useEffect(() => {
    window.__NFFIS_MAP_METRICS__ = metrics;
  }, [metrics]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !userLocation) return;
    const element = document.createElement('div');
    element.setAttribute('aria-label', 'My location');
    element.style.cssText = 'width:16px;height:16px;border-radius:999px;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 8px rgba(59,130,246,.2),0 4px 14px rgba(15,23,42,.45)';
    const marker = engine.createMarker(element).setLngLat(userLocation).addTo(map);
    return () => marker.remove();
  }, [engine, mapReady, userLocation]);

  useEffect(() => {
    if (!containerRef.current || configurationError) return;

    let map: MapLibreMap;
    try {
      map = engine.createMap({
        container: containerRef.current,
        style: baseStyle(activeLayers),
        center: [BIH_CENTER[1], BIH_CENTER[0]],
        zoom: 7,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
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
      if (renderer === 'mapbox') recordApiUsage('mapbox', 'map_loads');
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
      console.warn(`[${renderer}] map source/render error`, event);
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
      if (clickState.isPickingWeather) {
        setWeatherLocation({
          name: language === Language.BS ? 'Odabrana lokacija' : 'Selected location',
          lat: event.lngLat.lat,
          lng: event.lngLat.lng,
        });
        setIsPickingWeather(false);
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
    const base = selectedBase;
    const nextUrl = mapLibreTileUrl(base.url);
    if (renderedBaseSignatureRef.current === baseLayerSignature) return;
    removeLayerAndSource(map, [BASE_LAYER_ID], BASE_SOURCE_ID);
    map.addSource(BASE_SOURCE_ID, {
      type: 'raster', tiles: [nextUrl], tileSize: 256,
      attribution: base.attribution, maxzoom: base.maxNativeZoom ?? 19,
    });
    const firstLayer = map.getStyle().layers?.[0]?.id;
    map.addLayer({ id: BASE_LAYER_ID, type: 'raster', source: BASE_SOURCE_ID }, firstLayer);
    renderedBaseSignatureRef.current = baseLayerSignature;
  }, [baseLayerSignature, mapReady, selectedBase]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || renderer !== 'mapbox') return;

    const mapboxMap = map as MapLibreMap & {
      setTerrain: (terrain: { source: string; exaggeration?: number } | null) => void;
      easeTo: (options: { pitch: number; duration: number }) => void;
    };

    if (terrainEnabled) {
      if (!map.getSource(MAPBOX_TERRAIN_SOURCE_ID)) {
        map.addSource(MAPBOX_TERRAIN_SOURCE_ID, {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        } as never);
      }
      if (!map.getLayer(MAPBOX_HILLSHADE_LAYER_ID)) {
        const firstOverlay = map.getStyle().layers?.find((layer) => layer.id.startsWith(DATASET_PREFIX) || layer.id.startsWith(WMS_PREFIX))?.id;
        map.addLayer({
          id: MAPBOX_HILLSHADE_LAYER_ID,
          type: 'hillshade',
          source: MAPBOX_TERRAIN_SOURCE_ID,
          paint: {
            'hillshade-exaggeration': 0.42,
            'hillshade-shadow-color': '#0f172a',
            'hillshade-highlight-color': '#f8fafc',
          },
        } as never, firstOverlay);
      }
      mapboxMap.setTerrain({ source: MAPBOX_TERRAIN_SOURCE_ID, exaggeration: 1.25 });
      mapboxMap.easeTo({ pitch: 45, duration: 650 });
      return;
    }

    mapboxMap.setTerrain(null);
    if (map.getLayer(MAPBOX_HILLSHADE_LAYER_ID)) map.removeLayer(MAPBOX_HILLSHADE_LAYER_ID);
    if (map.getSource(MAPBOX_TERRAIN_SOURCE_ID)) map.removeSource(MAPBOX_TERRAIN_SOURCE_ID);
    if (map.getPitch() !== 0) mapboxMap.easeTo({ pitch: 0, duration: 450 });
  }, [mapReady, renderer, terrainEnabled]);

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
          datasetCallbacksRef.current.onDatasetFeaturesLoaded(layer.id, null);
          datasetCallbacksRef.current.onDatasetLayerLoadingChange(layer.id, false);
          continue;
        }

        const source = sourceId(layer.id);
        datasetCallbacksRef.current.onDatasetLayerLoadingChange(layer.id, true);
        try {
          let interactiveIds: string[] = [];
          if (layer.layer_kind === 'raster') {
            const id = `${DATASET_PREFIX}${layer.id}-raster`;
            map.addSource(source, {
              type: 'raster', tiles: [`/api/dataset-layers/${layer.id}/raster-tiles/{z}/{x}/{y}.png`],
              tileSize: 256, minzoom: layer.min_zoom ?? 0, maxzoom: 22,
            });
            map.addLayer({ id, type: 'raster', source, paint: { 'raster-opacity': layer.style.opacity ?? 0.9 } });
          } else if (shouldUseVectorTiles(layer)) {
            const query = datasetTileQuery(layer.tile_version || '1', datasetLayerFilters[layer.id]);
            map.addSource(source, {
              type: 'vector',
              tiles: [`/api/dataset-layers/${layer.id}/tiles/{z}/{x}/{y}.pbf?${query}`],
              minzoom: layer.min_zoom ?? 0, maxzoom: 22, promoteId: 'id',
            });
            interactiveIds = addDatasetStyleLayers(map, layer, source, 'dataset');
            datasetCallbacksRef.current.onDatasetFeaturesLoaded(layer.id, null);
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
            datasetCallbacksRef.current.onDatasetFeaturesLoaded(layer.id, collection);
          }

          interactiveIds.forEach((id) => datasetByRenderedLayerRef.current.set(id, layer));
          interactiveLayersRef.current.push(...interactiveIds);
          datasetCallbacksRef.current.onDatasetLayerLoadingChange(layer.id, false);
        } catch (error) {
          if (!disposed && (error as Error).name !== 'AbortError') {
            console.error(`[${renderer}] failed to render dataset ${layer.id}`, error);
            datasetCallbacksRef.current.onDatasetFeaturesLoaded(layer.id, null);
            datasetCallbacksRef.current.onDatasetLayerLoadingChange(layer.id, false);
          }
        }
      }
      operationalMeasurementArmedRef.current = true;
      if (map.areTilesLoaded()) {
        setMetrics(current => current.operationalMs === null
          ? { ...current, operationalMs: performance.now() - startTimeRef.current }
          : current);
      }
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
  }, [activeDatasetLayers, datasetLayerFilters, datasetLayerRefreshKey, datasetSignature, mapReady, renderer]);

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
  }, [mapReady, wmsLayerSignature]);

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
  }, [incidentLayerSignature, incidents, mapReady]);

  if (fatalError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-lg rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-widest text-red-400">{renderer === 'mapbox' ? 'Mapbox unavailable' : 'MapLibre unavailable'}</div>
          <p className="mt-3 text-sm text-slate-300">{fatalError}</p>
          <button onClick={switchToLeaflet} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500">Return to Leaflet</button>
        </div>
      </div>
    );
  }

  return (
      <div className="relative h-full min-h-0 w-full" data-map-renderer={renderer}>
      <div ref={containerRef} className="h-full w-full" style={{ background: isDarkMode ? '#0f172a' : '#f8fafc' }} />

      {mapReady && mapRef.current && (
        <>
          <MapboxOperationalLayers
            map={mapRef.current}
            activeLayers={activeLayers}
            canViewMapLayers={canViewMapLayers}
            canViewFwi={canViewFwi}
            canViewFireMonitoring={canViewFireMonitoring}
            canViewAws={canViewAws}
            canViewFbih={canViewFbih}
            canViewRs={canViewRs}
            useCyrillicStationNames={useCyrillicStationNames}
            canAdjustAws={canAdjustAws}
            createMarker={engine.createMarker as never}
            createPopup={engine.createPopup as never}
            onLocationSelect={setWeatherLocation}
            selectedFwiProductId={fwiArchive[fwiIndex]?.id}
            geoEditorMode={gisMapProps.geoEditorMode}
            geoEditorFeatures={gisMapProps.geoEditorFeatures}
            geoEditorSelectedFeatureId={gisMapProps.geoEditorSelectedFeatureId}
            geoEditorDrawing={gisMapProps.geoEditorDrawing}
            geoEditorSnappingEnabled={gisMapProps.geoEditorSnappingEnabled}
            geoEditorShowDraft={gisMapProps.geoEditorShowDraft}
            onGeoEditorDrawingChange={gisMapProps.onGeoEditorDrawingChange}
            onGeoEditorFeaturesChange={gisMapProps.onGeoEditorFeaturesChange}
          />
        </>
      )}

      <div className="pointer-events-none absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[2000] md:left-20 md:right-auto md:top-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-cyan-500/40 bg-slate-950/90 px-4 py-2 text-[10px] font-bold text-slate-300 shadow-2xl backdrop-blur-md">
          <span className="uppercase tracking-widest text-cyan-400">{renderer === 'mapbox' ? 'Mapbox GL' : 'MapLibre GL'}</span>
          <span>load {metrics.mapLoadMs === null ? '…' : `${Math.round(metrics.mapLoadMs)} ms`}</span>
          <span>idle {metrics.operationalMs === null ? '…' : `${Math.round(metrics.operationalMs)} ms`}</span>
          <span>errors {metrics.sourceErrors}</span>
          <span>long tasks {metrics.longTasks}</span>
          <button onClick={switchToLeaflet} className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-600">Use Leaflet</button>
        </div>
      </div>

      <MapControls
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer}
        onSetBaseLayer={onSetBaseLayer}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(value => !value)}
        language={language}
        onStartPickingLocation={() => setIsPickingWeather(true)}
        onFitBosnia={() => mapRef.current?.fitBounds([[15.7, 42.5], [19.7, 45.4]], { padding: 36, duration: 700 })}
        canViewMapLayers={canViewMapLayers}
        canViewFwi={canViewFwi}
        canViewFireMonitoring={canViewFireMonitoring}
        canViewAws={canViewAws}
      />

      {showLegend && (
        <div className="pointer-events-none absolute bottom-28 left-4 right-4 z-[1900] flex flex-row gap-2 md:bottom-8 md:left-[4.5rem] md:right-auto md:flex-col">
          <div className="pointer-events-auto order-1 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-[10px] font-bold text-slate-400 shadow-2xl backdrop-blur-md md:order-2 md:min-w-[160px] md:flex-none">
            <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Info size={14} className="text-blue-500"/><span className="font-black uppercase tracking-widest text-slate-500">{t.gisLegend}</span></div><button type="button" onClick={() => setShowLegend(false)} className="text-slate-600 hover:text-slate-400 md:hidden" aria-label="Close legend"><ChevronRight size={12} className="rotate-90"/></button></div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"/>{t.legend.activeFire}</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"/>{t.legend.activeFlood}</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-blue-500"/>{t.legend.sensorStation}</div>
              <div className="mt-1 border-t border-slate-800/50 pt-1"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/>{t.legend.liveData}</div></div>
            </div>
          </div>
          <div className="pointer-events-auto order-2 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-[10px] font-bold text-slate-400 shadow-2xl backdrop-blur-md md:order-1 md:min-w-[160px] md:flex-none">
            <div className="mb-3 flex items-center gap-2"><Trees size={14} className="text-emerald-500"/><span className="font-black uppercase tracking-widest text-slate-500">{t.classLegend}</span></div>
            <div className="space-y-2">{Object.values(RegionType).map((type) => { const style=REGION_STYLES[type]; const path=LEGEND_ICON_PATHS[style.iconType] || LEGEND_ICON_PATHS.tree; return <div key={type} className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:path}}/>{t.regionTypes[type]}</div>; })}</div>
          </div>
        </div>
      )}

      {fwiVisible && (
        <div className="absolute bottom-8 right-24 z-[1900] hidden w-80 rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-md md:block">
          <div className="flex items-center justify-between text-[11px] font-black"><span>NFFIS FWI · EFFIS scale</span><span className="text-slate-400">{fwiArchive[fwiIndex]?.valid_at?.slice(0, 10) ?? 'Current'}</span></div>
          <div className="mt-3 h-3 rounded-full" style={{ background: BH_FWI_CSS_GRADIENT }} />
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => setFwiPlaying(value => !value)} className="rounded border border-slate-700 px-3 py-1 text-[10px] font-bold hover:border-orange-400">{fwiPlaying ? 'Pause' : 'Time-lapse'}</button>
            <input className="min-w-0 flex-1 accent-orange-500" type="range" min={0} max={Math.max(0, fwiArchive.length - 1)} value={Math.min(fwiIndex, Math.max(0, fwiArchive.length - 1))} onChange={event => { setFwiPlaying(false); setFwiIndex(Number(event.target.value)); }} />
          </div>
        </div>
      )}

      {isReporting && (
        <div className="absolute left-20 top-20 z-[2500] rounded-xl border border-blue-400 bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          Select the incident location on the map.
          <button onClick={onCancelReport} className="ml-4 rounded bg-white/15 px-2 py-1 hover:bg-white/25">Cancel</button>
        </div>
      )}

      {isPickingWeather && (
        <div className="absolute left-20 top-20 z-[2500] rounded-xl border border-cyan-400 bg-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          Click the map to calculate local fire weather.
          <button onClick={() => setIsPickingWeather(false)} className="ml-4 rounded bg-white/15 px-2 py-1">Cancel</button>
        </div>
      )}

      {weatherLocation && (
        <div className="fixed inset-0 z-[4000] overflow-y-auto bg-slate-950/95 p-6 text-white backdrop-blur-sm md:pl-24">
          <button onClick={() => setWeatherLocation(null)} className="fixed right-6 top-6 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xl">×</button>
          <div className="mx-auto max-w-5xl pt-12">
            <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-400">Fire weather location</div>
            <h2 className="mt-2 text-4xl font-black">{weatherLocation.name}</h2>
            <div className="mt-2 font-mono text-sm text-slate-400">{weatherLocation.lat.toFixed(4)}, {weatherLocation.lng.toFixed(4)}</div>
            {weatherLoading || !weather ? <div className="mt-16 text-slate-400">Loading weather…</div> : <>
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ['Temperature', `${Math.round(weather.current.temperature_2m)} °C`],
                  ['Feels like', `${Math.round(weather.current.apparent_temperature)} °C`],
                  ['Humidity', `${weather.current.relative_humidity_2m}%`],
                  ['Wind', `${weather.current.wind_speed_10m} km/h`],
                  ['Gusts', `${weather.current.wind_gusts_10m} km/h`],
                  ['Pressure', `${Math.round(weather.current.pressure_msl)} hPa`],
                  ['Precipitation', `${weather.current.precipitation} mm`],
                  ['Wind direction', `${weather.current.wind_direction_10m}°`],
                ].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>)}
              </div>
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">7-day forecast</div><div className="grid grid-cols-2 gap-3 md:grid-cols-7">{weather.daily.time.slice(0,7).map((day,index)=><div key={day} className="rounded-xl bg-slate-950 p-3 text-center"><div className="text-[10px] text-slate-500">{day.slice(5)}</div><div className="mt-2 font-black">{Math.round(weather.daily.temperature_2m_max[index])}°</div><div className="text-xs text-slate-500">{Math.round(weather.daily.temperature_2m_min[index])}°</div></div>)}</div></div>
            </>}
          </div>
        </div>
      )}

      <button
        type="button"
        title="My location"
        onClick={() => navigator.geolocation?.getCurrentPosition(position => {
          const location: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(location);
          mapRef.current?.flyTo({ center: location, zoom: 13, duration: 900 });
        })}
        className="absolute bottom-28 right-3 z-[1900] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-black text-slate-950 shadow-2xl hover:bg-blue-50"
      >
        ◎
      </button>

    </div>
  );
};
