import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, GeoJSON, WMSTileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Waves, Flame, Globe2, Sun, Moon, Wind, Thermometer, Loader2, Navigation as NavIcon, Settings2, Info, ChevronRight, Check, Languages, Settings, Map as MapIcon, Image as ImageIcon, Satellite, Mountain, Leaf, X, Trash2, Trees, TreePine, Sprout, Tent, ShieldCheck, Factory } from 'lucide-react';
import { BIH_CENTER, MOCK_FORESTS, BIH_GEOJSON, TRANSLATIONS, REGION_STYLES, PROTECTED_AREAS_DATA } from '../../constants';
import { IncidentReport, IncidentType, MapLayer, Language, RegionType } from '../../types';

// Shared SVG paths for Map Markers and Legend
const ICON_PATHS: Record<string, string> = {
  tree: `<path d="M12 19v3"/><path d="M12 19h-3a9 9 0 0 1 0-18h6a9 9 0 0 1 0 18h-3"/>`,
  pine: `<path d="m8 14 4-9 4 9"/><path d="m10 14-3 9"/><path d="m14 14 3 9"/>`,
  mixed: `<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .9-1.7l-2.6-5a1 1 0 0 0-1.8 0l-2.6 5a1 1 0 0 0 .9 1.7h.2l-1.4 2.5"/>`,
  shrub: `<path d="M12 22v-9"/><path d="M6.06 14a4 4 0 0 1 7.15-2.73"/><path d="M12.8 11.27a4 4 0 0 1 5.14 8.73"/><path d="M18.66 16.32a4 4 0 0 1-1.37 5.68"/><path d="M4.69 13.9a4 4 0 0 0-.25 7.84"/>`,
  sprout: `<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .5-3.5 1.3-3.5 1.3s-.9-2.4 0-4.6c.9-2.1 2.2-2 2.2-2"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>`
};

