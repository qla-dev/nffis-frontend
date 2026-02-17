
import React, { useState } from 'react';
import { Sun, Moon, LandPlot, Wind, Thermometer, Trees, Settings2, Info, Satellite, X, Map as MapIcon, Globe2, ShieldCheck, Trash2, Flame, Waves, Eye, Cloud, Radar, Mountain } from 'lucide-react';
import { MapLayer, Language, RegionType } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface MapControlsProps {
  activeLayers: Set<MapLayer>;
  onToggleLayer: (layer: MapLayer) => void;
  onSetBaseLayer: (layer: MapLayer | null) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  language: Language;
}

export const MapControls: React.FC<MapControlsProps> = ({
  activeLayers,
  onToggleLayer,
  onSetBaseLayer,
  isDarkMode,
  onToggleTheme,
  showLegend,
  onToggleLegend,
  language
}) => {
  const [activePanel, setActivePanel] = useState<'assets' | 'layers' | 'satellite' | null>(null);
  const t = TRANSLATIONS[language];

  const togglePanel = (panel: 'assets' | 'layers' | 'satellite') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const isBaseLayerActive = (layer: MapLayer) => activeLayers.has(layer);
  
  // List of known base layers to check if any is active for the main button state
  const isAnyBaseLayerActive = [
    MapLayer.SATELLITE, MapLayer.SATELLITE_CLARITY, MapLayer.SATELLITE_GOOGLE,
    MapLayer.SENTINEL, MapLayer.INFRARED, MapLayer.METEOBLUE, MapLayer.NASA_FIRMS,
    MapLayer.THERMAL, MapLayer.WINDY, MapLayer.TERRAIN
  ].some(l => activeLayers.has(l));

  return (
    <div className="absolute top-4 right-4 z-[2000] flex flex-col items-end gap-2">
      {/* HORIZONTAL Control Cluster */}
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1 flex items-center gap-1">
        {/* Theme */}
        <button onClick={onToggleTheme} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 bg-amber-400/5 hover:bg-amber-400/10' : 'text-slate-400 hover:bg-slate-800'}`} title={t.theme}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* State Borders */}
        <button 
          onClick={() => onToggleLayer(MapLayer.BIH_BORDERS)} 
          className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.BIH_BORDERS) ? 'text-pink-500 bg-pink-950/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Toggle State Borders"
        >
          <LandPlot size={18} />
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* Wind */}
        <button 
          onClick={() => onToggleLayer(MapLayer.WINDY)} 
          className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.WINDY) ? 'text-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.liveWindVector}
        >
          <Wind size={18} className={activeLayers.has(MapLayer.WINDY) ? 'animate-pulse' : ''} />
        </button>

        {/* Heat Index */}
        <button 
          onClick={() => onToggleLayer(MapLayer.WEATHER_TEMP)} 
          className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.WEATHER_TEMP) ? 'text-orange-500 bg-orange-950/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.heatIndex}
        >
          <Thermometer size={18} className={activeLayers.has(MapLayer.WEATHER_TEMP) ? 'animate-pulse' : ''} />
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* Assets & Regions */}
        <button 
          onClick={() => togglePanel('assets')} 
          className={`p-2.5 rounded-lg transition-colors ${activePanel === 'assets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.assetsRegions}
        >
          <Trees size={18} />
        </button>

        {/* Data Overlays */}
        <button 
          onClick={() => togglePanel('layers')} 
          className={`p-2.5 rounded-lg transition-colors ${activePanel === 'layers' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.dataOverlays}
        >
          <Settings2 size={18} />
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />
        
        {/* Legend */}
        <button 
          onClick={onToggleLegend} 
          className={`p-2.5 rounded-lg transition-colors ${showLegend ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.gisLegend}
        >
          <Info size={18} />
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* Imagery Source (Satellite Icon) */}
        <button 
          onClick={() => togglePanel('satellite')} 
          className={`p-2.5 rounded-lg transition-colors ${activePanel === 'satellite' || isAnyBaseLayerActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          title={t.imagerySource}
        >
          <Satellite size={18} />
        </button>
      </div>

      {/* Dropdown Panels Container */}
      <div className="relative w-64">
        
        {/* Satellite Panel */}
        {activePanel === 'satellite' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              {t.imagerySource}
              <button onClick={() => setActivePanel(null)} className="hover:text-white"><X size={14} /></button>
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Vector (None) */}
                <button 
                onClick={() => { onSetBaseLayer(null); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  !isAnyBaseLayerActive ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <MapIcon size={20} className={!isAnyBaseLayerActive ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Vector</span>
              </button>

                {/* Standard Sat */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Satellite size={20} className={isBaseLayerActive(MapLayer.SATELLITE) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Standard</span>
              </button>

              {/* Clarity */}
              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE_CLARITY); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE_CLARITY) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Eye size={20} className={isBaseLayerActive(MapLayer.SATELLITE_CLARITY) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Clarity</span>
              </button>

              {/* Google */}
              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE_GOOGLE); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE_GOOGLE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Globe2 size={20} className={isBaseLayerActive(MapLayer.SATELLITE_GOOGLE) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Google</span>
              </button>

                {/* Sentinel */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.SENTINEL); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SENTINEL) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Radar size={20} className={isBaseLayerActive(MapLayer.SENTINEL) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Sentinel</span>
              </button>
              
                {/* Terrain */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.TERRAIN); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.TERRAIN) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Mountain size={20} className={isBaseLayerActive(MapLayer.TERRAIN) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Terrain</span>
              </button>

                {/* Infrared */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.INFRARED); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.INFRARED) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Sun size={20} className={isBaseLayerActive(MapLayer.INFRARED) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Infrared</span>
              </button>

              {/* Meteoblue */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.METEOBLUE); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.METEOBLUE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Cloud size={20} className={isBaseLayerActive(MapLayer.METEOBLUE) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Meteoblue</span>
              </button>

              {/* NASA FIRMS */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.NASA_FIRMS); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.NASA_FIRMS) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Flame size={20} className={isBaseLayerActive(MapLayer.NASA_FIRMS) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">NASA FIRMS</span>
              </button>

                {/* Thermal */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.THERMAL); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.THERMAL) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Thermometer size={20} className={isBaseLayerActive(MapLayer.THERMAL) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Thermal</span>
              </button>

                {/* Windy */}
                <button 
                onClick={() => { onSetBaseLayer(MapLayer.WINDY); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.WINDY) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Wind size={20} className={isBaseLayerActive(MapLayer.WINDY) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Windy</span>
              </button>
            </div>
          </div>
        )}

        {/* Assets & Regions Panel */}
        {activePanel === 'assets' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10 py-1">
              {t.assetsRegions}
              <button onClick={() => setActivePanel(null)} className="hover:text-white transition-colors">
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
                  {activeLayers.has(layer.id) && <ShieldCheck size={12} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Layer Quick Panel (Data Overlays) */}
        {activePanel === 'layers' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10 py-1">
              {t.dataOverlays}
              <button onClick={() => setActivePanel(null)} className="hover:text-white transition-colors">
                <X size={14} />
              </button>
            </h4>
            
            <div className="space-y-4">
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
                      {activeLayers.has(layer.id) && <ShieldCheck size={12} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
