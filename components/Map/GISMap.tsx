
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, LayerGroup, GeoJSON, WMSTileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Waves, Flame, Globe2, Sun, Moon, Wind, Thermometer, Loader2, Navigation as NavIcon, Settings2, Info, ChevronRight, Check, Settings, Map as MapIcon, Satellite, Mountain, Leaf, X, Trash2, Trees, ShieldCheck, LandPlot, ThermometerSun, Snowflake, CloudRain, Droplets, Zap, Umbrella, Cloud, CloudLightning, Eye, ArrowUp, Calendar, Clock, AlertTriangle, Sunrise, Sunset, Gauge, Navigation, Fan, Layers as LayersIcon, Sprout, SunDim, MoveUp } from 'lucide-react';
import { BIH_CENTER, MOCK_FORESTS, TRANSLATIONS, REGION_STYLES, PROTECTED_AREAS_DATA } from '../../constants';
import { IncidentReport, IncidentType, MapLayer, Language, RegionType, OpenMeteoResponse, ForestRegion } from '../../types';
import { bihBorderData } from '../../bihData';

const GlobalLeaflet = (L as any).default || L;

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

// --- WMO Weather Codes Helper ---
const getWeatherInfo = (code: number) => {
  const codes: Record<number, { label: string; icon: any }> = {
    0: { label: 'Clear Sky', icon: Sun },
    1: { label: 'Mainly Clear', icon: Sun },
    2: { label: 'Partly Cloudy', icon: Cloud },
    3: { label: 'Overcast', icon: Cloud },
    45: { label: 'Fog', icon: Cloud },
    48: { label: 'Depositing Rime Fog', icon: Cloud },
    51: { label: 'Light Drizzle', icon: CloudRain },
    53: { label: 'Moderate Drizzle', icon: CloudRain },
    55: { label: 'Dense Drizzle', icon: CloudRain },
    56: { label: 'Light Freezing Drizzle', icon: Snowflake },
    57: { label: 'Dense Freezing Drizzle', icon: Snowflake },
    61: { label: 'Slight Rain', icon: CloudRain },
    63: { label: 'Moderate Rain', icon: CloudRain },
    65: { label: 'Heavy Rain', icon: CloudRain },
    66: { label: 'Light Freezing Rain', icon: Snowflake },
    67: { label: 'Heavy Freezing Rain', icon: Snowflake },
    71: { label: 'Slight Snow', icon: Snowflake },
    73: { label: 'Moderate Snow', icon: Snowflake },
    75: { label: 'Heavy Snow', icon: Snowflake },
    77: { label: 'Snow Grains', icon: Snowflake },
    80: { label: 'Slight Rain Showers', icon: CloudRain },
    81: { label: 'Moderate Rain Showers', icon: CloudRain },
    82: { label: 'Violent Rain Showers', icon: CloudRain },
    85: { label: 'Slight Snow Showers', icon: Snowflake },
    86: { label: 'Heavy Snow Showers', icon: Snowflake },
    95: { label: 'Thunderstorm', icon: CloudLightning },
    96: { label: 'Thunderstorm with Hail', icon: CloudLightning },
    99: { label: 'Heavy Thunderstorm with Hail', icon: CloudLightning },
  };
  return codes[code] || { label: 'Unknown', icon: Cloud };
};

// --- COMPONENTS ---

