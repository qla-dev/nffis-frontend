
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, LayerGroup, GeoJSON, WMSTileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Layers, Waves, Flame, Globe2, Sun, Moon, Wind, Thermometer, Loader2, Navigation as NavIcon, Settings2, Info, ChevronRight, Check, Settings, Map as MapIcon, Satellite, Mountain, Leaf, X, Trash2, Trees, ShieldCheck, LandPlot, ThermometerSun, Snowflake, CloudRain, Droplets, Zap, Umbrella, Cloud, CloudLightning, Eye, ArrowUp, Calendar, Clock, AlertTriangle, Sunrise, Sunset, Gauge, Navigation, Fan, Layers as LayersIcon, Sprout, SunDim, MoveUp, Radar, MapPin } from 'lucide-react';
import { BIH_CENTER, MOCK_FORESTS, TRANSLATIONS, REGION_STYLES, PROTECTED_AREAS_DATA } from '../../constants';
import { IncidentReport, IncidentType, MapLayer, Language, RegionType, OpenMeteoResponse, ForestRegion } from '../../types';
import {
  ALL_CANTON_CODES,
  BIH_CANTONS,
  BIH_FLAG_BLUE,
  bihBorderData,
  type BorderRegionKey,
  type CantonCode,
  type FirefighterDensityBucket,
} from '../../bihData';
import { FIREFIGHTER_STATIONS, type FirefighterStation, type FirefighterStationType } from '../../firefighterData';
import { MapControls } from './MapControls';
import { ForestHoverCard } from './ForestHoverCard';
import { FirefighterHoverCard } from './FirefighterHoverCard';
import { FirefighterStationModal } from './FirefighterStationModal';
import { FIREFIGHTER_STATION_STYLE } from './firefighterStationUi';
import { AngstromHeatLayer } from '../Layers/FWI/AngstromHeatLayer';
import { GFIHeatLayer } from '../Layers/FWI/GFIHeatLayer';
import { KBDIHeatLayer } from '../Layers/FWI/KBDIHeatLayer';
import { BosnianFWIHeatLayer } from '../Layers/FWI/BosnianFWIHeatLayer';
import { AWSFBiHLayer } from './layers/AWS/AWSFBiHLayer';
import { AWSRsLayer } from './layers/AWS/AWSRsLayer';
import { DatasetGeoJsonLayer } from './layers/Datasets/DatasetGeoJsonLayer';
import type { DatasetLayer, DatasetLayerFilterState } from '../../services/datasetService';

const GlobalLeaflet = (L as any).default || L;
const FIRE_HEAT_GRADIENT = {
  0.12: '#fde68a',
  0.32: '#fb923c',
  0.62: '#ef4444',
  1.0: '#7f1d1d',
};
const FLOOD_HEAT_GRADIENT = {
  0.2: '#60a5fa',
  0.45: '#3b82f6',
  0.7: '#2563eb',
  1.0: '#1e3a8a',
};
const FWI_OVERLAY_PANE = 'fwi-overlay-pane';
const METEOBLUE_OVERLAY_PANE = 'meteoblue-overlay-pane';
const DATASET_LAYER_PANE = 'dataset-layer-pane';
const FIREFIGHTER_DENSITY_FILLS: Record<FirefighterDensityBucket, string> = {
  'no-data': '#cbd5e1',
  '1-500': '#34d399',
  '501-1000': '#22c55e',
  '1001-1500': '#f59e0b',
  '1501-2000': '#f97316',
  '2000-plus': '#dc2626',
};
const toRasterBounds = (bounds: L.LatLngBounds) => {
  const paddedBounds = bounds.pad(0.12);
  return {
    west: paddedBounds.getWest(),
    east: paddedBounds.getEast(),
    south: paddedBounds.getSouth(),
    north: paddedBounds.getNorth(),
  };
};

// --- ICONS & STYLES ---
const ICON_PATHS: Record<string, string> = {
  tree: `<path d="M12 19v3"/><path d="M12 19h-3a9 9 0 0 1 0-18h6a9 9 0 0 1 0 18h-3"/>`,
  pine: `<path d="m8 14 4-9 4 9"/><path d="m10 14-3 9"/><path d="m14 14 3 9"/>`,
  mixed: `<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .9-1.7l-2.6-5a1 1 0 0 0-1.8 0l-2.6 5a1 1 0 0 0 .9 1.7h.2l-1.4 2.5"/>`,
  shrub: `<path d="M12 22v-9"/><path d="M6.06 14a4 4 0 0 1 7.15-2.73"/><path d="M12.8 11.27a4 4 0 0 1 5.14 8.73"/><path d="M18.66 16.32a4 4 0 0 1-1.37 5.68"/><path d="M4.69 13.9a4 4 0 0 0-.25 7.84"/>`,
  sprout: `<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .5-3.5 1.3-3.5 1.3s-.9-2.4 0-4.6c.9-2.1 2.2-2 2.2-2"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>`
};

const getRegionIcon = (type: RegionType) => {
  const style = REGION_STYLES[type];
  const color = style.color;
  const path = ICON_PATHS[style.iconType] || ICON_PATHS.tree;
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return GlobalLeaflet.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 bg-slate-950 rounded-full border-2 border-[${color}] shadow-2xl hover:scale-110 transition-transform" style="border-color: ${color}">${iconSvg}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const UserIcon = GlobalLeaflet.divIcon({
  html: `<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div><div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-xl"></div></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const FIREFIGHTER_SVG_PATH = "M447.914,152.582c7.106-21.525-11.432-27.796-32.816-25.646c-13.67,1.371-34.454,10.077-44.728,5.034 c0,0-5.791-92.214-82.374-107.625v34.745h-7.524c-0.78-0.157-1.529-0.331-2.324-0.464V7.784c0-4.302-4.168-7.784-9.297-7.784H256 h-12.85c-5.129,0-9.297,3.482-9.297,7.784v50.843c-0.796,0.134-1.544,0.307-2.324,0.464h-7.524V24.346 c-76.582,15.41-82.374,107.625-82.374,107.625c-10.274,5.042-31.058-3.664-44.728-5.034c-21.384-2.151-39.923,4.12-32.816,25.646 c4.9,14.852,24.55,27.284,46.359,36.857c9.809,4.302,20.572,7.769,30.854,10.519c-0.433,2.032-0.678,4.215-0.678,6.555 c0,4.325,0.741,9.186,2.34,14.772c4.215,14.686,8.021,24.172,12.953,31.13c2.458,3.458,5.263,6.232,8.321,8.344 c1.851,1.292,3.773,2.285,5.712,3.16c4.436,20.524,13.914,34.95,22.36,45.295l-0.275-0.032c-4.46-0.007-8.588,1.142-12.031,3.026 c-5.193,2.853-8.833,7.138-11.228,11.566c-2.38,4.475-3.64,9.076-3.664,13.552c0,6.106,0,15.49,0,21.352 c-7.383,2.308-21.596,7.076-36.771,13.914c-10.96,4.956-22.407,10.976-32.24,18.106c-9.793,7.169-18.192,15.395-22.36,25.7 c-5.563,13.977-7.335,25.614-7.335,34.636c-0.008,13.536,3.986,21.052,4.49,21.903l0.733,1.3l1.198,0.899 c0.969,0.756,26.11,19.13,90.268,29.324c26.512,4.531,57.878,7.532,92.907,7.54c34.438,0,65.316-2.923,91.552-7.319 c65.166-10.156,90.647-28.79,91.616-29.546l1.206-0.899l0.732-1.3c0.504-0.858,4.492-8.367,4.484-21.903 c0.008-9.022-1.765-20.659-7.328-34.636c-4.168-10.305-12.566-18.531-22.36-25.7c-14.749-10.684-33.162-18.925-48.021-24.677 c-8.808-3.396-16.27-5.862-20.99-7.336c0-5.87,0-15.253,0-21.36c-0.008-2.994-0.59-6.012-1.663-9.045 c-1.622-4.522-4.348-9.1-8.54-12.787c-4.152-3.688-10.006-6.343-16.719-6.312l-0.276,0.032 c8.447-10.345,17.925-24.771,22.36-45.295c1.938-0.875,3.861-1.868,5.712-3.16c4.609-3.176,8.517-7.792,11.834-14.072 c3.333-6.303,6.287-14.371,9.439-25.401c1.6-5.594,2.332-10.447,2.332-14.78c0.008-2.332-0.244-4.523-0.67-6.555 c10.282-2.758,21.044-6.209,30.853-10.511C423.363,179.866,443.013,167.434,447.914,152.582z M221.672,113.298 C247.672,106.01,256,87.282,256,87.282s8.328,18.728,34.328,26.016v33.296c0,0-14.56,22.88-34.328,26.008 c-19.768-3.128-34.328-26.008-34.328-26.008V113.298z M150.738,185.965c-1.993,1.229-3.884,3.16-5.554,5.436 c-7.627-3.396-13.354-6.5-16.294-8.58c-9.384-6.642-3.948-12.661,11.677-4.412c4.175,2.206,8.375,4.302,12.63,6.287 C152.393,185.043,151.581,185.452,150.738,185.965z M246.16,492.121c-27.742-0.473-54.561-2.773-79.758-7.066 c-47.43-7.54-71.555-19.619-79.112-24.015c-0.551-2.001-1.197-5.358-1.197-9.999c0-7.366,1.678-15.529,4.83-24.235 c46.225,9.29,99.038,14.757,155.238,15.34V492.121z M246.16,375.83c-21.525-0.496-42.184-2.482-61.361-5.902v-32.602 c0.008-1.111,0.488-2.671,1.355-4.302c0.858-1.591,1.993-2.829,3.309-3.545c0.489-0.268,1.339-0.606,2.498-0.606 c0.85,0,2.088,0.134,3.806,0.74c5.112,1.804,11.582,2.93,16.104,3.561c5.058,0.701,10.935,1.276,17.444,1.686 c6.358,0.402,12.33,0.59,16.845,0.693V375.83z M421.086,426.798c3.136,8.682,4.821,16.852,4.821,24.219 c0,4.632-0.645,7.974-1.212,10.022c-7.628,4.444-32.083,16.695-80.176,24.188c-25.102,4.207-51.504,6.437-78.679,6.893v-49.975 C322.04,441.563,374.86,436.095,421.086,426.798z M319.914,328.872c1.993,0,3.254,0.945,3.702,1.347 c1.686,1.488,2.608,3.38,3.081,4.704c0.323,0.906,0.504,1.781,0.504,2.45v32.555c-19.178,3.42-39.836,5.406-61.361,5.902v-40.285 c8.698-0.189,22.636-0.732,34.328-2.379c4.499-0.623,10.991-1.757,16.12-3.577C317.581,329.132,318.866,328.872,319.914,328.872z M355.155,217.331c-3.978,14.008-7.548,22.171-10.826,26.694c-1.638,2.292-3.136,3.718-4.806,4.884 c-1.67,1.158-3.584,2.08-6.098,2.978l-3.956,1.402l-0.725,4.136c-4.617,25.867-17.948,40.426-27.796,51.386l-1.852,2.065v2.537 l-1.671,0.26c-11.487,1.615-25.787,2.095-34.21,2.237L256,315.966l-7.218-0.056c-4.727-0.071-11.306-0.26-18.231-0.701 c-5.389-0.339-10.976-0.843-15.978-1.536l-1.67-0.26v-2.537l-1.852-2.065c-9.849-10.96-23.18-25.519-27.797-51.386l-0.732-4.136 l-3.948-1.402c-2.513-0.899-4.428-1.82-6.099-2.978c-2.474-1.741-4.704-4.12-7.319-8.99c-2.584-4.846-5.318-12.086-8.312-22.588 c-1.315-4.601-1.78-8.17-1.78-10.818c0-3.081,0.591-4.877,1.198-6.012c0.906-1.654,2.025-2.363,3.435-2.93 c1.158-0.442,2.355-0.56,2.836-0.584l7.714,0.954v-6.036c23.731,8.919,50.448,14.276,85.754,14.276 c35.306,0,62.022-5.357,85.754-14.276v5.626l7.524-0.544c0.354-0.031,2.781,0.197,4.342,1.237c0.827,0.528,1.496,1.142,2.12,2.277 c0.598,1.135,1.189,2.931,1.197,6.004C356.936,209.168,356.463,212.73,355.155,217.331z M383.11,182.821 c-2.923,2.064-8.62,5.161-16.215,8.541c-2.364-3.262-5.334-5.405-8.107-6.658c4.262-1.993,8.462-4.089,12.646-6.295 C387.057,170.16,392.493,176.179,383.11,182.821z";

const FIREFIGHTER_STATION_ICONS = Object.fromEntries(
  (Object.keys(FIREFIGHTER_STATION_STYLE) as FirefighterStationType[]).map((type) => {
    const style = FIREFIGHTER_STATION_STYLE[type];
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="${style.color}"><path d="${FIREFIGHTER_SVG_PATH}"/></svg>`;
    return [
      type,
      GlobalLeaflet.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-xl cursor-pointer" style="background: rgba(15,23,42,0.96); border-color: ${style.color}; box-shadow: 0 0 0 4px ${style.glow}; pointer-events: auto;">${svgIcon}</div>`,
        className: 'firefighter-station-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    ];
  })
) as Record<FirefighterStationType, L.DivIcon>;