// Helper to generate dynamic icons
const getRegionIcon = (type: RegionType) => {
  const style = REGION_STYLES[type];
  const color = style.color;
  const path = ICON_PATHS[style.iconType] || ICON_PATHS.tree;
  
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 bg-slate-950 rounded-full border-2 border-[${color}] shadow-2xl hover:scale-110 transition-transform" style="border-color: ${color}">
        ${iconSvg}
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const getProtectedAreaIcon = (intensity: number) => {
  const color = intensity > 0.8 ? '#ef4444' : '#eab308'; // Red for high, Yellow for medium
  const path = ICON_PATHS.shield;
  
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-9 h-9 bg-slate-900/90 rounded-full border-2 border-[${color}] shadow-[0_0_15px_${color}40] hover:scale-110 transition-transform backdrop-blur-sm" style="border-color: ${color}">
        ${iconSvg}
      </div>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const UserIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div>
      <div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-xl"></div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Component to handle the heatmap using HeatmapOverlay from leaflet-heatmap.js
const HeatmapLayer = ({ active }: { active: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    
    // Check if the HeatmapOverlay (from leaflet-heatmap.js) is available on window
    const HeatmapOverlay = (window as any).HeatmapOverlay;

    if (!HeatmapOverlay) {
      console.warn('HeatmapOverlay not loaded. Check script tags in index.html.');
      return;
    }

    // Config options for heatmap.js
    const cfg = {
      "radius": 20, // Reduced radius for finer blobs in point cloud
      "maxOpacity": 0.55,
      "scaleRadius": false, // False: radius is in pixels. True: radius is in degrees (very tricky to get right with leaflet-heatmap)
      "useLocalExtrema": true,
      latField: 'lat',
      lngField: 'lng',
      valueField: 'val',
      blur: 0.75,
      gradient: {
        0.1: '#1a53ff',  // Blue
        0.3: '#00cc66',  // Green
        0.6: '#e6e600',  // Yellow
        0.9: '#ff0000'   // Red
      }
    };
    
    // Create layer
    const layer = new HeatmapOverlay(cfg);

    // Generate Point Cloud based on Area
    // This creates an "organic" blob by scattering points around the center based on area size
    const generatedPoints: Array<{lat: number, lng: number, val: number}> = [];

    PROTECTED_AREAS_DATA.forEach(area => {
      // Scale: 100 points per 100km^2 roughly, min 25 points
      const pointCount = Math.max(30, Math.ceil(area.areaSqKm / 1.5));
      
      // Radius approximation: sqrt(Area/PI) gives radius in KM.
      // 1 degree lat ~ 111km.
      const radiusKm = Math.sqrt(area.areaSqKm / Math.PI);
      const radiusDeg = radiusKm / 111;

      // Add strong center
      generatedPoints.push({ lat: area.lat, lng: area.lng, val: area.intensity });

      for (let i = 0; i < pointCount; i++) {
        // Random polar coordinates
        const theta = Math.random() * 2 * Math.PI;
        
        // Use square root of random to spread points evenly in the circle area
        // Multiply by gaussian-like random to concentrate slightly more in center but allow edges
        const r = radiusDeg * Math.sqrt(Math.random());
        
        // Introduce irregularity (stretch one axis randomly)
        // Use a deterministic pseudo-random stretching based on index to keep shape consistent-ish or just random
        const stretchLat = 1.0; 
        const stretchLng = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 stretch on longitude

        const dLat = r * Math.cos(theta) * stretchLat;
        const dLng = r * Math.sin(theta) * stretchLng;

        generatedPoints.push({
          lat: area.lat + dLat,
          lng: area.lng + dLng,
          // Fade intensity slightly towards edges for smoother look
          val: area.intensity * (0.6 + Math.random() * 0.4)
        });
      }
    });

    // Transform structured data to heatmap format
    const heatmapData = {
      max: 1.0,
      data: generatedPoints
    };
    
    layer.setData(heatmapData);
    map.addLayer(layer);

    return () => {
      map.removeLayer(layer);
    };
  }, [active, map]);

  return null;
};

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
  incidents, 
  activeLayers, 
  onReportClick, 
  isReporting, 
  onToggleLayer,
  onSetBaseLayer,
  isDarkMode, 
  onToggleTheme,
  language,
  onSetLanguage
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSatPanel, setShowSatPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [meteoblueUrl, setMeteoblueUrl] = useState<string>('');

  const t = TRANSLATIONS[language];

  // Fetch Meteoblue URL
  useEffect(() => {
    const fetchMeteoblue = async () => {
      try {
        const apiKey = "be72f76237db";
        const timeResponse = await fetch(`https://maps-api.meteoblue.com/v1/time/hourly/ICONAUTO?lang=en&apikey=${apiKey}`);
        const timeInfo = await timeResponse.json();
        const date = timeInfo.current;
        
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
          `&lastUpdate=${timeInfo.lastUpdate}`;
          
        setMeteoblueUrl(url);
      } catch (e) {
        console.error("Failed to fetch meteoblue", e);
      }
    };
    fetchMeteoblue();
  }, []);

  const imagerySources = useMemo(() => [
    { id: MapLayer.SATELLITE, label: 'ArcGIS Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', icon: Satellite },
    { id: MapLayer.SATELLITE_CLARITY, label: 'Esri Clarity', url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', icon: Satellite },
    { id: MapLayer.SATELLITE_GOOGLE, label: 'Google Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', icon: Globe2 },
    { id: MapLayer.WINDY, label: 'Windy.com (Dark GIS)', url: 'https://tiles.windy.com/tiles/v1.0.0/darkmap/{z}/{x}/{y}.png', icon: Wind },
    { id: MapLayer.SENTINEL, label: 'Sentinel-2', url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2019_3857/default/g/{z}/{y}/{x}.jpg', icon: Layers },
    { id: MapLayer.INFRARED, label: 'Infrared (Veg)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', icon: Leaf },
    { id: MapLayer.METEOBLUE, label: 'Meteoblue Temp', url: meteoblueUrl, icon: Thermometer },
    { id: MapLayer.NASA_FIRMS, label: 'NASA VIIRS', url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', icon: Flame },
    { id: MapLayer.THERMAL, label: 'Thermal LST', url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Land_Surface_Temp_Day/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png', icon: Thermometer },
    { id: MapLayer.TERRAIN, label: 'OpenTopoMap', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', icon: Mountain },
  ], [meteoblueUrl]);

  useEffect(() => {
    if (map) {
      const clickHandler = (e: L.LeafletMouseEvent) => {
        if (isReporting) onReportClick(e.latlng.lat, e.latlng.lng);
      };
      map.on('click', clickHandler);
      return () => map.off('click', clickHandler);
    }
  }, [map, isReporting, onReportClick]);

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

  const activeBaseLayer = imagerySources.find(src => activeLayers.has(src.id)) || null;

  // Handle panel exclusivity
  const togglePanel = (panel: 'layer' | 'settings' | 'sat') => {
    if (panel === 'layer') {
      setShowLayerPanel(!showLayerPanel);
      setShowSettingsPanel(false);
      setShowSatPanel(false);
    } else if (panel === 'settings') {
      setShowSettingsPanel(!showSettingsPanel);
      setShowLayerPanel(false);
      setShowSatPanel(false);
    } else if (panel === 'sat') {
      setShowSatPanel(!showSatPanel);
      setShowSettingsPanel(false);
      setShowLayerPanel(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer center={BIH_CENTER} zoom={8} className="w-full h-full" ref={setMap} zoomControl={false}>
        {/* Base Layer Logic */}
        {!activeBaseLayer ? (
          <TileLayer
            key={isDarkMode ? 'dark' : 'light'}
            url={isDarkMode 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          />
        ) : (
          <TileLayer 
            key={activeBaseLayer.id} 
            url={activeBaseLayer.url} 
            attribution={activeBaseLayer.label} 
            className={(activeBaseLayer.id === MapLayer.INFRARED) ? 'hue-rotate-180 invert' : ''} 
            opacity={activeBaseLayer.id === MapLayer.METEOBLUE ? 0.7 : 1}
          />
        )}
        
        {/* Standard Overlays */}
        {activeLayers.has(MapLayer.WEATHER_TEMP) && <WMSTileLayer url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=d22f66d48348243ed47c132845c48b2a" opacity={0.4} />}
        {activeLayers.has(MapLayer.WIND_SPEED) && <WMSTileLayer url="https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=d22f66d48348243ed47c132845c48b2a" opacity={0.4} />}
        {activeLayers.has(MapLayer.COUNTRY_BORDERS) && <GeoJSON data={BIH_GEOJSON} style={{ color: '#1a73e8', weight: 1.5, fillOpacity: 0.05 }} />}
        
        {/* Protected Areas Heatmap (Using heatmap.js) */}
        <HeatmapLayer active={activeLayers.has(MapLayer.PROTECTED_AREAS)} />

        {/* Protected Areas Markers & Popups */}
        {activeLayers.has(MapLayer.PROTECTED_AREAS) && (
          <LayerGroup>
            {PROTECTED_AREAS_DATA.map((area, idx) => (
              <Marker key={`protected-${idx}`} position={[area.lat, area.lng]} icon={getProtectedAreaIcon(area.intensity)}>
                <Popup className="google-style-popup">
                  <div className="p-4 w-72 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700">
                    <header className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-sm text-yellow-400 leading-tight">{area.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <ShieldCheck size={12} className="text-yellow-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {area.type}
                          </span>
                        </div>
                      </div>
                    </header>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                          <span>Protection Level</span>
                          <span className={area.intensity > 0.8 ? 'text-red-500' : 'text-yellow-500'}>
                            {area.intensity > 0.9 ? 'STRICT NATURE RESERVE' : 'MANAGED RESOURCE'}
                          </span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${area.intensity > 0.8 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${area.intensity * 100}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">{t.popup.dataSync}</div>
                          <div className="text-xs font-black text-emerald-500 flex items-center gap-1">GOV.BA REGISTRY <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /></div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">{t.popup.surfaceArea}</div>
                          <div className="text-xs font-black text-white">{area.areaSqKm} km²</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )}

        {userPos && <Marker position={userPos} icon={UserIcon} />}

        <LayerGroup>
          {MOCK_FORESTS.map(forest => {
            const isLandfill = forest.type === RegionType.LANDFILL;
            
            // Filtering Logic
            if (isLandfill && !activeLayers.has(MapLayer.LANDFILLS)) return null;
            if (!isLandfill && !activeLayers.has(MapLayer.FORESTS)) return null;

            const style = REGION_STYLES[forest.type];
            const iconPath = ICON_PATHS[style.iconType] || ICON_PATHS.tree;

            return (
              <Marker key={forest.id} position={forest.coordinates} icon={getRegionIcon(forest.type)}>
                <Popup className="google-style-popup">
                  <div className="p-4 w-72 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700">
                    <header className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-sm text-blue-400 leading-tight">{t.forests[forest.name as keyof typeof t.forests] || forest.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg"
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke={style.color} 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            dangerouslySetInnerHTML={{ __html: iconPath }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.color }}>
                            {t.regionTypes[forest.type] || forest.type}
                          </span>
                        </div>
                      </div>
                    </header>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                          <span>{t.popup.threatIndex}</span>
                          <span className={forest.riskScore > 0.6 ? 'text-red-500' : 'text-blue-500'}>
                            {(forest.riskScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${forest.riskScore > 0.6 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${forest.riskScore * 100}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">{t.popup.surfaceArea}</div>
                          <div className="text-xs font-black text-white">{forest.area.toLocaleString()} ha</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">{t.popup.dataSync}</div>
                          <div className="text-xs font-black text-emerald-500 flex items-center gap-1">{t.popup.live} <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>

        <LayerGroup>
          {incidents.filter(inc => (inc.type === IncidentType.FIRE && activeLayers.has(MapLayer.FIRE_RISK)) || (inc.type === IncidentType.FLOOD && activeLayers.has(MapLayer.FLOOD_RISK))).map(incident => (
            <Circle key={incident.id} center={[incident.lat, incident.lng]} radius={2000} pathOptions={{ 
              color: incident.type === IncidentType.FIRE ? '#ea4335' : '#1a73e8', 
              fillColor: incident.type === IncidentType.FIRE ? '#ea4335' : '#1a73e8',
              fillOpacity: 0.35,
              weight: 2
            }}>
              <Popup>
                <div className="p-2">
                  <div className={`text-[10px] font-black px-2 py-1 rounded mb-2 inline-flex items-center gap-1 ${incident.type === IncidentType.FIRE ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
                    {incident.type === IncidentType.FIRE ? <Flame size={12} /> : <Waves size={12} />}
                    {incident.type === IncidentType.FIRE ? 'FIRE EMERGENCY' : 'FLOOD EMERGENCY'}
                  </div>
                  <p className="text-xs font-medium text-slate-200 mb-2 leading-relaxed">"{incident.description}"</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase border-t border-slate-800 pt-2">
                    <span>Priority: {incident.urgency}</span>
                    <span>WIND: {incident.windSpeed} km/h</span>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}
        </LayerGroup>
      </MapContainer>

      {/* Floating Operations Header (Aesthetic) */}
      <div className="absolute top-4 left-4 md:left-20 z-[2000] pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Surveillance Network</span>
            <span className="text-xs font-bold text-white leading-none">Status: Nominal / Tracking {incidents.length} Alerts</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL Control Cluster (Right Side) */}
      <div className="absolute top-4 right-4 z-[2000] flex flex-col items-end gap-2">
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1 flex items-center gap-1">
          {/* Theme */}
          <button onClick={onToggleTheme} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 bg-amber-400/5 hover:bg-amber-400/10' : 'text-slate-400 hover:bg-slate-800'}`} title="Toggle Theme">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Settings / Language Toggle */}
          <button 
            onClick={() => togglePanel('settings')} 
            className={`p-2.5 rounded-lg transition-colors ${showSettingsPanel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Global Settings"
          >
            <Settings size={18} />
          </button>

          {/* Layer Panel Toggle */}
          <button 
            onClick={() => togglePanel('layer')} 
            className={`p-2.5 rounded-lg transition-colors ${showLayerPanel ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Layer Settings"
          >
            <Settings2 size={18} />
          </button>
          
          {/* Legend Toggle */}
          <button 
            onClick={() => setShowLegend(!showLegend)} 
            className={`p-2.5 rounded-lg transition-colors ${showLegend ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Toggle Legend"
          >
            <Info size={18} />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Satellite Chooser */}
          <button 
            onClick={() => togglePanel('sat')} 
            className={`p-2.5 rounded-lg transition-colors ${showSatPanel || activeBaseLayer ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Imagery Source"
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
                Imagery Source
                <button onClick={() => setShowSatPanel(false)} className="hover:text-white"><X size={14} /></button>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { onSetBaseLayer(null); setShowSatPanel(false); }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    !activeBaseLayer ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                  }`}
                >
                  <MapIcon size={20} className={!activeBaseLayer ? 'text-blue-500' : 'text-slate-500'} />
                  <span className="text-[10px] font-bold text-white uppercase">Vector</span>
                </button>
                {imagerySources.map(layer => (
                  <button 
                    key={layer.id}
                    onClick={() => { onSetBaseLayer(layer.id); setShowSatPanel(false); }}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      activeLayers.has(layer.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                    }`}
                  >
                    <layer.icon size={20} className={activeLayers.has(layer.id) ? 'text-blue-500' : 'text-slate-500'} />
                    <span className="text-[10px] font-bold text-white uppercase text-center leading-tight">{layer.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Floating Settings Panel */}
          {showSettingsPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-full animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                System Configuration
                <button onClick={() => setShowSettingsPanel(false)} className="hover:text-white"><X size={14} /></button>
              </h4>
              
              <div className="space-y-4">
                <section>
                  <div className="text-[9px] font-bold text-slate-600 uppercase mb-2 tracking-tighter">Active Language</div>
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

          {/* Layer Quick Panel */}
          {showLayerPanel && (
            <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-full animate-in slide-in-from-top-2 duration-200">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                Data Overlays
                <button onClick={() => setShowLayerPanel(false)} className="hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </h4>
              <div className="space-y-2">
                {[
                  { id: MapLayer.FORESTS, label: 'Forest Inventory', icon: Trees, color: 'text-emerald-500' },
                  { id: MapLayer.LANDFILLS, label: 'Active Landfills', icon: Trash2, color: 'text-red-500' },
                  { id: MapLayer.PROTECTED_AREAS, label: 'Protected Areas', icon: ShieldCheck, color: 'text-yellow-400' },
                  { id: MapLayer.FIRE_RISK, label: 'Fire Threats', icon: Flame, color: 'text-red-500' },
                  { id: MapLayer.FLOOD_RISK, label: 'Hydrological', icon: Waves, color: 'text-blue-500' },
                  { id: MapLayer.WEATHER_TEMP, label: 'Heat Index', icon: Thermometer, color: 'text-orange-500' },
                  { id: MapLayer.WIND_SPEED, label: 'Wind Patterns', icon: Wind, color: 'text-cyan-500' },
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
                <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" /> Active Fire
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" /> Active Flood
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full border border-blue-500" /> Sensor Station
              </div>
              <div className="pt-1 mt-1 border-t border-slate-800/50">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Live Data Stream
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