
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, LayerGroup, GeoJSON, WMSTileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Layers, Waves, Flame, Globe2, Sun, Moon, Wind, Thermometer, Loader2, Navigation as NavIcon, Settings2, Info, ChevronRight, Check, Settings, Map as MapIcon, Satellite, Mountain, Leaf, X, Trash2, Trees, ShieldCheck, LandPlot, ThermometerSun, Snowflake, CloudRain, Droplets, Zap, Umbrella, Cloud, CloudLightning, Eye, ArrowUp, Calendar, Clock, AlertTriangle, Sunrise, Sunset, Gauge, Navigation, Fan, Layers as LayersIcon, Sprout, SunDim, MoveUp, Radar } from 'lucide-react';
import { BIH_CENTER, MOCK_FORESTS, TRANSLATIONS, REGION_STYLES, PROTECTED_AREAS_DATA } from '../../constants';
import { IncidentReport, IncidentType, MapLayer, Language, RegionType, OpenMeteoResponse, ForestRegion } from '../../types';
import { bihBorderData } from '../../bihData';
import { MapControls } from './MapControls';
import { ForestHoverCard } from './ForestHoverCard';
import { AngstromHeatLayer } from '../Layers/FWI/AngstromHeatLayer';
import { GFIHeatLayer } from '../Layers/FWI/GFIHeatLayer';
import { KBDIHeatLayer } from '../Layers/FWI/KBDIHeatLayer';

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
}

const FWI_DEBUG_PREFIX = '[FWI DEBUG][GISMap]';