// --- BASE LAYER CONFIGURATION ---
const BASE_LAYER_CONFIG: Record<string, { url: string; attribution: string }> = {
  [MapLayer.SATELLITE]: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri' },
  [MapLayer.SATELLITE_CLARITY]: { url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri Clarity' },
  [MapLayer.SATELLITE_GOOGLE]: { url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', attribution: 'Google' },
  [MapLayer.TERRAIN]: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: 'OpenTopoMap' },
  [MapLayer.SENTINEL]: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Sentinel2/Scientific/ImageServer/tile/{z}/{y}/{x}', attribution: 'Sentinel' },
  [MapLayer.INFRARED]: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', attribution: 'NatGeo (Sim)' },
  // METEOBLUE is handled dynamically
  [MapLayer.NASA_FIRMS]: { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: 'NASA FIRMS Base' },
  [MapLayer.THERMAL]: { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: 'Thermal Base' },
  [MapLayer.WINDY]: { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: 'Windy Base' },
};

// --- COMPONENTS ---

interface GISMapProps {
  incidents: IncidentReport[];
  activeLayers: Set<MapLayer>;
  onReportClick: (lat: number, lng: number) => void;
  onCancelReport: () => void;
  isReporting: boolean;
  onToggleLayer: (layer: MapLayer) => void;
  onSetBaseLayer: (layer: MapLayer | null) => void;
  datasetLayers: DatasetLayer[];
  activeDatasetLayerIds: Set<number>;
  datasetLayerFilters: Record<number, DatasetLayerFilterState>;
  datasetLayerRefreshKey: number;
  onDatasetPolygonClick: (layerId: number, feature: GeoJSON.Feature) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

interface FireIndexWeatherData {
  current: {
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
  daily: {
    precipitation_sum: number[];
  };
}

interface ForestFireIndexSnapshot {
  id: string;
  lat: number;
  lng: number;
  angstrom: number;
  gfi: number;
  kbdi: number;
  fwiBosnian: number;
  isi?: number;
  bui?: number;
}

const FWI_DEBUG_PREFIX = '[FWI DEBUG][GISMap]';

export const GISMap: React.FC<GISMapProps> = ({ 
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
  isDarkMode,
  onToggleTheme,
  language,
  onSetLanguage
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const t = TRANSLATIONS[language];

  // Helpers
  const fmtTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (isoString: string) => new Date(isoString).toLocaleDateString([], { weekday: 'short', day: 'numeric' });

  // Get current hour index
  const getCurrentHourIndex = (weather: FireIndexWeatherData) => {
    if (!weather?.hourly?.time?.length) return -1;
    const currentHourStr = weather.current?.time?.slice(0, 13);
    if (!currentHourStr) return 0;
    const exactHourIndex = weather.hourly.time.findIndex(t => t.startsWith(currentHourStr));
    if (exactHourIndex !== -1) return exactHourIndex;
    const nextAvailableIndex = weather.hourly.time.findIndex(t => t >= weather.current.time);
    return nextAvailableIndex !== -1 ? nextAvailableIndex : 0;
  };

  // -- FIRE INDEX CALCULATIONS --
  const computeFireIndexMetrics = (weather: FireIndexWeatherData, hourIdx: number) => {
    const safeHourIdx = hourIdx >= 0 ? hourIdx : 0;
    const hourly = weather.hourly || {};
    const daily = weather.daily || {};
    
    const temp = hourly.temperature_2m?.[safeHourIdx] ?? 0;
    const humidity = hourly.relative_humidity_2m?.[safeHourIdx] ?? 0;
    const windKmh = hourly.wind_speed_10m?.[safeHourIdx] ?? 0;
    const rain = daily.precipitation_sum?.[0] ?? 0;
    
    const ai = (humidity / 20 + (27 - temp) / 10);
    const dryDays = daily.precipitation_sum?.filter((p) => p < 2.0).length ?? 0;
    const zoneFactor = 1.2;
    const gfi =
      (Math.max(0, temp) * (100 - Math.min(100, humidity)) * windKmh / 1000) *
      (1 + dryDays / 20) *
      zoneFactor;
    let kbdi = (Math.max(0, temp) * 10) - (rain * 50);
    if (kbdi < 0) kbdi = 0;
    kbdi = Math.min(800, kbdi + (dryDays * 50));
    
    const isi = (windKmh * 0.12) * (1 + (Math.max(0, 30 - humidity)) / 60) * (Math.max(0, temp) / 15);
    const bui = (dryDays * 6) + (Math.max(0, temp) / 8);
    
    const fD = bui <= 80 
      ? (0.626 * Math.pow(Math.max(0, bui), 0.809) + 2.0)
      : (1000.0 / (25.0 + 108.64 * Math.exp(-0.023 * Math.max(0, bui))));
    
    const B = 0.1 * isi * fD;
    const B_safe = Math.max(B, 1e-6);
    
    const fwiBosnian = B > 1
      ? Math.exp(2.72 * Math.pow(Math.max(0, 0.434 * Math.log(B_safe)), 0.647))
      : Math.max(0, B);

    return { ai, gfi, kbdi, fwiBosnian, isi, bui };
  };

  const calculateFireIndices = (weather: FireIndexWeatherData, hourIdx: number) => {
    const { ai, gfi, kbdi, fwiBosnian } = computeFireIndexMetrics(weather, hourIdx);

    let aiRisk = t.riskLevels.low;
    let aiColor = "text-emerald-500";
    if (ai < 2.0) { aiRisk = t.riskLevels.extreme; aiColor = "text-purple-500"; }
    else if (ai < 2.5) { aiRisk = t.riskLevels.veryHigh; aiColor = "text-red-600"; }
    else if (ai < 3.0) { aiRisk = t.riskLevels.high; aiColor = "text-orange-500"; }
    else if (ai < 4.0) { aiRisk = t.riskLevels.moderate; aiColor = "text-yellow-500"; }

    let gfiRisk = t.riskLevels.low;
    let gfiColor = "text-emerald-500";
    if (gfi > 15) { gfiRisk = t.riskLevels.extreme; gfiColor = "text-purple-500"; }
    else if (gfi > 9) { gfiRisk = t.riskLevels.veryHigh; gfiColor = "text-red-600"; }
    else if (gfi > 5) { gfiRisk = t.riskLevels.high; gfiColor = "text-orange-500"; }
    else if (gfi > 2) { gfiRisk = t.riskLevels.moderate; gfiColor = "text-yellow-500"; }

    let kbdiRisk = t.riskLevels.low;
    let kbdiColor = "text-emerald-500";
    if (kbdi > 600) { kbdiRisk = t.riskLevels.extreme; kbdiColor = "text-purple-500"; }
    else if (kbdi > 400) { kbdiRisk = t.riskLevels.high; kbdiColor = "text-red-600"; }
    else if (kbdi > 200) { kbdiRisk = t.riskLevels.moderate; kbdiColor = "text-orange-500"; }

    let fwiRisk = t.riskLevels.low;
    let fwiColor = "text-emerald-500";
    if (fwiBosnian >= 70.0) { fwiRisk = t.riskLevels.extreme; fwiColor = "text-purple-600"; }
    else if (fwiBosnian >= 50.0) { fwiRisk = t.riskLevels.extreme; fwiColor = "text-purple-500"; }
    else if (fwiBosnian >= 38.0) { fwiRisk = t.riskLevels.veryHigh; fwiColor = "text-red-600"; }
    else if (fwiBosnian >= 21.3) { fwiRisk = t.riskLevels.high; fwiColor = "text-orange-500"; }
    else if (fwiBosnian >= 11.2) { fwiRisk = t.riskLevels.moderate; fwiColor = "text-yellow-500"; }

    return { ai, aiRisk, aiColor, gfi, gfiRisk, gfiColor, kbdi, kbdiRisk, kbdiColor, fwiBosnian, fwiRisk, fwiColor };
  };

  const buildFallbackFwiSnapshot = (forest: ForestRegion): ForestFireIndexSnapshot => {
    const typeBias: Record<RegionType, number> = {
      [RegionType.DECIDUOUS]: 0.04,
      [RegionType.CONIFEROUS]: 0.12,
      [RegionType.MIXED]: 0.08,
      [RegionType.MAQUIS]: 0.18,
      [RegionType.LOW_VEGETATION]: 0.15,
      [RegionType.LANDFILL]: 0.2,
    };
    const intensity = Math.max(0.08, Math.min(0.98, forest.riskScore + (typeBias[forest.type] ?? 0)));
    return {
      id: forest.id,
      lat: forest.coordinates[0],
      lng: forest.coordinates[1],
      angstrom: 5.8 - (intensity * 3.8),
      gfi: 1 + (intensity * 11),
      kbdi: 90 + (intensity * 520),
      fwiBosnian: intensity * 80,
    };
  };

  // Helper for dynamic header icon
  const getForestIconElement = (type: RegionType) => {
    const style = REGION_STYLES[type];
    const path = ICON_PATHS[style.iconType] || ICON_PATHS.tree;
    return (
       <div className={`p-3 rounded-2xl bg-slate-950 border shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)]`} style={{ borderColor: style.color, boxShadow: `0 0 20px ${style.color}20` }}>
         <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={style.color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: path }}
         />
       </div>
    );
  };

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const initialViewportLayoutKeyRef = useRef<string | null>(null);
  const bihBounds = useMemo(() => GlobalLeaflet.geoJSON(bihBorderData as any).getBounds(), []);
  const statusPanelRef = useRef<HTMLDivElement | null>(null);
  const mapControlsRef = useRef<HTMLDivElement | null>(null);
  const legendPanelRef = useRef<HTMLDivElement | null>(null);
  const gpsFabRef = useRef<HTMLDivElement | null>(null);
  const reportingBannerRef = useRef<HTMLDivElement | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedCantonCodes, setSelectedCantonCodes] = useState<Set<CantonCode>>(
    () => new Set(ALL_CANTON_CODES)
  );
  const [republicSrpskaSelected, setRepublicSrpskaSelected] = useState(true);
  const [brckoDistrictSelected, setBrckoDistrictSelected] = useState(true);

  // -- NEW DASHBOARD STATE --
  const [selectedForest, setSelectedForest] = useState<ForestRegion | null>(null);
  const [selectedStation, setSelectedStation] = useState<FirefighterStation | null>(null);
  const [forestWeather, setForestWeather] = useState<OpenMeteoResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [forecastMode, setForecastMode] = useState<'hourly' | 'daily'>('hourly');
  const [forestFwiData, setForestFwiData] = useState<ForestFireIndexSnapshot[]>([]);
  const [isLoadingFwi, setIsLoadingFwi] = useState(false);
  const [isMeteoblueUnavailable, setIsMeteoblueUnavailable] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [heatViewportBounds, setHeatViewportBounds] = useState<{
    west: number;
    east: number;
    south: number;
    north: number;
  } | null>(null);

  // -- METEOBLUE DYNAMIC STATE --
  const [meteoblueUrl, setMeteoblueUrl] = useState<string>('');

  const federationSelected = selectedCantonCodes.size > 0;
  const allCantonsSelected = selectedCantonCodes.size === ALL_CANTON_CODES.length;
  const borderLayerVisible = activeLayers.has(MapLayer.BIH_BORDERS);
  const allBorderRegionsSelected =
    allCantonsSelected && republicSrpskaSelected && brckoDistrictSelected;
  const hasAnyBorderSelection =
    federationSelected || republicSrpskaSelected || brckoDistrictSelected;

  const bihCantonFeatures = useMemo(() => bihBorderData.features as Array<any>, []);
  const visibleBihCantonData = useMemo(
    () => ({
      ...bihBorderData,
      features: bihCantonFeatures.filter((feature) => {
        const borderRegionKey = feature.properties?.borderRegionKey as BorderRegionKey | undefined;

        if (borderRegionKey === 'federation') {
          return selectedCantonCodes.has(feature.properties.cantonCode as CantonCode);
        }

        if (borderRegionKey === 'republicSrpska') {
          return republicSrpskaSelected;
        }

        if (borderRegionKey === 'brckoDistrict') {
          return brckoDistrictSelected;
        }

        return false;
      }),
    }),
    [bihCantonFeatures, brckoDistrictSelected, republicSrpskaSelected, selectedCantonCodes]
  );
  const firefighterDensityData = useMemo(
    () => ({
      ...bihBorderData,
      features: bihCantonFeatures.filter(
        (feature) => feature.properties?.borderRegionKey === 'republicSrpska'
      ),
    }),
    [bihCantonFeatures]
  );
  const borderLayerDataKey = useMemo(
    () =>
      [
        republicSrpskaSelected ? 'rs-on' : 'rs-off',
        brckoDistrictSelected ? 'brcko-on' : 'brcko-off',
        ...Array.from(selectedCantonCodes).sort(),
      ].join('|'),
    [brckoDistrictSelected, republicSrpskaSelected, selectedCantonCodes]
  );
  const firefighterDensityLayerKey = useMemo(
    () =>
      firefighterDensityData.features
        .map(
          (feature) =>
            `${feature.properties?.shapeID}:${feature.properties?.firefighterDensityBucket ?? 'none'}`
        )
        .join('|'),
    [firefighterDensityData]
  );
  const cantonBorderStyle = useCallback(
    (feature?: any): L.PathOptions => {
      const featureColor =
        allBorderRegionsSelected
          ? BIH_FLAG_BLUE
          : feature?.properties?.borderColor ?? BIH_FLAG_BLUE;

      return {
        color: featureColor,
        fillColor: featureColor,
        fillOpacity: allBorderRegionsSelected ? 0.04 : 0.12,
        opacity: allBorderRegionsSelected ? 0.82 : 0.94,
        weight: allBorderRegionsSelected ? 2 : 2.2,
      };
    },
    [allBorderRegionsSelected]
  );
  const firefighterDensityStyle = useCallback((feature?: any): L.PathOptions => {
    const bucket = (feature?.properties?.firefighterDensityBucket ?? 'no-data') as FirefighterDensityBucket;
    const fillColor = FIREFIGHTER_DENSITY_FILLS[bucket] ?? FIREFIGHTER_DENSITY_FILLS['no-data'];

    return {
      color: '#0f172a',
      fillColor,
      fillOpacity: bucket === 'no-data' ? 0.2 : 0.42,
      opacity: 0.72,
      weight: 1,
      dashArray: bucket === 'no-data' ? '4 3' : undefined,
    };
  }, []);
  const handleFirefighterDensityFeature = useCallback((feature: any, layer: L.Layer) => {
    const shapeName = feature?.properties?.shapeName ?? 'RS municipality';
    const bucketLabel = feature?.properties?.firefighterDensityLabel ?? 'No data';
    const sourceLabel = feature?.properties?.firefighterDensitySource ?? 'User map';
    const leafletLayer = layer as L.Path;

    leafletLayer.bindTooltip(
      `<div style="min-width: 180px"><div style="font-weight: 700; margin-bottom: 4px;">${shapeName}</div><div style="font-size: 12px; opacity: 0.9;">${bucketLabel}</div><div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${sourceLabel}</div></div>`,
      { sticky: true, direction: 'top', opacity: 0.95 }
    );
  }, []);

  const handleToggleBorderLayer = useCallback(() => {
    if (!borderLayerVisible && !hasAnyBorderSelection) {
      setSelectedCantonCodes(new Set(ALL_CANTON_CODES));
      setRepublicSrpskaSelected(true);
      setBrckoDistrictSelected(true);
    }

    onToggleLayer(MapLayer.BIH_BORDERS);
  }, [borderLayerVisible, hasAnyBorderSelection, onToggleLayer]);

  const handleToggleFederation = useCallback(() => {
    const nextSelection = federationSelected ? new Set<CantonCode>() : new Set(ALL_CANTON_CODES);
    setSelectedCantonCodes(nextSelection);

    const hasNextSelection =
      nextSelection.size > 0 || republicSrpskaSelected || brckoDistrictSelected;

    if (!hasNextSelection && borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }

    if (hasNextSelection && !borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }
  }, [
    borderLayerVisible,
    brckoDistrictSelected,
    federationSelected,
    onToggleLayer,
    republicSrpskaSelected,
  ]);

  const handleToggleRepublicSrpska = useCallback(() => {
    const nextValue = !republicSrpskaSelected;
    setRepublicSrpskaSelected(nextValue);

    const hasNextSelection =
      selectedCantonCodes.size > 0 || nextValue || brckoDistrictSelected;

    if (!hasNextSelection && borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }

    if (hasNextSelection && !borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }
  }, [
    borderLayerVisible,
    brckoDistrictSelected,
    onToggleLayer,
    republicSrpskaSelected,
    selectedCantonCodes,
  ]);

  const handleToggleBrckoDistrict = useCallback(() => {
    const nextValue = !brckoDistrictSelected;
    setBrckoDistrictSelected(nextValue);

    const hasNextSelection =
      selectedCantonCodes.size > 0 || republicSrpskaSelected || nextValue;

    if (!hasNextSelection && borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }

    if (hasNextSelection && !borderLayerVisible) {
      onToggleLayer(MapLayer.BIH_BORDERS);
    }
  }, [
    borderLayerVisible,
    brckoDistrictSelected,
    onToggleLayer,
    republicSrpskaSelected,
    selectedCantonCodes,
  ]);

  const handleToggleCanton = useCallback(
    (code: CantonCode) => {
      const nextSelection = new Set(selectedCantonCodes);

      if (nextSelection.has(code)) {
        nextSelection.delete(code);
      } else {
        nextSelection.add(code);
      }

      setSelectedCantonCodes(nextSelection);

      const hasNextSelection =
        nextSelection.size > 0 || republicSrpskaSelected || brckoDistrictSelected;

      if (!hasNextSelection && borderLayerVisible) {
        onToggleLayer(MapLayer.BIH_BORDERS);
      }

      if (hasNextSelection && !borderLayerVisible) {
        onToggleLayer(MapLayer.BIH_BORDERS);
      }
    },
    [
      borderLayerVisible,
      brckoDistrictSelected,
      onToggleLayer,
      republicSrpskaSelected,
      selectedCantonCodes,
    ]
  );

  // Helper to get translated weather info
  const getWeatherInfo = (code: number) => {
    const codes: Record<number, { icon: any }> = {
      0: { icon: Sun }, 1: { icon: Sun }, 2: { icon: Cloud }, 3: { icon: Cloud },
      45: { icon: Cloud }, 48: { icon: Cloud }, 51: { icon: CloudRain },
      53: { icon: CloudRain }, 55: { icon: CloudRain }, 56: { icon: Snowflake },
      57: { icon: Snowflake }, 61: { icon: CloudRain }, 63: { icon: CloudRain },
      65: { icon: CloudRain }, 66: { icon: Snowflake }, 67: { icon: Snowflake },
      71: { icon: Snowflake }, 73: { icon: Snowflake }, 75: { icon: Snowflake },
      77: { icon: Snowflake }, 80: { icon: CloudRain }, 81: { icon: CloudRain },
      82: { icon: CloudRain }, 85: { icon: Snowflake }, 86: { icon: Snowflake },
      95: { icon: CloudLightning }, 96: { icon: CloudLightning }, 99: { icon: CloudLightning },
    };
    return { 
        label: t.weather[code as keyof typeof t.weather] || 'Unknown', 
        icon: codes[code]?.icon || Cloud 
    };
  };

  const isMeteoblueActive = activeLayers.has(MapLayer.METEOBLUE);

  // Derive Active Base Layer Object
  const activeBaseLayerId = useMemo(() => {
    return Object.values(MapLayer).find(
      (layer) => layer !== MapLayer.METEOBLUE && activeLayers.has(layer) && BASE_LAYER_CONFIG[layer]
    );
  }, [activeLayers]);
  
  const activeBaseLayer = useMemo(() => {
      if (activeBaseLayerId) {
          return BASE_LAYER_CONFIG[activeBaseLayerId];
      }
      return null;
  }, [activeBaseLayerId]);
  const activeBaseLayerKey = activeBaseLayerId ?? (isDarkMode ? 'dark' : 'light');
  const shouldRenderStandaloneMeteoblue = isMeteoblueActive && !isMeteoblueUnavailable;
  const fireIncidents = useMemo(
    () => incidents.filter(incident => incident.type === IncidentType.FIRE),
    [incidents]
  );
  const floodIncidents = useMemo(
    () => incidents.filter(incident => incident.type === IncidentType.FLOOD),
    [incidents]
  );
  const isAnyFwiLayerActive = useMemo(
    () => activeLayers.has(MapLayer.FWI_BOSNIAN),
    [activeLayers]
  );
  const activeFwiValue = useMemo(() => {
    if (!selectedForest || !forestWeather) return null;
    const hIdx = getCurrentHourIndex(forestWeather);
    const risk = calculateFireIndices(forestWeather, hIdx);
    return risk.fwiBosnian;
  }, [selectedForest, forestWeather]);

  const activeFwiLayerInfo = useMemo(() => {
    if (activeLayers.has(MapLayer.FWI_BOSNIAN)) {
      return { 
        title: t.dashboard.fwiBosnian, 
        min: 0, 
        max: 80, 
        gradient: 'bg-gradient-to-r from-green-500 via-orange-500 to-red-500', 
        iconColor: 'bg-red-500',
        currentValue: activeFwiValue
      };
    }
    return null;
  }, [activeLayers, t, activeFwiValue]);
  const fwiSourceForests = useMemo(
    () => MOCK_FORESTS.filter((forest) => forest.type !== RegionType.LANDFILL),
    []
  );
  const handleMeteoblueTileError = useCallback(() => {
    setIsMeteoblueUnavailable(true);
  }, []);

  // Fetch Meteoblue Tile URL only when the layer is requested.
  useEffect(() => {
    if (!isMeteoblueActive || meteoblueUrl) {
      return;
    }

    const fetchMeteoblue = async () => {
        try {
            const apiKey = "be72f76237db";
            const response = await fetch(`https://maps-api.meteoblue.com/v1/time/hourly/ICONAUTO?lang=en&apikey=${apiKey}`);
            if (!response.ok) {
              throw new Error(`Meteoblue config request failed with status ${response.status}`);
            }
            const data = await response.json();
            const date = data.current;
            const url = `https://maps-api.meteoblue.com/v1/map/raster/ICONAUTO/${date}/` +
            "11~2%20m%20above%20gnd~hourly~none~contourSteps~" +
            "-10.0~rgba(52,140,237,1.0)~" +
            "-8.0~rgba(68,177,246,1.0)~" +
            "-6.0~rgba(81,203,250,1.0)~" +
            "-4.0~rgba(128,224,247,1.0)~" +
            "-2.0~rgba(160,234,247,1.0)~" +
            "0.0~rgba(0,239,124,1.0)~" +
            "2.0~rgba(0,228,82,1.0)~" +
            "4.0~rgba(0,200,72,1.0)~" +
            "6.0~rgba(16,184,122,1.0)~" +
            "8.0~rgba(41,123,93,1.0)~" +
            "10.0~rgba(0,114,41,1.0)~" +
            "12.0~rgba(60,161,44,1.0)~" +
            "14.0~rgba(121,208,48,1.0)~" +
            "16.0~rgba(181,255,51,1.0)~" +
            "18.0~rgba(216,247,161,1.0)~" +
            "20.0~rgba(255,246,0,1.0)~" +
            "22.0~rgba(248,223,11,1.0)~" +
            "24.0~rgba(253,202,12,1.0)~" +
            "26.0~rgba(252,172,5,1.0)~" +
            "28.0~rgba(248,141,0,1.0)~" +
            "30.0~rgba(255,102,0,1.0)~" +
            "/{z}/{x}/{y}" +
            "?temperatureUnit=C" +
            `&apikey=${apiKey}` +
            `&lastUpdate=${data.lastUpdate}`;
            setMeteoblueUrl(url);
        } catch (e) {
            console.error("Failed to fetch Meteoblue config", e);
            setIsMeteoblueUnavailable(true);
        }
    };
    fetchMeteoblue();
  }, [isMeteoblueActive, meteoblueUrl]);

  useEffect(() => {
    if (!isMeteoblueActive) {
      setIsMeteoblueUnavailable(false);
    }
  }, [isMeteoblueActive]);

  useEffect(() => {
    if (!isMeteoblueActive || !isMeteoblueUnavailable) {
      return;
    }

    console.warn('Meteoblue tiles unavailable; disabling Meteoblue overlay.');
    onToggleLayer(MapLayer.METEOBLUE);
  }, [isMeteoblueActive, isMeteoblueUnavailable, onToggleLayer]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const ensurePane = (name: string, zIndex: number, pointerEvents = 'none') => {
      const pane = map.getPane(name) ?? map.createPane(name);
      pane.style.zIndex = `${zIndex}`;
      pane.style.pointerEvents = pointerEvents;
    };

    ensurePane(DATASET_LAYER_PANE, 345, 'auto');
    ensurePane(FWI_OVERLAY_PANE, 360);
    ensurePane(METEOBLUE_OVERLAY_PANE, 380);
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const syncHeatViewportBounds = () => {
      setHeatViewportBounds(toRasterBounds(map.getBounds()));
    };

    syncHeatViewportBounds();
    map.on('moveend', syncHeatViewportBounds);
    map.on('zoomend', syncHeatViewportBounds);
    map.on('resize', syncHeatViewportBounds);

    return () => {
      map.off('moveend', syncHeatViewportBounds);
      map.off('zoomend', syncHeatViewportBounds);
      map.off('resize', syncHeatViewportBounds);
    };
  }, [map]);

  // Fetch Weather from Open-Meteo with Advanced Params
  useEffect(() => {
    if (selectedForest) {
      setLoadingWeather(true);
      const latitude = selectedForest.coordinates[0];
      const longitude = selectedForest.coordinates[1];
      
      const params = [
        'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
        'precipitation_probability', 'precipitation', 'weather_code', 'pressure_msl',
        'surface_pressure', 'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
        'visibility', 'evapotranspiration', 'et0_fao_evapotranspiration', 'vapour_pressure_deficit',
        'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m',
        'wind_direction_10m', 'wind_direction_80m', 'wind_direction_120m', 'wind_direction_180m',
        'wind_gusts_10m', 'temperature_80m', 'temperature_120m', 'temperature_180m',
        'soil_temperature_0cm', 'soil_temperature_6cm', 'soil_temperature_18cm', 'soil_temperature_54cm',
        'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm', 'soil_moisture_3_to_9cm',
        'soil_moisture_9_to_27cm', 'soil_moisture_27_to_81cm', 'uv_index'
      ].join(',');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=${params}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                 console.error("Open-Meteo API Error", data);
                 setForestWeather(null);
            } else {
                setForestWeather(data);
            }
        })
        .catch(err => console.error("Weather Fetch Error", err))
        .finally(() => setLoadingWeather(false));
    } else {
        setForestWeather(null);
    }
  }, [selectedForest]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        map?.flyTo([latitude, longitude], 13);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const syncMapSize = () => {
      map.invalidateSize({ animate: false });
    };

    const applyInitialViewport = () => {
      if (!mapContainerRef.current) return;

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const edgeGap = isMobile ? 10 : 8;
      const padding = {
        top: edgeGap,
        right: edgeGap,
        bottom: edgeGap,
        left: edgeGap,
      };

      const applyOverlayPadding = (
        element: HTMLDivElement | null,
        edges: Array<'top' | 'right' | 'bottom' | 'left'>,
        multiplier = 1
      ) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();

        if (edges.includes('top')) {
          padding.top = Math.max(padding.top, (Math.max(0, rect.bottom - containerRect.top) * multiplier) + edgeGap);
        }
        if (edges.includes('right')) {
          padding.right = Math.max(padding.right, (Math.max(0, containerRect.right - rect.left) * multiplier) + edgeGap);
        }
        if (edges.includes('bottom')) {
          padding.bottom = Math.max(padding.bottom, (Math.max(0, containerRect.bottom - rect.top) * multiplier) + edgeGap);
        }
        if (edges.includes('left')) {
          padding.left = Math.max(padding.left, (Math.max(0, rect.right - containerRect.left) * multiplier) + edgeGap);
        }
      };

      if (isMobile) {
        // On narrow screens, horizontal overlay padding over-constrains the fit and
        // shifts BiH off screen. Keep mobile padding vertical-only.
        applyOverlayPadding(statusPanelRef.current, ['top']);
        applyOverlayPadding(mapControlsRef.current, ['top']);
        applyOverlayPadding(legendPanelRef.current, ['bottom']);
        applyOverlayPadding(gpsFabRef.current, ['bottom']);
        // Bias the mobile first frame downward so BiH sits lower under the top UI.
        padding.top += 64;
      } else {
        applyOverlayPadding(statusPanelRef.current, ['top']);
        applyOverlayPadding(mapControlsRef.current, ['top']);
        applyOverlayPadding(legendPanelRef.current, ['left'], 0.4);
        applyOverlayPadding(gpsFabRef.current, ['bottom']);
      }
      applyOverlayPadding(reportingBannerRef.current, ['top']);

      const layoutKey = [
        Math.round(containerRect.width),
        Math.round(containerRect.height),
        isMobile ? 'mobile' : 'desktop',
        showLegend ? 'legend' : 'no-legend',
        isReporting ? 'reporting' : 'idle',
        Math.round(mapControlsRef.current?.getBoundingClientRect().height ?? 0),
        Math.round(legendPanelRef.current?.getBoundingClientRect().height ?? 0),
        Math.round(statusPanelRef.current?.getBoundingClientRect().height ?? 0),
      ].join(':');

      if (initialViewportLayoutKeyRef.current === layoutKey) {
        return;
      }

      map.fitBounds(bihBounds, {
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
        maxZoom: isMobile ? 9 : 10,
        animate: false
      });

      if (isMobile) {
        map.setView(map.getCenter(), Math.min(map.getZoom() + 1, 9), { animate: false });
      } else {
        map.setView(map.getCenter(), Math.min(map.getZoom() + 1, 10), { animate: false });
      }

      initialViewportLayoutKeyRef.current = layoutKey;
    };

    let scheduledFrame = 0;
    const scheduleInitialViewport = () => {
      window.cancelAnimationFrame(scheduledFrame);
      scheduledFrame = window.requestAnimationFrame(() => {
        syncMapSize();
        applyInitialViewport();
      });
    };

    let firstFrame = 0;
    let secondFrame = 0;
    const timeoutId = window.setTimeout(() => {
      scheduleInitialViewport();
    }, 250);
    const settleTimeoutId = window.setTimeout(() => {
      scheduleInitialViewport();
    }, 700);

    firstFrame = window.requestAnimationFrame(() => {
      scheduleInitialViewport();
      secondFrame = window.requestAnimationFrame(() => {
        scheduleInitialViewport();
      });
    });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && mapContainerRef.current
        ? new ResizeObserver(() => {
            scheduleInitialViewport();
          })
        : null;

    if (resizeObserver && mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', scheduleInitialViewport);

    return () => {
      window.cancelAnimationFrame(scheduledFrame);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeoutId);
      window.clearTimeout(settleTimeoutId);
      window.removeEventListener('resize', scheduleInitialViewport);
      resizeObserver?.disconnect();
    };
  }, [bihBounds, isReporting, map, showLegend]);

  const activeFwiLayers = useMemo(
    () => [MapLayer.FWI_BOSNIAN].filter((layer) => activeLayers.has(layer)),
    [activeLayers]
  );

  useEffect(() => {

    console.info(FWI_DEBUG_PREFIX, 'effect check', {
      activeFwiLayers,
      isAnyFwiLayerActive,
      isLoadingFwi,
      forestFwiDataLength: forestFwiData.length,
      availableForests: fwiSourceForests.length,
    });

    if (!isAnyFwiLayerActive) {
      console.info(FWI_DEBUG_PREFIX, 'skip fetch: no active FWI layer');
      return;
    }

    if (isLoadingFwi) {
      console.info(FWI_DEBUG_PREFIX, 'skip fetch: already loading');
      return;
    }

    if (forestFwiData.length > 0) {
      console.info(FWI_DEBUG_PREFIX, 'skip fetch: cached FWI data already present');
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const fetchFwiData = async () => {
      console.info(FWI_DEBUG_PREFIX, 'starting FWI fetch', {
        forestCount: fwiSourceForests.length,
      });
      setIsLoadingFwi(true);

      try {
        const nextData: ForestFireIndexSnapshot[] = [];

        for (const forest of fwiSourceForests) {
          try {
            const url =
              `https://api.open-meteo.com/v1/forecast?latitude=${forest.coordinates[0]}` +
              `&longitude=${forest.coordinates[1]}` +
              '&current=time' +
              '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m' +
              '&daily=precipitation_sum' +
              '&timezone=auto';

            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
              throw new Error(`FWI fetch failed for ${forest.name}`);
            }

            const weather = (await response.json()) as FireIndexWeatherData & { error?: boolean; reason?: string };
            if (weather.error || !weather.current?.time || !weather.hourly?.time?.length) {
              throw new Error(weather.reason || `FWI weather payload invalid for ${forest.name}`);
            }

            const hourIdx = getCurrentHourIndex(weather);
            const metrics = computeFireIndexMetrics(weather, hourIdx);

            console.info(FWI_DEBUG_PREFIX, 'forest metrics ready', {
              forestId: forest.id,
              forestName: forest.name,
              lat: forest.coordinates[0],
              lng: forest.coordinates[1],
              hourIdx,
              angstrom: metrics.ai,
              gfi: metrics.gfi,
              kbdi: metrics.kbdi,
            });

            nextData.push({
              id: forest.id,
              lat: forest.coordinates[0],
              lng: forest.coordinates[1],
              angstrom: metrics.ai,
              gfi: metrics.gfi,
              kbdi: metrics.kbdi,
              fwiBosnian: metrics.fwiBosnian,
              isi: metrics.isi,
              bui: metrics.bui,
            });
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              throw error;
            }

            const fallbackSnapshot = buildFallbackFwiSnapshot(forest);
            console.warn(FWI_DEBUG_PREFIX, 'forest fetch failed, using fallback snapshot', {
              forestId: forest.id,
              forestName: forest.name,
              error,
              fallbackSnapshot,
            });
            nextData.push(fallbackSnapshot);
          }
        }

        if (isCancelled) {
          return;
        }

        setForestFwiData(nextData);
        console.info(FWI_DEBUG_PREFIX, 'FWI fetch completed', {
          receivedPoints: nextData.length,
          pointIds: nextData.map((point) => point.id),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.info(FWI_DEBUG_PREFIX, 'FWI fetch aborted');
          return;
        }
        console.error('Unable to load FWI heatmap data.', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingFwi(false);
        }
      }
    };

    fetchFwiData();

    return () => {
      isCancelled = true;
      console.info(FWI_DEBUG_PREFIX, 'cleanup/abort pending FWI fetch');
      controller.abort();
    };
  }, [activeFwiLayers, forestFwiData.length, fwiSourceForests, isAnyFwiLayerActive]);

  const getIncidentIntensity = (incident: IncidentReport) => {
    if (incident.urgency === 'high') return 1;
    if (incident.urgency === 'medium') return 0.7;
    return 0.45;
  };

  const ReportLocationPicker = () => {
    useMapEvents({
      click(event) {
        if (!isReporting) return;
        onReportClick(event.latlng.lat, event.latlng.lng);
      },
    });

    return null;
  };

  const CustomLocationPicker = () => {
    useMapEvents({
      click(e) {
        if (!isPickingLocation) return;
        
        const { lat, lng } = e.latlng;
        
        // Create a custom forest region object
        const customForest: ForestRegion = {
          id: `custom-${Date.now()}`,
          name: language === Language.BS ? 'Odabrana lokacija' : 'Selected Location',
          type: RegionType.MIXED, // Default to mixed for custom points
          coordinates: [lat, lng],
          area: 0,
          riskScore: 0.5, // Neutral starting risk
        };

        setSelectedForest(customForest);
        setIsPickingLocation(false);
      },
    });
    return null;
  };

  const ThreatHeatmapLayer: React.FC<{
    data: IncidentReport[];
    gradient: Record<number, string>;
    radius: number;
    blur: number;
    visible: boolean;
    minOpacity?: number;
  }> = ({ data, gradient, radius, blur, visible, minOpacity = 0.35 }) => {
    const map = useMap();
    const heatLayerRef = useRef<L.HeatLayer | null>(null);
    const retryFrameRef = useRef<number | null>(null);

    useEffect(() => {
      const cancelLeafletHeatFrame = (layer: L.HeatLayer) => {
        const internalLayer = layer as L.HeatLayer & { _frame?: number | null };
        if (internalLayer._frame != null) {
          L.Util.cancelAnimFrame(internalLayer._frame);
          internalLayer._frame = null;
        }
      };

      const clearRetryFrame = () => {
        if (retryFrameRef.current !== null) {
          window.cancelAnimationFrame(retryFrameRef.current);
          retryFrameRef.current = null;
        }
      };

      const removeHeatLayer = () => {
        if (!heatLayerRef.current) return;
        cancelLeafletHeatFrame(heatLayerRef.current);
        heatLayerRef.current.remove();
        heatLayerRef.current = null;
      };

      const syncHeatLayer = () => {
        clearRetryFrame();

        if (!visible || data.length === 0) {
          removeHeatLayer();
          return;
        }

        const mapSize = map.getSize();
        if (mapSize.x <= 0 || mapSize.y <= 0) {
          retryFrameRef.current = window.requestAnimationFrame(syncHeatLayer);
          return;
        }

        const heatPoints: L.HeatLatLngTuple[] = data.map((incident) => [
          incident.lat,
          incident.lng,
          getIncidentIntensity(incident),
        ]);

        if (!heatLayerRef.current) {
          heatLayerRef.current = L.heatLayer([], {
            radius,
            blur,
            maxZoom: 10,
            minOpacity,
            gradient,
          });
        } else {
          heatLayerRef.current.setOptions({
            radius,
            blur,
            maxZoom: 10,
            minOpacity,
            gradient,
          });
        }

        const heatLayer = heatLayerRef.current;
        if (!heatLayer) {
          return;
        }

        heatLayer.setLatLngs(heatPoints);

        if (!map.hasLayer(heatLayer)) {
          try {
            heatLayer.addTo(map);
          } catch (error) {
            console.error('Heatmap layer failed to initialize; retrying after resize.', error);
            removeHeatLayer();
            retryFrameRef.current = window.requestAnimationFrame(syncHeatLayer);
          }
        }
      };

      const handleMapResize = () => {
        syncHeatLayer();
      };

      syncHeatLayer();
      map.on('resize', handleMapResize);

      return () => {
        clearRetryFrame();
        map.off('resize', handleMapResize);
        removeHeatLayer();
      };
    }, [blur, data, gradient, map, minOpacity, radius, visible]);

    return null;
  };

  return (
    <div ref={mapContainerRef} className="w-full h-full min-h-0 relative">
      
      {/* MAP CONTAINER */}
      <MapContainer center={BIH_CENTER} zoom={8} className="w-full h-full" ref={setMap} zoomControl={false}>
        <ReportLocationPicker />
        <CustomLocationPicker />
        {!shouldRenderStandaloneMeteoblue && (
          <TileLayer
              key={activeBaseLayerKey}
              url={activeBaseLayer ? activeBaseLayer.url : (isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png")}
              attribution={activeBaseLayer?.attribution}
          />
        )}
        {shouldRenderStandaloneMeteoblue && meteoblueUrl && (
          <TileLayer
            key={`meteoblue-${meteoblueUrl}`}
            url={meteoblueUrl}
            attribution="Meteoblue"
            opacity={0.78}
            pane={METEOBLUE_OVERLAY_PANE}
            zIndex={380}
            keepBuffer={0}
            updateWhenIdle={true}
            updateWhenZooming={false}
            eventHandlers={{ tileerror: handleMeteoblueTileError }}
          />
        )}
        <ThreatHeatmapLayer
          data={fireIncidents}
          gradient={FIRE_HEAT_GRADIENT}
          radius={46}
          blur={34}
          minOpacity={0.58}
          visible={activeLayers.has(MapLayer.FIRE_RISK)}
        />
        <ThreatHeatmapLayer
          data={floodIncidents}
          gradient={FLOOD_HEAT_GRADIENT}
          radius={34}
          blur={28}
          visible={activeLayers.has(MapLayer.FLOOD_RISK)}
        />
        <AngstromHeatLayer
          points={forestFwiData}
          rasterBounds={heatViewportBounds ?? undefined}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_ANGSTROM)}
        />
        <GFIHeatLayer
          points={forestFwiData}
          rasterBounds={heatViewportBounds ?? undefined}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_GFI)}
        />
        <KBDIHeatLayer
          points={forestFwiData}
          rasterBounds={heatViewportBounds ?? undefined}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_KBDI)}
        />
        <BosnianFWIHeatLayer
          points={forestFwiData}
          rasterBounds={heatViewportBounds ?? undefined}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_BOSNIAN)}
        />
        {/* AWS — FBiH and RS layers, filtered by the three typed sub-layers */}
        {(activeLayers.has('AWS Precipitation' as MapLayer) || 
          activeLayers.has('AWS Agro' as MapLayer) || 
          activeLayers.has('AWS Meteo' as MapLayer)) && (
          <>
            <AWSFBiHLayer activeTypes={activeLayers} />
            <AWSRsLayer activeTypes={activeLayers} />
          </>
        )}
        {datasetLayers
          .filter((layer) => activeDatasetLayerIds.has(layer.id))
          .map((layer) => (
            <DatasetGeoJsonLayer
              key={layer.id}
              layer={layer}
              filters={datasetLayerFilters[layer.id]}
              pane={DATASET_LAYER_PANE}
              refreshKey={datasetLayerRefreshKey}
              onPolygonClick={!isReporting && !isPickingLocation ? onDatasetPolygonClick : undefined}
            />
          ))}
        {activeLayers.has(MapLayer.RS_FIREFIGHTER_DENSITY) &&
          firefighterDensityData.features.length > 0 && (
            <GeoJSON
              key={firefighterDensityLayerKey}
              data={firefighterDensityData as any}
              style={firefighterDensityStyle}
              onEachFeature={handleFirefighterDensityFeature}
            />
          )}
        {borderLayerVisible && visibleBihCantonData.features.length > 0 && (
          <GeoJSON
            key={borderLayerDataKey}
            data={visibleBihCantonData as any}
            style={cantonBorderStyle}
          />
        )}

        {activeLayers.has(MapLayer.FIREFIGHTER_STATIONS) && (
          <LayerGroup>
            {FIREFIGHTER_STATIONS.map((station) => (
              <Marker
                key={station.id}
                position={station.coordinates}
                icon={FIREFIGHTER_STATION_ICONS[station.stationType]}
                eventHandlers={{
                  click: () => {
                    if (isReporting) {
                      onReportClick(station.coordinates[0], station.coordinates[1]);
                      return;
                    }
                    setSelectedStation(station);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -20]} opacity={1} interactive>
                  <FirefighterHoverCard
                    station={station}
                    language={language}
                    onOpenDetails={() => {
                      if (!isReporting) {
                        setSelectedStation(station);
                      }
                    }}
                  />
                </Tooltip>
              </Marker>
            ))}
          </LayerGroup>
        )}
        
        {/* FOREST MARKERS - Hover triggers Tooltip card, Button in Tooltip triggers Full Screen */}
        <LayerGroup>
          {MOCK_FORESTS.map(forest => {
             if (forest.type === RegionType.LANDFILL && !activeLayers.has(MapLayer.LANDFILLS)) return null;
             if (forest.type !== RegionType.LANDFILL && !activeLayers.has(MapLayer.FORESTS)) return null;
             return (
               <Marker 
                 key={forest.id} 
                 position={forest.coordinates} 
                 icon={getRegionIcon(forest.type)}
                 eventHandlers={{
                   click: () => {
                     if (isReporting) {
                       onReportClick(forest.coordinates[0], forest.coordinates[1]);
                       return;
                     }
                     setSelectedForest(forest);
                   }
                 }}
               >
                 <Tooltip direction="top" offset={[0, -20]} opacity={1} interactive>
                    <ForestHoverCard forest={forest} language={language} />
                 </Tooltip>
               </Marker>
             );
          })}
        </LayerGroup>

        {userPos && <Marker position={userPos} icon={UserIcon} />}
      </MapContainer>

      {selectedStation && (
        <FirefighterStationModal
          station={selectedStation}
          language={language}
          onClose={() => setSelectedStation(null)}
        />
      )}

      {/* --- FULL SCREEN WEATHER DASHBOARD OVERLAY --- */}
      {selectedForest && (
        <div className="fixed inset-0 z-[3000] h-[100dvh] min-h-[100dvh] bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 md:pl-[60px]">
           {/* ... Dashboard Header & Content ... */}
           {/* Header - Centralized with Sidebar Padding */}
           <div className="flex-none flex items-center justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 border-b border-slate-800 bg-slate-900/50 relative min-h-[120px]">
              
              {/* Centered Title Group */}
              <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl text-center">
                  <div className="flex items-center gap-5 justify-center flex-wrap">
                       {getForestIconElement(selectedForest.type)}
                       <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] leading-tight">
                         {selectedForest.name}
                       </h2>
                  </div>
                  
                  {/* Metadata Pill */}
                  <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] md:text-xs font-bold text-slate-400 bg-slate-950/60 px-6 py-2 rounded-full border border-slate-800/60 shadow-inner backdrop-blur-md">
                      <span className="flex items-center gap-2 text-blue-300">
                        <MapIcon size={14} className="opacity-70"/> 
                        <span className="font-mono">{t.dashboard.coordinates}: {selectedForest.coordinates[0].toFixed(3)}, {selectedForest.coordinates[1].toFixed(3)}</span>
                      </span>
                      <div className="hidden md:block w-px h-3 bg-slate-800"></div>
                      <span className="flex items-center gap-2 text-emerald-400">
                        <LandPlot size={14} className="opacity-70"/> 
                        <span>{t.dashboard.area}: {selectedForest.area.toLocaleString()} ha</span>
                      </span>
                      <div className="hidden md:block w-px h-3 bg-slate-800"></div>
                      <span className="flex items-center gap-2 text-purple-400">
                        <Globe2 size={14} className="opacity-70"/> 
                        <span>{forestWeather?.timezone || 'Europe/Sarajevo'}</span>
                      </span>
                  </div>
              </div>

              {/* Close Button - Absolute Right */}
              <button 
                onClick={() => setSelectedForest(null)} 
                className="absolute right-6 top-6 md:top-1/2 md:-translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500 border border-slate-800 transition-all shadow-2xl z-50 group backdrop-blur-sm"
              >
                 <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8 scrollbar-thin scrollbar-thumb-slate-700">
              {loadingWeather || !forestWeather ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                      <Loader2 size={48} className="animate-spin text-blue-500" />
                      <p className="font-mono text-sm tracking-widest uppercase">{t.dashboard.loading}</p>
                  </div>
              ) : (
                <div className="max-w-[1600px] mx-auto space-y-6">
                    
                    {/* GRID LAYOUT FOR DATA */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* LEFT COLUMN: Standard Weather */}
                        <div className="space-y-6">
                             {/* CURRENT CONDITIONS HERO */}
                            <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 text-white">
                                    {React.createElement(getWeatherInfo(forestWeather.current.weather_code).icon, { size: 160 })}
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">{t.dashboard.currentConditions}</div>
                                            <div className="flex gap-4">
                                                <span className="text-8xl font-black text-white tracking-tighter">{Math.round(forestWeather.current.temperature_2m)}°</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-medium text-white capitalize">{getWeatherInfo(forestWeather.current.weather_code).label}</span>
                                                    <span className="text-slate-400">{t.dashboard.feelsLike} {Math.round(forestWeather.current.apparent_temperature)}°</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {[
                                            { label: t.dashboard.wind, val: `${forestWeather.current.wind_speed_10m} km/h`, sub: `${forestWeather.current.wind_direction_10m}°`, icon: Wind, color: 'text-cyan-400' },
                                            { label: t.dashboard.humidity, val: `${forestWeather.current.relative_humidity_2m}%`, sub: 'Relative', icon: Droplets, color: 'text-blue-400' },
                                            { label: t.dashboard.pressure, val: `${Math.round(forestWeather.current.pressure_msl)} hPa`, sub: 'MSL', icon: Gauge, color: 'text-emerald-400' },
                                            { label: t.dashboard.precipitation, val: `${forestWeather.current.precipitation} mm`, sub: 'Current', icon: Umbrella, color: 'text-blue-300' },
                                            { label: t.dashboard.uvIndex, val: `${forestWeather.hourly.uv_index[getCurrentHourIndex(forestWeather)]}`, sub: 'Scale', icon: SunDim, color: 'text-yellow-400' },
                                            { label: t.dashboard.windGusts, val: `${forestWeather.current.wind_gusts_10m} km/h`, sub: 'Max', icon: Wind, color: 'text-orange-400' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <stat.icon size={14} className={stat.color} />
                                                    <span className="text-[10px] uppercase font-bold text-slate-500">{stat.label}</span>
                                                </div>
                                                <div className="text-lg font-bold text-white">{stat.val}</div>
                                                {stat.sub && <div className="text-[10px] text-slate-500 font-mono">{stat.sub}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                             {/* FORECAST SECTION (TOGGLEABLE) */}
                             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        {forecastMode === 'daily' ? <Calendar size={14} /> : <Clock size={14} />} 
                                        {forecastMode === 'daily' ? t.dashboard.forecast7d : t.dashboard.forecast24h}
                                    </h3>
                                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                        <button 
                                            onClick={() => setForecastMode('hourly')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${forecastMode === 'hourly' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {t.dashboard.hourlyBtn}
                                        </button>
                                        <button 
                                            onClick={() => setForecastMode('daily')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${forecastMode === 'daily' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {t.dashboard.dailyBtn}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                    {forecastMode === 'daily' ? (
                                        // DAILY FORECAST CARDS (SQUARE)
                                        forestWeather.daily.time.slice(0, 7).map((timeStr, i) => {
                                            const code = forestWeather.daily.weather_code[i];
                                            const max = forestWeather.daily.temperature_2m_max[i];
                                            const min = forestWeather.daily.temperature_2m_min[i];
                                            const prob = forestWeather.daily.precipitation_probability_max[i];
                                            const wInfo = getWeatherInfo(code);

                                            return (
                                                <div key={i} className="flex-shrink-0 w-32 h-32 flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all group shadow-lg">
                                                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-wider">{i === 0 ? t.dashboard.today : fmtDay(timeStr)}</span>
                                                    
                                                    <wInfo.icon size={32} className="text-white" />
                                                    
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-baseline gap-1">
                                                             <span className="text-white font-black text-lg">{Math.round(max)}°</span>
                                                             <span className="text-slate-600 text-xs font-bold">/ {Math.round(min)}°</span>
                                                        </div>
                                                    </div>
                                                    {prob > 0 ? (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full w-full justify-center">
                                                            <Droplets size={10} /> {prob}%
                                                        </div>
                                                    ) : (
                                                         <div className="h-[22px]" /> // Spacer
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        // HOURLY FORECAST CARDS (SQUARE)
                                        (() => {
                                            const startIdx = getCurrentHourIndex(forestWeather);
                                            if (startIdx === -1) return <div className="text-slate-500 text-xs p-4">No hourly data available</div>;
                                            
                                            return forestWeather.hourly.time.slice(startIdx, startIdx + 24).map((timeStr, i) => {
                                                const idx = startIdx + i;
                                                const temp = forestWeather.hourly.temperature_2m[idx];
                                                const code = forestWeather.hourly.weather_code[idx];
                                                const prob = forestWeather.hourly.precipitation_probability[idx];
                                                const wInfo = getWeatherInfo(code);

                                                return (
                                                    <div key={i} className="flex-shrink-0 w-32 h-32 flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all group shadow-lg">
                                                        <span className="text-xs font-bold text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-wider">{i === 0 ? t.dashboard.now : fmtTime(timeStr)}</span>
                                                        <wInfo.icon size={32} className="text-slate-300 group-hover:text-white transition-colors" />
                                                        <span className="text-white font-black text-2xl">{Math.round(temp)}°</span>
                                                        <div className={`text-[10px] font-bold flex items-center gap-1.5 px-2 py-1 rounded-full ${prob > 0 ? 'text-blue-400 bg-blue-500/10' : 'text-slate-700 bg-slate-900'}`}>
                                                            <Droplets size={10} /> {prob}%
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                </div>
                            </div>

                             {/* RAIN PROBABILITY GRAPH (Next 12 Hours) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                    <Umbrella size={14} /> {t.dashboard.rainProb}
                                </h3>
                                {/* Explicit height is required for child percentage heights to work reliably in flex containers */}
                                <div className="h-40 flex items-end gap-1 w-full"> 
                                    {(() => {
                                    const startIdx = getCurrentHourIndex(forestWeather);
                                    // Show next 12 hours or fallback
                                    const hoursToShow = startIdx !== -1 ? forestWeather.hourly.precipitation_probability.slice(startIdx, startIdx + 12) : [];
                                    
                                    if (hoursToShow.length === 0) return <div className="text-slate-500 text-xs w-full text-center self-center">No hourly data</div>;

                                    return hoursToShow.map((prob, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-slate-950/50 rounded-t-sm relative group mx-0.5 flex flex-col justify-end h-full"
                                        >
                                            <div 
                                                className="w-full bg-blue-500 hover:bg-blue-400 transition-all duration-500 rounded-t-sm relative"
                                                style={{ 
                                                    height: `${Math.max(prob || 0, 4)}%`, // Ensure minimal visibility
                                                    minHeight: '4px',
                                                    opacity: prob > 0 ? 1 : 0.2
                                                }}
                                            >
                                                 {/* Tooltip */}
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-slate-900 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 shadow-xl pointer-events-none transition-opacity">
                                                    +{i}h: {prob}%
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                    })()}
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-2 pt-2 border-t border-slate-800">
                                    <span>{t.dashboard.now}</span>
                                    <span>+6h</span>
                                    <span>+12h</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Advanced Analysis */}
                        <div className="space-y-6">
                            
                            {/* FIRE RISK INDICES */}
                            {(() => {
                                const hIdx = getCurrentHourIndex(forestWeather);
                                const risk = calculateFireIndices(forestWeather, hIdx);
                                return (
                                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                            <Flame size={14} className="text-red-500" /> {t.dashboard.fireRisk}
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Bosnian FWI */}
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"></div>
                                                        <span className="text-sm font-black text-white tracking-wide">{t.dashboard.fwiBosnian}</span>
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950/50 border border-white/5 ${risk.fwiColor}`}>{risk.fwiRisk}</span>
                                                </div>
                                                <div className="relative pt-6 pb-2">
                                                    {/* Value Indicator Arrow */}
                                                    <div 
                                                        className="absolute top-2 transition-all duration-1000 ease-out z-20"
                                                        style={{ 
                                                            left: `${Math.min(100, (risk.fwiBosnian / 80) * 100)}%`, 
                                                            transform: 'translateX(-50%)' 
                                                        }}
                                                    >
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
                                                    </div>
                                                    
                                                    {/* Full Gradient Scale Bar */}
                                                    <div className="w-full h-4 rounded-full bg-gradient-to-r from-green-500 via-orange-500 to-red-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] relative overflow-hidden border border-white/10">
                                                        {/* Scale Ticks */}
                                                        <div className="absolute inset-0 flex justify-between px-[1px]">
                                                            {[...Array(9)].map((_, i) => (
                                                                <div key={i} className="w-px h-full bg-slate-950/30" />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Scale Labels */}
                                                    <div className="flex justify-between px-0.5 mt-1.5">
                                                        {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(v => (
                                                            <span key={v} className="text-[10px] font-black text-slate-400 font-mono">
                                                                {v}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[11px] text-slate-400 font-mono text-right flex justify-end items-center gap-1.5">
                                                    <span className="text-white font-black text-sm">{risk.fwiBosnian.toFixed(2)}</span>
                                                    <span className="opacity-40">/ 80</span>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-5">
                                                    {/* Factors Grid */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                                {language === Language.BS ? 'INPUT PARAMETRI' : 'INPUT PARAMETERS'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[
                                                                { i: Thermometer, l: 'Temp', c: 'text-orange-400' },
                                                                { i: Droplets, l: language === Language.BS ? 'Vlaga' : 'Humi', c: 'text-blue-400' },
                                                                { i: Wind, l: language === Language.BS ? 'Vjetar' : 'Wind', c: 'text-emerald-400' },
                                                                { i: CloudRain, l: language === Language.BS ? 'Kiša' : 'Rain', c: 'text-indigo-400' }
                                                            ].map((item, idx) => (
                                                                <div key={idx} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.08]">
                                                                    <item.i size={14} className={item.c} />
                                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{item.l}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Formula Deep Dive */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-1 h-3 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                                {language === Language.BS ? 'STRUKTURA FORMULE' : 'FORMULA STRUCTURE'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {[
                                                                { label: 'FFMC', name: language === Language.BS ? 'Površinska vlažnost' : 'Fine Fuel Moisture', p: 45, color: 'bg-blue-500', desc: language === Language.BS ? 'Odziv na promjene < 1h' : 'Responds in < 1h' },
                                                                { label: 'DMC', name: language === Language.BS ? 'Srednji sloj' : 'Duff Moisture', p: 30, color: 'bg-emerald-500', desc: language === Language.BS ? 'Odziv 12-15 dana' : '12-15 day response' },
                                                                { label: 'DC', name: language === Language.BS ? 'Duboka suša' : 'Drought Code', p: 25, color: 'bg-orange-500', desc: language === Language.BS ? 'Dugoročni deficit' : 'Long-term deficit' }
                                                            ].map((code, idx) => (
                                                                <div key={idx} className="space-y-1.5 group">
                                                                    <div className="flex justify-between items-end">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-white leading-none mb-0.5">{code.label} <span className="text-slate-500 font-bold ml-1">| {code.name}</span></span>
                                                                            <span className="text-[8px] text-slate-500 font-bold italic">{code.desc}</span>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-white opacity-40 group-hover:opacity-100 transition-opacity">{code.p}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                                        <div className={`h-full ${code.color} rounded-full transition-all duration-1000 delay-300 shadow-[0_0_8px] shadow-current`} style={{ width: `${code.p}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Vegetation Factor */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-1 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                                {language === Language.BS ? 'VEGETACIJSKI FAKTOR' : 'VEGETATION FACTOR'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase">{language === Language.BS ? 'Četinari' : 'Coniferous'}</span>
                                                                    <span className="text-[8px] font-black text-red-500">+15%</span>
                                                                </div>
                                                                <p className="text-[8px] text-slate-500 leading-tight">
                                                                    {language === Language.BS ? 'Visoka zapaljivost zbog smola i niske vlažnosti iglica.' : 'High flammability due to resins and low needle moisture.'}
                                                                </p>
                                                            </div>
                                                            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase">{language === Language.BS ? 'Bjelogorica' : 'Deciduous'}</span>
                                                                    <span className="text-[8px] font-black text-emerald-500">-10%</span>
                                                                </div>
                                                                <p className="text-[8px] text-slate-500 leading-tight">
                                                                    {language === Language.BS ? 'Veća vlažnost lista pruža prirodnu otpornost na vatru.' : 'Higher leaf moisture provides natural fire resistance.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2.5">
                                                        <p className="text-[9px] text-slate-400 leading-relaxed italic">
                                                            <span className="text-blue-400 font-black not-italic mr-1">MODEL:</span>
                                                            {language === Language.BS
                                                                ? "Finalni BH FWI se dobija kombinacijom ISI i BUI indeksa, koristeći modifikovanu Canadian FWI formulu optimizovanu za orografiju i specifične vegetacijske zone Bosne i Hercegovine."
                                                                : "Final BH FWI is derived by combining ISI and BUI indexes, using a modified Canadian FWI formula optimized for the orography and specific vegetation zones of Bosnia and Herzegovina."}
                                                        </p>
                                                        <div className="h-px bg-white/5 w-full"></div>
                                                        <p className="text-[9px] text-slate-500 leading-relaxed italic">
                                                            <span className="text-emerald-400 font-black not-italic mr-1">ADJUSTMENT:</span>
                                                            {language === Language.BS
                                                                ? "Sistem vrši automatsku korekciju rezultata na osnovu gustine goriva i nagiba terena, što direktno utiče na projektovanu brzinu širenja požara."
                                                                : "The system automatically adjusts results based on fuel density and terrain slope, which directly impacts the projected fire spread rate."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ADVANCED ATMOSPHERIC DATA */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                    <LayersIcon size={14} className="text-blue-400" /> {t.dashboard.advancedAtmosphere}
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                     {[
                                        { l: t.dashboard.seaLevelPress, v: `${Math.round(forestWeather.hourly.pressure_msl[getCurrentHourIndex(forestWeather)])} hPa`, i: Gauge },
                                        { l: t.dashboard.surfacePress, v: `${Math.round(forestWeather.hourly.surface_pressure[getCurrentHourIndex(forestWeather)])} hPa`, i: ArrowUp },
                                        { l: t.dashboard.visibility, v: `${(forestWeather.hourly.visibility[getCurrentHourIndex(forestWeather)] / 1000).toFixed(1)} km`, i: Eye },
                                        { l: t.dashboard.evapotranspiration, v: `${forestWeather.hourly.evapotranspiration[getCurrentHourIndex(forestWeather)]} mm`, i: Droplets },
                                        { l: t.dashboard.et0, v: `${forestWeather.hourly.et0_fao_evapotranspiration[getCurrentHourIndex(forestWeather)]} mm`, i: Sprout },
                                        { l: t.dashboard.vapourPress, v: `${forestWeather.hourly.vapour_pressure_deficit[getCurrentHourIndex(forestWeather)]} kPa`, i: Cloud },
                                        { l: t.dashboard.cloudCover, v: `${forestWeather.hourly.cloud_cover[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: t.dashboard.lowClouds, v: `${forestWeather.hourly.cloud_cover_low[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: t.dashboard.midClouds, v: `${forestWeather.hourly.cloud_cover_mid[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: t.dashboard.highClouds, v: `${forestWeather.hourly.cloud_cover_high[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                     ].map((item, i) => (
                                         <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                                             <div className="flex items-center gap-2 text-slate-400">
                                                 <item.i size={12} /> {item.l}
                                             </div>
                                             <span className="font-mono text-white">{item.v}</span>
                                         </div>
                                     ))}
                                </div>
                            </div>

                            {/* WIND & SOIL PROFILES */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Wind Profile */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                        <Wind size={14} className="text-cyan-400" /> {t.dashboard.verticalWind}
                                    </h3>
                                    <div className="space-y-2">
                                        {[180, 120, 80, 10].map(h => {
                                            const hIdx = getCurrentHourIndex(forestWeather);
                                            const speed = forestWeather.hourly[`wind_speed_${h}m` as keyof typeof forestWeather.hourly][hIdx];
                                            const dir = forestWeather.hourly[`wind_direction_${h}m` as keyof typeof forestWeather.hourly][hIdx];
                                            return (
                                                <div key={h} className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded border border-slate-800/50">
                                                    <span className="text-slate-500 font-mono w-12">{h}m</span>
                                                    <div className="flex items-center gap-2">
                                                        <Navigation size={10} style={{ transform: `rotate(${dir}deg)`}} className="text-cyan-500" />
                                                        <span className="text-white font-bold">{speed} <span className="text-[9px] text-slate-600 font-normal">km/h</span></span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Soil Profile */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                        <LayersIcon size={14} className="text-amber-600" /> {t.dashboard.soilProfile}
                                    </h3>
                                     <div className="space-y-2">
                                        {[0, 6, 18, 54].map(d => {
                                            const hIdx = getCurrentHourIndex(forestWeather);
                                            const temp = forestWeather.hourly[`soil_temperature_${d}cm` as keyof typeof forestWeather.hourly][hIdx];
                                            // Handle varying moisture depths key names broadly or approximate
                                            let moistureKey = '';
                                            if (d === 0) moistureKey = 'soil_moisture_0_to_1cm';
                                            else if (d === 6) moistureKey = 'soil_moisture_3_to_9cm'; // approx
                                            else if (d === 18) moistureKey = 'soil_moisture_9_to_27cm'; // approx
                                            else moistureKey = 'soil_moisture_27_to_81cm';
                                            
                                            const moisture = forestWeather.hourly[moistureKey as keyof typeof forestWeather.hourly]?.[hIdx] ?? 0;

                                            return (
                                                <div key={d} className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded border border-slate-800/50">
                                                    <span className="text-slate-500 font-mono w-12">{d}cm</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-amber-200 flex items-center gap-1"><Thermometer size={10}/> {temp}°</span>
                                                        <span className="text-blue-400 flex items-center gap-1"><Droplets size={10}/> {moisture}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}

      <div
        className="fixed top-0 left-0 right-0 z-[1900] bg-slate-950 md:hidden pointer-events-none"
        style={{ height: 'env(safe-area-inset-top)' }}
      />

      {/* Floating Operations Header (Aesthetic) - Hides when interaction banners are active */}
      {!isPickingLocation && !isReporting && (
        <div ref={statusPanelRef} className="absolute top-[calc(env(safe-area-inset-top)+4.5rem)] left-4 right-4 md:top-4 md:left-20 md:right-auto z-[2000] pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4 md:w-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t.surveillanceNetwork}</span>
              <span className="text-xs font-bold text-white leading-none">{t.status}: {t.nominal} / {t.tracking} {incidents.length} {t.alerts}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <MapControls 
        containerRef={mapControlsRef}
        activeLayers={activeLayers} 
        onToggleLayer={onToggleLayer} 
        onSetBaseLayer={onSetBaseLayer}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
        language={language}
        borderLayerVisible={borderLayerVisible}
        cantons={BIH_CANTONS}
        selectedCantonCodes={selectedCantonCodes}
        federationSelected={federationSelected}
        republicSrpskaSelected={republicSrpskaSelected}
        brckoDistrictSelected={brckoDistrictSelected}
        onToggleBorderLayer={handleToggleBorderLayer}
        onToggleFederation={handleToggleFederation}
        onToggleRepublicSrpska={handleToggleRepublicSrpska}
        onToggleBrckoDistrict={handleToggleBrckoDistrict}
        onToggleCanton={handleToggleCanton}
        onStartPickingLocation={() => setIsPickingLocation(true)}
      />

      {/* PICK LOCATION BANNER - Relocated to top instead of status panel */}
      {isPickingLocation && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+4.5rem)] left-4 right-4 md:top-4 md:left-20 md:right-auto z-[2500] pointer-events-none animate-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 border border-blue-400 pl-6 pr-3 py-2.5 rounded-xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center gap-4 pointer-events-auto backdrop-blur-md md:w-[420px]">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-white font-black uppercase tracking-widest text-[9px] leading-none mb-1">
                {language === Language.BS ? 'ODABIR LOKACIJE ZA FWI PRORAČUN' : 'SELECT LOCATION FOR FWI CALCULATION'}
              </span>
              <span className="text-blue-100 text-[11px] font-bold leading-tight">
                {language === Language.BS ? 'Pritisnite na mapu za analizu' : 'Tap on map for analysis'}
              </span>
            </div>
            <button 
              onClick={() => setIsPickingLocation(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white shrink-0 -mr-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Stacked Legends Container (Left) */}
      {showLegend && (
        <div ref={legendPanelRef} className="absolute bottom-28 left-4 right-4 md:bottom-8 md:left-[4.5rem] md:right-auto z-[2000] flex flex-row md:flex-col gap-2 animate-in slide-in-from-left-2 duration-300">
          {/* Existing GIS Legend */}
          <div className="order-1 md:order-2 flex-1 md:flex-none min-w-0 md:min-w-[160px] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.gisLegend}</span>
              </div>
              <button onClick={() => setShowLegend(false)} className="text-slate-600 hover:text-slate-400 md:hidden">
                <ChevronRight size={12} className="rotate-90" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" /> {t.legend.activeFire}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" /> {t.legend.activeFlood}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full border border-blue-500" /> {t.legend.sensorStation}
              </div>
              <div className="pt-1 mt-1 border-t border-slate-800/50">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> {t.legend.liveData}
                </div>
              </div>
            </div>
          </div>

          {/* New Classification Legend */}
          <div className="order-2 md:order-1 flex-1 md:flex-none min-w-0 md:min-w-[160px] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Trees size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.classLegend}</span>
            </div>
            <div className="space-y-2">
              {Object.values(RegionType).map((type) => {
                 const style = REGION_STYLES[type];
                 const path = ICON_PATHS[style.iconType] || ICON_PATHS.tree;
                 return (
                   <div key={type} className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
                     {t.regionTypes[type]}
                   </div>
                 )
              })}
            </div>
          </div>
        </div>
      )}

      {/* FWI Legend Scale */}
      {activeFwiLayerInfo && (
        <div className="absolute bottom-8 right-24 z-[2000] hidden md:flex flex-col bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl w-80 animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeFwiLayerInfo.iconColor} shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
              <span className="text-[12px] font-black text-white tracking-wide">{activeFwiLayerInfo.title}</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase opacity-80">Index Scale</span>
          </div>
          <div className="relative mt-4 mb-2">
            {/* Value Indicator Arrow */}
            {activeFwiLayerInfo.currentValue !== null && (
              <div 
                className="absolute -top-3.5 transition-all duration-1000 ease-out z-20"
                style={{ 
                  left: `${Math.min(100, (activeFwiLayerInfo.currentValue / 80) * 100)}%`, 
                  transform: 'translateX(-50%)' 
                }}
              >
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
              </div>
            )}
            
            {/* Gradient Scale Bar */}
            <div className={`h-4 w-full rounded-full ${activeFwiLayerInfo.gradient} shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] relative overflow-hidden border border-white/10`}>
              {/* Scale Ticks */}
              <div className="absolute inset-0 flex justify-between px-[1px]">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-px h-full bg-slate-950/30" />
                ))}
              </div>
            </div>
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between px-0.5 mt-1">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(v => (
              <span key={v} className="text-[10px] font-black text-slate-400 font-mono">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GPS FAB */}
      <div ref={gpsFabRef} className="absolute bottom-8 right-6 z-[2000]">
        <button 
          onClick={handleLocateMe}
          title="My Location"
          className="w-12 h-12 bg-white text-slate-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <NavIcon size={20} className="fill-current" />}
        </button>
      </div>

      {/* Incident Reporting Banner - Relocated to top instead of status panel */}
      {isReporting && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+4.5rem)] left-4 right-4 md:top-4 md:left-20 md:right-auto z-[3000] pointer-events-none animate-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 border border-blue-400 pl-6 pr-3 py-2.5 rounded-xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center gap-4 pointer-events-auto backdrop-blur-md md:w-[420px]">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse shrink-0">
              <NavIcon size={24} className="text-white" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-white font-black uppercase tracking-widest text-[9px] leading-none mb-1">
                {t.dashboard.selectIncidentTitle}
              </span>
              <span className="text-blue-100 text-[11px] font-bold leading-tight">
                {t.dashboard.selectIncidentSubtitle}
              </span>
            </div>
            <button 
              onClick={onCancelReport}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white shrink-0 -mr-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* FWI Loading Overlay */}
      {isLoadingFwi && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center">
             <div className="absolute w-32 h-32 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
             <Loader2 size={64} className="text-blue-500 animate-spin relative z-10" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-center gap-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-[0.2em] uppercase drop-shadow-2xl flex items-center gap-6">
              {t.dashboard.calculatingFwi}
              <div className="flex gap-2 items-center h-full pt-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                 <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                 <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};