interface GISMapProps {
  incidents: IncidentReport[];
  activeLayers: Set<MapLayer>;
  onReportClick: (lat: number, lng: number) => void;
  isReporting: boolean;
  onToggleLayer: (layer: MapLayer) => void;
  onSetBaseLayer: (layer: MapLayer | null) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

export const GISMap: React.FC<GISMapProps> = ({ 
  incidents, activeLayers, onReportClick, isReporting, onToggleLayer, onSetBaseLayer, isDarkMode, onToggleTheme, language, onSetLanguage
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showAssetsPanel, setShowAssetsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSatPanel, setShowSatPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // -- NEW DASHBOARD STATE --
  const [selectedForest, setSelectedForest] = useState<ForestRegion | null>(null);
  const [forestWeather, setForestWeather] = useState<OpenMeteoResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const t = TRANSLATIONS[language];

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

  const togglePanel = (panel: 'layer' | 'settings' | 'sat' | 'assets') => {
    setShowLayerPanel(panel === 'layer' ? !showLayerPanel : false);
    setShowSettingsPanel(panel === 'settings' ? !showSettingsPanel : false);
    setShowSatPanel(panel === 'sat' ? !showSatPanel : false);
    setShowAssetsPanel(panel === 'assets' ? !showAssetsPanel : false);
  };

  const activeBaseLayer = activeLayers.has(MapLayer.SATELLITE) ? { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri' } : null;

  // Helpers
  const fmtTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (isoString: string) => new Date(isoString).toLocaleDateString([], { weekday: 'short', day: 'numeric' });

  // Get current hour index
  const getCurrentHourIndex = (weather: OpenMeteoResponse) => {
    const now = new Date();
    const currentHourStr = now.toISOString().slice(0, 13); // Match YYYY-MM-DDTHH
    return weather.hourly.time.findIndex(t => t.startsWith(currentHourStr));
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
  const calculateFireIndices = (weather: OpenMeteoResponse, hourIdx: number) => {
    const temp = weather.hourly.temperature_2m[hourIdx];
    const humidity = weather.hourly.relative_humidity_2m[hourIdx];
    const windKmh = weather.hourly.wind_speed_10m[hourIdx];
    const rain = weather.daily.precipitation_sum[0]; // Today's rain

    // Angström Index
    // Formula: (H / 20 + (27 - T) / 10) * (10 / (W_ms + 10)) -> Used simpler kmh adaptation often seen
    // High AI = Low Risk. Low AI = High Risk.
    // If AI < 2.5 Risk High.
    const ai = (humidity / 20 + (27 - temp) / 10);
    
    let aiRisk = "Low";
    let aiColor = "text-emerald-500";
    if (ai < 2.0) { aiRisk = "EXTREME"; aiColor = "text-purple-500"; }
    else if (ai < 2.5) { aiRisk = "Very High"; aiColor = "text-red-600"; }
    else if (ai < 3.0) { aiRisk = "High"; aiColor = "text-orange-500"; }
    else if (ai < 4.0) { aiRisk = "Moderate"; aiColor = "text-yellow-500"; }

    // GFI (Forest Fire Weather Index - Simplified)
    const dryDays = weather.daily.precipitation_sum.filter(p => p < 1.0).length; // Past 7 days (actually forecasts here, but works for demo)
    const zoneFactor = 1.2;
    const gfi = (Math.max(0, temp) * (100 - humidity) * windKmh / 1000) * (1 + dryDays / 20) * zoneFactor;
    
    let gfiRisk = "Low";
    let gfiColor = "text-emerald-500";
    if (gfi > 15) { gfiRisk = "EXTREME"; gfiColor = "text-purple-500"; }
    else if (gfi > 9) { gfiRisk = "Very High"; gfiColor = "text-red-600"; }
    else if (gfi > 5) { gfiRisk = "High"; gfiColor = "text-orange-500"; }
    else if (gfi > 2) { gfiRisk = "Moderate"; gfiColor = "text-yellow-500"; }

    // KBDI (Approximation without historic DB)
    // Daily drought factor based on max temp and lack of rain
    let kbdi = (Math.max(0, temp) * 10) - (rain * 50); 
    if (kbdi < 0) kbdi = 0;
    // Normalize to 0-800 scale roughly
    kbdi = Math.min(800, kbdi + (dryDays * 50)); 
    
    let kbdiRisk = "Low";
    let kbdiColor = "text-emerald-500";
    if (kbdi > 600) { kbdiRisk = "EXTREME"; kbdiColor = "text-purple-500"; }
    else if (kbdi > 400) { kbdiRisk = "High"; kbdiColor = "text-red-600"; }
    else if (kbdi > 200) { kbdiRisk = "Moderate"; kbdiColor = "text-orange-500"; }

    return { ai, aiRisk, aiColor, gfi, gfiRisk, gfiColor, kbdi, kbdiRisk, kbdiColor };
  };

  return (
    <div className="w-full h-full relative">
      
      {/* MAP CONTAINER */}
      <MapContainer center={BIH_CENTER} zoom={8} className="w-full h-full" ref={setMap} zoomControl={false}>
        <TileLayer
            key={isDarkMode ? 'dark' : 'light'}
            url={activeBaseLayer ? activeBaseLayer.url : (isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png")}
        />
        {activeLayers.has(MapLayer.BIH_BORDERS) && (
          <GeoJSON data={bihBorderData as any} style={{ color: '#ec4899', weight: 2, fill: false, opacity: 0.6 }} />
        )}
        
        {/* FOREST MARKERS - Click triggers Full Screen Overlay */}
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
                   click: () => setSelectedForest(forest)
                 }}
               />
             );
          })}
        </LayerGroup>

        {userPos && <Marker position={userPos} icon={UserIcon} />}
      </MapContainer>

      {/* --- FULL SCREEN WEATHER DASHBOARD OVERLAY --- */}
      {selectedForest && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 md:pl-[60px]">
           
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
                        <span className="font-mono">{selectedForest.coordinates[0].toFixed(3)}, {selectedForest.coordinates[1].toFixed(3)}</span>
                      </span>
                      <div className="hidden md:block w-px h-3 bg-slate-800"></div>
                      <span className="flex items-center gap-2 text-emerald-400">
                        <LandPlot size={14} className="opacity-70"/> 
                        <span>{selectedForest.area.toLocaleString()} ha</span>
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
                      <p className="font-mono text-sm tracking-widest uppercase">Acquiring Open-Meteo Telemetry...</p>
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
                                            <div className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Current Conditions</div>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-8xl font-black text-white tracking-tighter">{Math.round(forestWeather.current.temperature_2m)}°</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-medium text-white capitalize">{getWeatherInfo(forestWeather.current.weather_code).label}</span>
                                                    <span className="text-slate-400">Feels like {Math.round(forestWeather.current.apparent_temperature)}°</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Wind', val: `${forestWeather.current.wind_speed_10m} km/h`, sub: `${forestWeather.current.wind_direction_10m}°`, icon: Wind, color: 'text-cyan-400' },
                                            { label: 'Humidity', val: `${forestWeather.current.relative_humidity_2m}%`, sub: 'Relative', icon: Droplets, color: 'text-blue-400' },
                                            { label: 'Pressure', val: `${Math.round(forestWeather.current.pressure_msl)} hPa`, sub: 'MSL', icon: Gauge, color: 'text-emerald-400' },
                                            { label: 'Precipitation', val: `${forestWeather.current.precipitation} mm`, sub: 'Current', icon: Umbrella, color: 'text-blue-300' },
                                            { label: 'UV Index', val: `${forestWeather.hourly.uv_index[getCurrentHourIndex(forestWeather)]}`, sub: 'Scale', icon: SunDim, color: 'text-yellow-400' },
                                            { label: 'Wind Gusts', val: `${forestWeather.current.wind_gusts_10m} km/h`, sub: 'Max', icon: Wind, color: 'text-orange-400' },
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

                             {/* RAIN PROBABILITY GRAPH (Next 12 Hours) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                    <Umbrella size={14} /> Precip. Prob (12h)
                                </h3>
                                <div className="flex-1 flex items-end gap-1 min-h-[150px]">
                                    {(() => {
                                    const startIdx = getCurrentHourIndex(forestWeather);
                                    // Show next 12 hours or fallback
                                    const hoursToShow = startIdx !== -1 ? forestWeather.hourly.precipitation_probability.slice(startIdx, startIdx + 12) : [];
                                    
                                    if (hoursToShow.length === 0) return <div className="text-slate-500 text-xs w-full text-center">No hourly data</div>;

                                    return hoursToShow.map((prob, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-blue-500/50 rounded-t-sm hover:bg-blue-400 transition-colors relative group"
                                            style={{ 
                                                height: `${prob}%`, 
                                                minHeight: prob > 0 ? '4px' : '2px',
                                                opacity: prob > 0 ? 1 : 0.1 
                                            }}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-white text-slate-900 text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                                +{i}h: {prob}%
                                            </div>
                                        </div>
                                    ));
                                    })()}
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-2 pt-2 border-t border-slate-800">
                                    <span>Now</span>
                                    <span>+6h</span>
                                    <span>+12h</span>
                                </div>
                            </div>

                             {/* DAILY FORECAST GRID */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <Calendar size={14} /> 7-Day Forecast
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {forestWeather.daily.time.slice(0,5).map((timeStr, i) => {
                                        const code = forestWeather.daily.weather_code[i];
                                        const max = forestWeather.daily.temperature_2m_max[i];
                                        const min = forestWeather.daily.temperature_2m_min[i];
                                        const prob = forestWeather.daily.precipitation_probability_max[i];
                                        const wInfo = getWeatherInfo(code);

                                        return (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <wInfo.icon size={24} className="text-blue-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{i === 0 ? 'Today' : fmtDay(timeStr)}</span>
                                                        <span className="text-[10px] text-slate-500">{wInfo.label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                     {(prob > 0) && (
                                                        <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-900/20 px-2 py-0.5 rounded">
                                                            <CloudRain size={10} /> {prob}%
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2 w-24 justify-end">
                                                        <span className="text-white font-bold">{Math.round(max)}°</span>
                                                        <span className="text-slate-600 text-xs">/ {Math.round(min)}°</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                            <Flame size={14} className="text-red-500" /> Fire Risk Analysis (Live)
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Angstrom */}
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-300">Angström Index</span>
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
                                                    <span className="text-xs font-bold text-slate-300">GFI (Forest Fire)</span>
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
                                                    <span className="text-xs font-bold text-slate-300">KBDI (Drought)</span>
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
                                    <LayersIcon size={14} className="text-blue-400" /> Advanced Atmosphere
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                     {[
                                        { l: 'Sea Level Press.', v: `${Math.round(forestWeather.hourly.pressure_msl[getCurrentHourIndex(forestWeather)])} hPa`, i: Gauge },
                                        { l: 'Surface Press.', v: `${Math.round(forestWeather.hourly.surface_pressure[getCurrentHourIndex(forestWeather)])} hPa`, i: ArrowUp },
                                        { l: 'Visibility', v: `${(forestWeather.hourly.visibility[getCurrentHourIndex(forestWeather)] / 1000).toFixed(1)} km`, i: Eye },
                                        { l: 'Evapotranspiration', v: `${forestWeather.hourly.evapotranspiration[getCurrentHourIndex(forestWeather)]} mm`, i: Droplets },
                                        { l: 'ET₀ (Reference)', v: `${forestWeather.hourly.et0_fao_evapotranspiration[getCurrentHourIndex(forestWeather)]} mm`, i: Sprout },
                                        { l: 'Vapour Press. Def.', v: `${forestWeather.hourly.vapour_pressure_deficit[getCurrentHourIndex(forestWeather)]} kPa`, i: Cloud },
                                        { l: 'Total Cloud Cover', v: `${forestWeather.hourly.cloud_cover[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: 'Low Clouds', v: `${forestWeather.hourly.cloud_cover_low[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: 'Mid Clouds', v: `${forestWeather.hourly.cloud_cover_mid[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
                                        { l: 'High Clouds', v: `${forestWeather.hourly.cloud_cover_high[getCurrentHourIndex(forestWeather)]}%`, i: Cloud },
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
                                        <Wind size={14} className="text-cyan-400" /> Vertical Wind
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
                                        <LayersIcon size={14} className="text-amber-600" /> Soil Profile
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
      <div className="absolute top-4 left-4 md:left-20 z-[2000] pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t.surveillanceNetwork}</span>
            <span className="text-xs font-bold text-white leading-none">{t.status}: {t.nominal} / {t.tracking} {incidents.length} {t.alerts}</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL Control Cluster (Right Side) */}
      <div className="absolute top-4 right-4 z-[2000] flex flex-col items-end gap-2">
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1 flex items-center gap-1">
          {/* Theme */}
          <button onClick={onToggleTheme} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 bg-amber-400/5 hover:bg-amber-400/10' : 'text-slate-400 hover:bg-slate-800'}`} title={t.theme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* New State Borders Toggle - MOVED HERE */}
          <button 
            onClick={() => onToggleLayer(MapLayer.BIH_BORDERS)} 
            className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.BIH_BORDERS) ? 'text-pink-500 bg-pink-950/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Toggle State Borders"
          >
            <LandPlot size={18} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Wind Toggle */}
          <button 
            onClick={() => onToggleLayer(MapLayer.WINDY)} 
            className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.WINDY) ? 'text-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.liveWindVector}
          >
            <Wind size={18} className={activeLayers.has(MapLayer.WINDY) ? 'animate-pulse' : ''} />
          </button>

          {/* Heat Index Toggle */}
          <button 
            onClick={() => onToggleLayer(MapLayer.WEATHER_TEMP)} 
            className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.WEATHER_TEMP) ? 'text-orange-500 bg-orange-950/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.heatIndex}
          >
            <Thermometer size={18} className={activeLayers.has(MapLayer.WEATHER_TEMP) ? 'animate-pulse' : ''} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Assets & Regions Toggle */}
          <button 
            onClick={() => togglePanel('assets')} 
            className={`p-2.5 rounded-lg transition-colors ${showAssetsPanel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.assetsRegions}
          >
            <Trees size={18} />
          </button>

          {/* Layer Panel Toggle (Data Overlays) */}
          <button 
            onClick={() => togglePanel('layer')} 
            className={`p-2.5 rounded-lg transition-colors ${showLayerPanel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.dataOverlays}
          >
            <Settings2 size={18} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Settings / Language Toggle */}
          <button 
            onClick={() => togglePanel('settings')} 
            className={`p-2.5 rounded-lg transition-colors ${showSettingsPanel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.systemConfig}
          >
            <Settings size={18} />
          </button>
          
          {/* Legend Toggle */}
          <button 
            onClick={() => setShowLegend(!showLegend)} 
            className={`p-2.5 rounded-lg transition-colors ${showLegend ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.gisLegend}
          >
            <Info size={18} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Satellite Chooser */}
          <button 
            onClick={() => togglePanel('sat')} 
            className={`p-2.5 rounded-lg transition-colors ${showSatPanel || (activeLayers.has(MapLayer.SATELLITE)) ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title={t.imagerySource}
          >
            <Globe2 size={18} />
          </button>
        </div>

        {/* Dropdown Panels Container */}
        <div className="relative w-64">
          
          {/* Floating Satellite Panel */}
          {showSatPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-full animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                {t.imagerySource}
                <button onClick={() => setShowSatPanel(false)} className="hover:text-white"><X size={14} /></button>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { onSetBaseLayer(null); setShowSatPanel(false); }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    !activeLayers.has(MapLayer.SATELLITE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                  }`}
                >
                  <MapIcon size={20} className={!activeLayers.has(MapLayer.SATELLITE) ? 'text-blue-500' : 'text-slate-500'} />
                  <span className="text-[10px] font-bold text-white uppercase">{t.vector}</span>
                </button>
                <button 
                    onClick={() => { onSetBaseLayer(MapLayer.SATELLITE); setShowSatPanel(false); }}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      activeLayers.has(MapLayer.SATELLITE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                    }`}
                  >
                    <Satellite size={20} className={activeLayers.has(MapLayer.SATELLITE) ? 'text-blue-500' : 'text-slate-500'} />
                    <span className="text-[10px] font-bold text-white uppercase text-center leading-tight">Satellite</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Settings Panel */}
          {showSettingsPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-full animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                {t.systemConfig}
                <button onClick={() => setShowSettingsPanel(false)} className="hover:text-white"><X size={14} /></button>
              </h4>
              
              <div className="space-y-4">
                <section>
                  <div className="text-[9px] font-bold text-slate-600 uppercase mb-2 tracking-tighter">{t.activeLanguage}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.values(Language).map((lang) => (
                      <button 
                        key={lang}
                        onClick={() => onSetLanguage(lang)}
                        className={`py-1.5 rounded-md text-[10px] font-black transition-all border ${
                          language === lang 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Floating Assets & Regions Panel */}
          {showAssetsPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10 py-1">
                {t.assetsRegions}
                <button onClick={() => setShowAssetsPanel(false)} className="hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </h4>
              <div className="space-y-1">
                {[
                  { id: MapLayer.FORESTS, label: t.forestInventory, icon: Trees, color: 'text-emerald-500' },
                  { id: MapLayer.LANDFILLS, label: t.activeLandfills, icon: Trash2, color: 'text-red-500' },
                  { id: MapLayer.PROTECTED_AREAS, label: t.protectedAreas, icon: ShieldCheck, color: 'text-yellow-400' },
                ].map(layer => (
                  <button 
                    key={layer.id}
                    onClick={() => onToggleLayer(layer.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                      activeLayers.has(layer.id) 
                        ? 'bg-blue-600/10 border-blue-600/50' 
                        : 'bg-slate-900/50 border-transparent hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <layer.icon size={16} className={activeLayers.has(layer.id) ? layer.color : 'text-slate-600'} />
                      <span className={`text-[11px] font-bold ${activeLayers.has(layer.id) ? 'text-white' : 'text-slate-500'}`}>{layer.label}</span>
                    </div>
                    {activeLayers.has(layer.id) && <Check size={12} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer Quick Panel (Data Overlays - Hazards Only) */}
          {showLayerPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10 py-1">
                {t.dataOverlays}
                <button onClick={() => setShowLayerPanel(false)} className="hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </h4>
              
              <div className="space-y-4">
                {/* Hazards Section */}
                <div>
                  <div className="space-y-1">
                    {[
                       { id: MapLayer.FIRE_RISK, label: t.fireThreats, icon: Flame, color: 'text-red-500' },
                       { id: MapLayer.FLOOD_RISK, label: t.hydrological, icon: Waves, color: 'text-blue-500' },
                    ].map(layer => (
                      <button 
                        key={layer.id}
                        onClick={() => onToggleLayer(layer.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                          activeLayers.has(layer.id) 
                            ? 'bg-blue-600/10 border-blue-600/50' 
                            : 'bg-slate-900/50 border-transparent hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <layer.icon size={16} className={activeLayers.has(layer.id) ? layer.color : 'text-slate-600'} />
                          <span className={`text-[11px] font-bold ${activeLayers.has(layer.id) ? 'text-white' : 'text-slate-500'}`}>{layer.label}</span>
                        </div>
                        {activeLayers.has(layer.id) && <Check size={12} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stacked Legends Container (Left) */}
      {showLegend && (
        <div className="absolute bottom-24 left-4 md:bottom-8 md:left-[4.5rem] z-[2000] flex flex-col gap-2 animate-in slide-in-from-left-2 duration-300">
          
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
      <div className="absolute bottom-6 right-6 z-[2000]">
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <NavIcon size={16} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">TAP MAP TO SELECT INCIDENT COORDINATES</span>
          <div className="h-4 w-px bg-white/20 mx-2" />
          <button onClick={() => onReportClick(0,0)} className="text-[10px] font-black hover:text-white/80">CANCEL</button>
        </div>
      )}
    </div>
  );
};