export const GISMap: React.FC<GISMapProps> = ({ 
  incidents, activeLayers, onReportClick, onCancelReport, isReporting, onToggleLayer, onSetBaseLayer, isDarkMode, onToggleTheme, language, onSetLanguage
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const hasAdjustedInitialView = useRef(false);
  const bihBounds = useMemo(() => GlobalLeaflet.geoJSON(bihBorderData as any).getBounds(), []);
  const statusPanelRef = useRef<HTMLDivElement | null>(null);
  const mapControlsRef = useRef<HTMLDivElement | null>(null);
  const legendPanelRef = useRef<HTMLDivElement | null>(null);
  const gpsFabRef = useRef<HTMLDivElement | null>(null);
  const reportingBannerRef = useRef<HTMLDivElement | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // -- NEW DASHBOARD STATE --
  const [selectedForest, setSelectedForest] = useState<ForestRegion | null>(null);
  const [forestWeather, setForestWeather] = useState<OpenMeteoResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [forecastMode, setForecastMode] = useState<'hourly' | 'daily'>('hourly');
  const [forestFwiData, setForestFwiData] = useState<ForestFireIndexSnapshot[]>([]);
  const [isLoadingFwi, setIsLoadingFwi] = useState(false);
  const [isMeteoblueUnavailable, setIsMeteoblueUnavailable] = useState(false);

  // -- METEOBLUE DYNAMIC STATE --
  const [meteoblueUrl, setMeteoblueUrl] = useState<string>('');

  const t = TRANSLATIONS[language];

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
    () =>
      [MapLayer.FWI_ANGSTROM, MapLayer.FWI_GFI, MapLayer.FWI_KBDI].some((layer) =>
        activeLayers.has(layer)
      ),
    [activeLayers]
  );
  const fwiSourceForests = useMemo(
    () => MOCK_FORESTS.filter((forest) => forest.type !== RegionType.LANDFILL),
    []
  );
  const fwiRasterBounds = useMemo(
    () => ({
      west: bihBounds.getWest() - 0.45,
      east: bihBounds.getEast() + 0.45,
      south: bihBounds.getSouth() - 0.35,
      north: bihBounds.getNorth() + 0.35,
    }),
    [bihBounds]
  );
  const meteoblueBounds = useMemo(
    () =>
      [
        [bihBounds.getSouth() - 0.15, bihBounds.getWest() - 0.15],
        [bihBounds.getNorth() + 0.15, bihBounds.getEast() + 0.15],
      ] as L.LatLngBoundsExpression,
    [bihBounds]
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

    const ensurePane = (name: string, zIndex: number) => {
      const pane = map.getPane(name) ?? map.createPane(name);
      pane.style.zIndex = `${zIndex}`;
      pane.style.pointerEvents = 'none';
    };

    ensurePane(FWI_OVERLAY_PANE, 360);
    ensurePane(METEOBLUE_OVERLAY_PANE, 380);
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
      if (hasAdjustedInitialView.current) return;
      if (!mapContainerRef.current) return;

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const edgeGap = 16;
      const padding = {
        top: edgeGap,
        right: edgeGap,
        bottom: edgeGap,
        left: edgeGap,
      };

      const applyOverlayPadding = (
        element: HTMLDivElement | null,
        edges: Array<'top' | 'right' | 'bottom' | 'left'>
      ) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();

        if (edges.includes('top')) {
          padding.top = Math.max(padding.top, Math.max(0, rect.bottom - containerRect.top) + edgeGap);
        }
        if (edges.includes('right')) {
          padding.right = Math.max(padding.right, Math.max(0, containerRect.right - rect.left) + edgeGap);
        }
        if (edges.includes('bottom')) {
          padding.bottom = Math.max(padding.bottom, Math.max(0, containerRect.bottom - rect.top) + edgeGap);
        }
        if (edges.includes('left')) {
          padding.left = Math.max(padding.left, Math.max(0, rect.right - containerRect.left) + edgeGap);
        }
      };

      applyOverlayPadding(statusPanelRef.current, isMobile ? ['top', 'left'] : ['top']);
      applyOverlayPadding(mapControlsRef.current, isMobile ? ['top', 'right'] : ['top']);
      applyOverlayPadding(legendPanelRef.current, isMobile ? ['bottom', 'left'] : ['left']);
      applyOverlayPadding(gpsFabRef.current, isMobile ? ['bottom', 'right'] : ['bottom']);
      applyOverlayPadding(reportingBannerRef.current, ['top']);

      map.fitBounds(bihBounds, {
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
        maxZoom: isMobile ? 7 : 8,
        animate: false
      });
      hasAdjustedInitialView.current = true;
    };

    let firstFrame = 0;
    let secondFrame = 0;
    const timeoutId = window.setTimeout(() => {
      syncMapSize();
      applyInitialViewport();
    }, 250);

    firstFrame = window.requestAnimationFrame(() => {
      syncMapSize();
      applyInitialViewport();
      secondFrame = window.requestAnimationFrame(() => {
        syncMapSize();
        applyInitialViewport();
      });
    });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && mapContainerRef.current
        ? new ResizeObserver(syncMapSize)
        : null;

    if (resizeObserver && mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', syncMapSize);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', syncMapSize);
      resizeObserver?.disconnect();
    };
  }, [bihBounds, isReporting, map, showLegend]);

  // Helpers
  const fmtTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (isoString: string) => new Date(isoString).toLocaleDateString([], { weekday: 'short', day: 'numeric' });

  // Get current hour index
  const getCurrentHourIndex = (weather: FireIndexWeatherData) => {
    if (!weather.hourly.time.length) return -1;

    // Use the API's own current timestamp so we stay in the same timezone
    // as the hourly arrays returned by Open-Meteo.
    const currentHourStr = weather.current.time.slice(0, 13); // YYYY-MM-DDTHH
    const exactHourIndex = weather.hourly.time.findIndex(t => t.startsWith(currentHourStr));

    if (exactHourIndex !== -1) {
      return exactHourIndex;
    }

    const nextAvailableIndex = weather.hourly.time.findIndex(t => t >= weather.current.time);
    return nextAvailableIndex !== -1 ? nextAvailableIndex : 0;
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

  // -- FIRE INDEX CALCULATIONS --
  const computeFireIndexMetrics = (weather: FireIndexWeatherData, hourIdx: number) => {
    const safeHourIdx = hourIdx >= 0 ? hourIdx : 0;
    const temp = weather.hourly.temperature_2m[safeHourIdx] ?? 0;
    const humidity = weather.hourly.relative_humidity_2m[safeHourIdx] ?? 0;
    const windKmh = weather.hourly.wind_speed_10m[safeHourIdx] ?? 0;
    const rain = weather.daily.precipitation_sum[0] ?? 0;
    const ai = (humidity / 20 + (27 - temp) / 10);
    const dryDays = weather.daily.precipitation_sum.filter((p) => p < 2.0).length;
    const zoneFactor = 1.2;
    const gfi =
      (Math.max(0, temp) * (100 - humidity) * windKmh / 1000) *
      (1 + dryDays / 20) *
      zoneFactor;
    let kbdi = (Math.max(0, temp) * 10) - (rain * 50);
    if (kbdi < 0) kbdi = 0;
    kbdi = Math.min(800, kbdi + (dryDays * 50));

    return { ai, gfi, kbdi };
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
      // Lower Angstrom means higher danger, so invert the synthetic severity.
      angstrom: 5.8 - (intensity * 3.8),
      gfi: 1 + (intensity * 11),
      kbdi: 90 + (intensity * 520),
    };
  };

  const calculateFireIndices = (weather: FireIndexWeatherData, hourIdx: number) => {
    const { ai, gfi, kbdi } = computeFireIndexMetrics(weather, hourIdx);

    // Angström Index
    // Formula: (H / 20 + (27 - T) / 10) * (10 / (W_ms + 10)) -> Used simpler kmh adaptation often seen
    // High AI = Low Risk. Low AI = High Risk.
    // If AI < 2.5 Risk High.
    
    let aiRisk = t.riskLevels.low;
    let aiColor = "text-emerald-500";
    if (ai < 2.0) { aiRisk = t.riskLevels.extreme; aiColor = "text-purple-500"; }
    else if (ai < 2.5) { aiRisk = t.riskLevels.veryHigh; aiColor = "text-red-600"; }
    else if (ai < 3.0) { aiRisk = t.riskLevels.high; aiColor = "text-orange-500"; }
    else if (ai < 4.0) { aiRisk = t.riskLevels.moderate; aiColor = "text-yellow-500"; }

    // GFI (Forest Fire Weather Index - Simplified)
    // Count dry days (rain < 2mm in forecast as proxy for trend)
    let gfiRisk = t.riskLevels.low;
    let gfiColor = "text-emerald-500";
    if (gfi > 15) { gfiRisk = t.riskLevels.extreme; gfiColor = "text-purple-500"; }
    else if (gfi > 9) { gfiRisk = t.riskLevels.veryHigh; gfiColor = "text-red-600"; }
    else if (gfi > 5) { gfiRisk = t.riskLevels.high; gfiColor = "text-orange-500"; }
    else if (gfi > 2) { gfiRisk = t.riskLevels.moderate; gfiColor = "text-yellow-500"; }

    // KBDI (Approximation without historic DB)
    // Daily drought factor based on max temp and lack of rain
    let kbdiRisk = t.riskLevels.low;
    let kbdiColor = "text-emerald-500";
    if (kbdi > 600) { kbdiRisk = t.riskLevels.extreme; kbdiColor = "text-purple-500"; }
    else if (kbdi > 400) { kbdiRisk = t.riskLevels.high; kbdiColor = "text-red-600"; }
    else if (kbdi > 200) { kbdiRisk = t.riskLevels.moderate; kbdiColor = "text-orange-500"; }

    return { ai, aiRisk, aiColor, gfi, gfiRisk, gfiColor, kbdi, kbdiRisk, kbdiColor };
  };

  const activeFwiLayers = useMemo(
    () =>
      [MapLayer.FWI_ANGSTROM, MapLayer.FWI_GFI, MapLayer.FWI_KBDI].filter((layer) =>
        activeLayers.has(layer)
      ),
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
            bounds={meteoblueBounds}
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
          rasterBounds={fwiRasterBounds}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_ANGSTROM)}
        />
        <GFIHeatLayer
          points={forestFwiData}
          rasterBounds={fwiRasterBounds}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_GFI)}
        />
        <KBDIHeatLayer
          points={forestFwiData}
          rasterBounds={fwiRasterBounds}
          pane={FWI_OVERLAY_PANE}
          visible={activeLayers.has(MapLayer.FWI_KBDI)}
        />
        {activeLayers.has(MapLayer.BIH_BORDERS) && (
          <GeoJSON data={bihBorderData as any} style={{ color: '#ec4899', weight: 2, fill: false, opacity: 0.6 }} />
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

      {/* --- FULL SCREEN WEATHER DASHBOARD OVERLAY --- */}
      {selectedForest && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 md:pl-[60px]">
           {/* ... Dashboard Header & Content ... */}
           {/* Header - Centralized with Sidebar Padding */}
           <div className="flex-none flex items-center justify-center p-6 border-b border-slate-800 bg-slate-900/50 relative min-h-[120px]">
              
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
           <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-700">
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
                                            {/* Angstrom */}
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-300">{t.dashboard.angstrom}</span>
                                                    <span className={`text-xs font-black uppercase ${risk.aiColor}`}>{risk.aiRisk}</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                     {/* Reverse scale logic visualization */}
                                                    <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500" style={{ width: `${Math.min(100, Math.max(0, (risk.ai / 5) * 100))}%` }}></div> 
                                                </div>
                                                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">{risk.ai.toFixed(2)}</div>
                                            </div>

                                            {/* GFI */}
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-300">{t.dashboard.gfi}</span>
                                                    <span className={`text-xs font-black uppercase ${risk.gfiColor}`}>{risk.gfiRisk}</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-green-500 via-orange-500 to-red-600" style={{ width: `${Math.min(100, (risk.gfi / 20) * 100)}%` }}></div>
                                                </div>
                                                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">{risk.gfi.toFixed(2)}</div>
                                            </div>

                                             {/* KBDI */}
                                             <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-300">{t.dashboard.kbdi}</span>
                                                    <span className={`text-xs font-black uppercase ${risk.kbdiColor}`}>{risk.kbdiRisk}</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-800" style={{ width: `${Math.min(100, (risk.kbdi / 800) * 100)}%` }}></div>
                                                </div>
                                                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">{Math.round(risk.kbdi)}</div>
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

      {/* Floating Operations Header (Aesthetic) */}
      <div ref={statusPanelRef} className="absolute top-4 left-4 md:left-20 z-[2000] pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t.surveillanceNetwork}</span>
            <span className="text-xs font-bold text-white leading-none">{t.status}: {t.nominal} / {t.tracking} {incidents.length} {t.alerts}</span>
          </div>
        </div>
      </div>

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
      />

      {/* Stacked Legends Container (Left) */}
      {showLegend && (
        <div ref={legendPanelRef} className="absolute bottom-24 left-4 md:bottom-8 md:left-[4.5rem] z-[2000] flex flex-col gap-2 animate-in slide-in-from-left-2 duration-300">
          
          {/* New Classification Legend */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl min-w-[160px]">
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

          {/* Existing GIS Legend */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl min-w-[160px]">
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
        </div>
      )}

      {/* GPS FAB */}
      <div ref={gpsFabRef} className="absolute bottom-6 right-6 z-[2000]">
        <button 
          onClick={handleLocateMe}
          title="My Location"
          className="w-12 h-12 bg-white text-slate-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <NavIcon size={20} className="fill-current" />}
        </button>
      </div>

      {/* Incident Reporting Banner */}
      {isReporting && (
        <div ref={reportingBannerRef} className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <NavIcon size={16} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">TAP MAP TO SELECT INCIDENT COORDINATES</span>
          <div className="h-4 w-px bg-white/20 mx-2" />
          <button onClick={onCancelReport} className="text-[10px] font-black hover:text-white/80">CANCEL</button>
        </div>
      )}
    </div>
  );
};
