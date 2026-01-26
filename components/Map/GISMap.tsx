
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, GeoJSON, WMSTileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Layers, Waves, Flame, ChevronDown, ChevronUp, Eye, Navigation as NavIcon, Globe2, Sun, Moon, Wind, Thermometer, Loader2, Check } from 'lucide-react';
import { BIH_CENTER, MOCK_FORESTS, BIH_GEOJSON, TRANSLATIONS } from '../../constants';
import { IncidentReport, IncidentType, MapLayer, Language } from '../../types';

const ForestIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center w-9 h-9 bg-emerald-600 rounded-full border-2 border-white shadow-2xl text-white transform hover:scale-110 transition-transform cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v5"/><path d="M12 19v3"/><path d="M12 7l-4 4h8l-4-4Z" fill="currentColor"/>
        <path d="m12 7-6 6h12l-6-6Z" fill="currentColor" fill-opacity="0.6"/>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const UserIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-40"></div>
      <div class="absolute w-6 h-6 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface GISMapProps {
  incidents: IncidentReport[];
  activeLayers: Set<MapLayer>;
  onReportClick: (lat: number, lng: number) => void;
  isReporting: boolean;
  onToggleLayer: (layer: MapLayer) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  language: Language;
}

const SAT_LAYERS = [
  { id: MapLayer.SATELLITE, label: 'Esri World Imagery', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: MapLayer.SATELLITE_CLARITY, label: 'Esri Clarity', url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: MapLayer.SATELLITE_GOOGLE, label: 'Google Maps Sat', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  { id: MapLayer.SENTINEL, label: 'Sentinel-2 Cloudless', url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg' },
];

export const GISMap: React.FC<GISMapProps> = ({ 
  incidents, 
  activeLayers, 
  onReportClick, 
  isReporting, 
  onToggleLayer, 
  isDarkMode, 
  onToggleTheme,
  language 
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [isSatMenuOpen, setIsSatMenuOpen] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (map) {
      const clickHandler = (e: L.LeafletMouseEvent) => {
        if (isReporting) {
          onReportClick(e.latlng.lat, e.latlng.lng);
        }
      };
      map.on('click', clickHandler);
      return () => {
        map.off('click', clickHandler);
      };
    }
  }, [map, isReporting, onReportClick]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPos([latitude, longitude]);
        map?.flyTo([latitude, longitude], 15, { animate: true });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Location error";
        if (error.code === error.PERMISSION_DENIED) msg = "Please enable location permissions in your browser.";
        else if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map]);

  const calculateSpreadVector = (lat: number, lng: number, angle: number = 0, speed: number = 10) => {
    const length = (speed / 100) * 0.2; 
    const rad = (angle - 90) * (Math.PI / 180);
    return [
      [lat, lng],
      [lat + Math.sin(rad) * length, lng + Math.cos(rad) * length]
    ] as [number, number][];
  };

  const activeSatLayer = SAT_LAYERS.find(sat => activeLayers.has(sat.id)) || null;
  const isFloodRiskActive = activeLayers.has(MapLayer.FLOOD_RISK);
  const isFireRiskActive = activeLayers.has(MapLayer.FIRE_RISK);
  const isBordersActive = activeLayers.has(MapLayer.COUNTRY_BORDERS);

  const handleSelectSatellite = (id: MapLayer) => {
    // Turn off all other satellite layers
    SAT_LAYERS.forEach(sat => {
      if (sat.id !== id && activeLayers.has(sat.id)) {
        onToggleLayer(sat.id);
      }
    });
    // Toggle the selected one
    if (!activeLayers.has(id)) {
      onToggleLayer(id);
    }
    setIsSatMenuOpen(false);
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer center={BIH_CENTER} zoom={8} className="w-full h-full" ref={setMap} zoomControl={false}>
        {!activeSatLayer && (
          <TileLayer
            key={isDarkMode ? 'dark' : 'light'}
            url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          />
        )}
        
        {activeSatLayer && (
          <TileLayer 
            key={activeSatLayer.id}
            url={activeSatLayer.url} 
            attribution={activeSatLayer.label}
          />
        )}
        
        {activeLayers.has(MapLayer.WEATHER_TEMP) && (
          <WMSTileLayer
            url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=d22f66d48348243ed47c132845c48b2a"
            opacity={0.5}
            attribution="OpenWeather"
          />
        )}
        
        {activeLayers.has(MapLayer.WIND_SPEED) && (
          <WMSTileLayer
            url="https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=d22f66d48348243ed47c132845c48b2a"
            opacity={0.5}
            attribution="OpenWeather"
          />
        )}

        {isBordersActive && <GeoJSON data={BIH_GEOJSON} style={{ color: isDarkMode ? '#fbbf24' : '#d97706', weight: 2, fillOpacity: 0.05 }} />}
        
        {activeLayers.has(MapLayer.NASA_FIRMS) && (
          <WMSTileLayer
            url="https://firms.modaps.eosdis.nasa.gov/mapserver/wms/v2/firedetect/"
            layers="fires_viirs_24"
            format="image/png"
            transparent={true}
            attribution="NASA FIRMS"
          />
        )}

        {userPos && <Marker position={userPos} icon={UserIcon} />}

        <LayerGroup>
          {MOCK_FORESTS.map(forest => (
            <Marker key={forest.id} position={forest.coordinates} icon={ForestIcon}>
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <h3 className="font-bold text-slate-900">{t.forests[forest.name as keyof typeof t.forests] || forest.name}</h3>
                  <p className="text-xs text-slate-600">{t.forests[forest.type as keyof typeof t.forests] || forest.type}</p>
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>{t.riskLevel}</span>
                      <span>{Math.round(forest.riskScore * 100)}%</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${forest.riskScore > 0.6 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${forest.riskScore * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>

        {(isFireRiskActive || isFloodRiskActive) && (
          <LayerGroup>
            {incidents.filter(inc => (inc.type === IncidentType.FIRE && isFireRiskActive) || (inc.type === IncidentType.FLOOD && isFloodRiskActive)).map(incident => (
              <React.Fragment key={incident.id}>
                {incident.type === IncidentType.FIRE && incident.windDirection && (
                  <Polyline 
                    positions={calculateSpreadVector(incident.lat, incident.lng, incident.windDirection, incident.windSpeed)} 
                    pathOptions={{ color: '#ef4444', weight: 4, dashArray: '8, 8', opacity: 0.6 }}
                  />
                )}
                <Circle center={[incident.lat, incident.lng]} radius={1000} pathOptions={{ color: incident.urgency === 'high' ? '#ef4444' : '#f59e0b', fillOpacity: 0.6 }}>
                  <Popup>
                    <div className="p-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${incident.type === IncidentType.FIRE ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {incident.type === IncidentType.FIRE ? t.fireAlert : t.floodAlert}
                      </span>
                      <p className="mt-2 text-sm font-medium">{incident.description}</p>
                      {incident.windSpeed && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-slate-500">
                          <Wind size={14} /> {t.windSpeed}: {incident.windSpeed} km/h
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            ))}
          </LayerGroup>
        )}
      </MapContainer>

      {/* Locate Me Button */}
      <button 
        onClick={handleLocateMe} 
        disabled={isLocating}
        className="absolute bottom-32 right-6 z-[1000] bg-slate-900/90 text-white p-4 rounded-full shadow-2xl border border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {isLocating ? <Loader2 size={24} className="animate-spin" /> : <NavIcon size={24} />}
      </button>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 max-w-[200px] w-full items-end">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1 rounded-2xl flex items-center shadow-2xl w-full">
          <button onClick={() => onToggleLayer(MapLayer.FIRE_RISK)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase ${isFireRiskActive ? 'bg-red-600/20 text-red-500' : 'text-slate-400'}`}>
            <Flame size={16} />{t.fireAlert.split(' ')[0]}
          </button>
          <button onClick={() => onToggleLayer(MapLayer.FLOOD_RISK)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase ${isFloodRiskActive ? 'bg-blue-600/20 text-blue-500' : 'text-slate-400'}`}>
            <Waves size={16} />{t.floodAlert.split(' ')[0]}
          </button>
        </div>

        <button onClick={onToggleTheme} className={`w-full p-3 rounded-xl border font-bold text-xs uppercase flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}{isDarkMode ? t.dark : t.light}
        </button>

        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-1 flex gap-1 shadow-2xl w-full">
           <button onClick={() => onToggleLayer(MapLayer.WEATHER_TEMP)} className={`flex-1 p-2 rounded-lg flex items-center justify-center ${activeLayers.has(MapLayer.WEATHER_TEMP) ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
             <Thermometer size={18} />
           </button>
           <button onClick={() => onToggleLayer(MapLayer.WIND_SPEED)} className={`flex-1 p-2 rounded-lg flex items-center justify-center ${activeLayers.has(MapLayer.WIND_SPEED) ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>
             <Wind size={18} />
           </button>
        </div>

        <button onClick={() => onToggleLayer(MapLayer.COUNTRY_BORDERS)} className={`w-full p-3 rounded-xl border font-bold text-xs uppercase flex items-center gap-2 ${isBordersActive ? 'bg-amber-600/20 text-amber-200 border-amber-500' : 'bg-slate-900/90 text-slate-400 border-slate-700'}`}>
          <Globe2 size={18} />{t.borders} {isBordersActive ? t.on : t.off}
        </button>

        {/* Satellite Dropdown Menu */}
        <div className="relative w-full">
          <button 
            onClick={() => setIsSatMenuOpen(!isSatMenuOpen)} 
            className="w-full p-3 bg-slate-900/90 border border-slate-700 rounded-xl flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers size={18} />
              {activeSatLayer ? activeSatLayer.label.split(' ')[0] : t.satellite}
            </span>
            {isSatMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isSatMenuOpen && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[1001]">
              <button 
                onClick={() => {
                  SAT_LAYERS.forEach(sat => activeLayers.has(sat.id) && onToggleLayer(sat.id));
                  setIsSatMenuOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-xs font-bold uppercase flex items-center justify-between transition-colors ${!activeSatLayer ? 'bg-emerald-600/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Vector Map {!activeSatLayer && <Check size={14} />}
              </button>
              {SAT_LAYERS.map(sat => (
                <button
                  key={sat.id}
                  onClick={() => handleSelectSatellite(sat.id)}
                  className={`w-full px-4 py-3 text-left text-xs font-bold uppercase flex items-center justify-between transition-colors ${activeLayers.has(sat.id) ? 'bg-emerald-600/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {sat.label}
                  {activeLayers.has(sat.id) && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={`absolute bottom-6 right-6 z-[1000] p-4 rounded-2xl text-xs hidden md:block shadow-2xl border ${isDarkMode ? 'bg-slate-950/90 text-slate-300 border-slate-800' : 'bg-white/90 text-slate-700 border-slate-200'}`}>
        <h4 className="font-bold mb-3 uppercase tracking-wider text-[10px] opacity-50">{t.gisLegend}</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-600" /><span>{t.fireAlert}</span></div>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-600" /><span>{t.floodAlert}</span></div>
          <div className="flex items-center gap-3"><span className="w-4 h-0.5 border-t-2 border-dashed border-red-500" /><span>{t.windSpeed} Forecast</span></div>
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-orange-600" /><span>{t.nasaFirms}</span></div>
        </div>
      </div>
    </div>
  );
};
