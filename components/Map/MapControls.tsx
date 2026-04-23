
import React, { useState } from 'react';
import { Sun, Moon, LandPlot, Wind, Thermometer, Trees, Settings2, Info, Satellite, X, Map as MapIcon, Globe2, ShieldCheck, Trash2, Flame, Waves, Eye, Cloud, Radar, Mountain, ThermometerSun, Check } from 'lucide-react';
import { MapLayer, Language, RegionType } from '../../types';
import { TRANSLATIONS } from '../../constants';
import type { CantonCode, CantonDefinition } from '../../bihData';

interface MapControlsProps {
  activeLayers: Set<MapLayer>;
  onToggleLayer: (layer: MapLayer) => void;
  onSetBaseLayer: (layer: MapLayer | null) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  language: Language;
  borderLayerVisible: boolean;
  cantons: readonly CantonDefinition[];
  selectedCantonCodes: Set<CantonCode>;
  federationSelected: boolean;
  republicSrpskaSelected: boolean;
  brckoDistrictSelected: boolean;
  onToggleBorderLayer: () => void;
  onToggleFederation: () => void;
  onToggleRepublicSrpska: () => void;
  onToggleBrckoDistrict: () => void;
  onToggleCanton: (code: CantonCode) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const MapControls: React.FC<MapControlsProps> = ({
  activeLayers,
  onToggleLayer,
  onSetBaseLayer,
  isDarkMode,
  onToggleTheme,
  showLegend,
  onToggleLegend,
  language,
  borderLayerVisible,
  cantons,
  selectedCantonCodes,
  federationSelected,
  republicSrpskaSelected,
  brckoDistrictSelected,
  onToggleBorderLayer,
  onToggleFederation,
  onToggleRepublicSrpska,
  onToggleBrckoDistrict,
  onToggleCanton,
  containerRef
}) => {
  const [activePanel, setActivePanel] = useState<'assets' | 'layers' | 'satellite' | 'fwi' | 'borders' | null>(null);
  const t = TRANSLATIONS[language];

  const togglePanel = (panel: 'assets' | 'layers' | 'satellite' | 'fwi' | 'borders') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleBordersButtonClick = () => {
    if (!borderLayerVisible) {
      onToggleBorderLayer();
      setActivePanel('borders');
      return;
    }

    if (activePanel === 'borders') {
      onToggleBorderLayer();
      setActivePanel(null);
      return;
    }

    setActivePanel('borders');
  };

  const isBaseLayerActive = (layer: MapLayer) => activeLayers.has(layer);
  
  // List of known base layers to check if any is active for the main button state
  const isAnyBaseLayerActive = [
    MapLayer.SATELLITE, MapLayer.SATELLITE_CLARITY, MapLayer.SATELLITE_GOOGLE,
    MapLayer.SENTINEL, MapLayer.INFRARED, MapLayer.NASA_FIRMS,
    MapLayer.THERMAL, MapLayer.WINDY, MapLayer.TERRAIN
  ].some(l => activeLayers.has(l));
  const activeFwiLayer = [
    MapLayer.FWI_ANGSTROM,
    MapLayer.FWI_GFI,
    MapLayer.FWI_KBDI
  ].find((layer) => activeLayers.has(layer)) ?? null;
  const isAnyFwiActive = [
    MapLayer.FWI_ANGSTROM,
    MapLayer.FWI_GFI,
    MapLayer.FWI_KBDI
  ].some((layer) => activeLayers.has(layer));

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] md:absolute md:top-4 md:right-4 md:left-auto md:pt-0 z-[2000] flex flex-col items-end gap-2">
      {/* HORIZONTAL Control Cluster */}
      <div className="w-full md:w-auto">
        <div
          className="overflow-x-auto overflow-y-hidden px-3 py-2 md:px-0 md:py-0 bg-transparent border-none shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain', overscrollBehaviorY: 'none' }}
        >
          <div className="min-w-max bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl md:shadow-2xl p-1 flex items-center gap-1">
            {/* Theme */}
            <button onClick={onToggleTheme} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 bg-amber-400/5 hover:bg-amber-400/10' : 'text-slate-400 hover:bg-slate-800'}`} title={t.theme}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="w-px h-6 bg-slate-800 mx-1" />

            {/* BiH Cantons */}
            <button 
              onClick={handleBordersButtonClick} 
              className={`p-2.5 rounded-lg transition-colors ${borderLayerVisible ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
              title="BiH Cantons"
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

            {/* Meteoblue Temp Toggle */}
            <button 
              onClick={() => onToggleLayer(MapLayer.METEOBLUE)}
              className={`p-2.5 rounded-lg transition-colors ${activeLayers.has(MapLayer.METEOBLUE) ? 'text-blue-400 bg-blue-950/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Meteoblue Temperature"
            >
              <ThermometerSun size={18} className={activeLayers.has(MapLayer.METEOBLUE) ? 'animate-pulse' : ''} />
            </button>

            {/* FWI */}
            <button 
              onClick={() => togglePanel('fwi')}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded-lg leading-none transition-colors ${activePanel === 'fwi' || isAnyFwiActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
              title="FWI"
            >
              <span className="text-[11px] font-black leading-none tracking-[0.18em]">FWI</span>
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
        </div>
      </div>

      {/* Dropdown Panels Container */}
      <div className="relative w-64 mr-4 md:mr-0">
        {activePanel === 'borders' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-72 animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between sticky top-0 bg-slate-950/95 z-10 py-1">
              BiH Cantons
              <button onClick={() => setActivePanel(null)} className="hover:text-white transition-colors">
                <X size={14} />
              </button>
            </h4>

            <div className="space-y-2 mb-4">
              <button
                onClick={onToggleFederation}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                  federationSelected
                    ? 'border-blue-600/40 bg-blue-600/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className={`text-[11px] font-bold ${federationSelected ? 'text-white' : 'text-slate-300'}`}>Federation of BiH</div>
                  <div className="text-[10px] text-blue-200/80">{selectedCantonCodes.size}/{cantons.length} cantons selected</div>
                </div>
                {federationSelected && <Check size={12} className="text-blue-500 shrink-0" />}
              </button>
              <button
                onClick={onToggleRepublicSrpska}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                  republicSrpskaSelected
                    ? 'border-blue-600/40 bg-blue-600/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className={`text-[11px] font-bold ${republicSrpskaSelected ? 'text-white' : 'text-slate-300'}`}>Republic of Srpska</div>
                {republicSrpskaSelected && <Check size={12} className="text-blue-500 shrink-0" />}
              </button>
              <button
                onClick={onToggleBrckoDistrict}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                  brckoDistrictSelected
                    ? 'border-blue-600/40 bg-blue-600/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className={`text-[11px] font-bold ${brckoDistrictSelected ? 'text-white' : 'text-slate-300'}`}>Brčko distrikt</div>
                {brckoDistrictSelected && <Check size={12} className="text-blue-500 shrink-0" />}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1">
              {cantons.map((canton) => {
                const isSelected = selectedCantonCodes.has(canton.code);

                return (
                  <button
                    key={canton.code}
                    onClick={() => onToggleCanton(canton.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-600/50'
                        : 'bg-slate-900/50 border-transparent hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_0_1px_rgba(15,23,42,0.8)]"
                        style={{ backgroundColor: canton.color }}
                      />
                      <span className={`text-[10px] font-black tracking-[0.16em] ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {canton.code}
                      </span>
                      <div className="min-w-0 text-left">
                        <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {canton.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {canton.seat}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={12} className="text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
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

        {activePanel === 'fwi' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              FWI
              <button onClick={() => setActivePanel(null)} className="hover:text-white">
                <X size={14} />
              </button>
            </h4>
            <div className="space-y-1">
              {[
                { id: null, label: 'Off', icon: X, color: 'text-slate-400' },
                { id: MapLayer.FWI_ANGSTROM, label: t.dashboard.angstrom, icon: Flame, color: 'text-red-500' },
                { id: MapLayer.FWI_GFI, label: t.dashboard.gfi, icon: Trees, color: 'text-emerald-500' },
                { id: MapLayer.FWI_KBDI, label: t.dashboard.kbdi, icon: Thermometer, color: 'text-amber-400' },
              ].map((layer) => (
                <button
                  key={layer.id ?? 'fwi-off'}
                  onClick={() => {
                    if (layer.id) {
                      onToggleLayer(layer.id);
                      return;
                    }

                    if (activeFwiLayer) {
                      onToggleLayer(activeFwiLayer);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                    layer.id ? activeLayers.has(layer.id) : !activeFwiLayer
                      ? 'bg-blue-600/10 border-blue-600/50'
                      : 'bg-slate-900/50 border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <layer.icon
                      size={16}
                      className={layer.id ? (activeLayers.has(layer.id) ? layer.color : 'text-slate-600') : (!activeFwiLayer ? layer.color : 'text-slate-600')}
                    />
                    <span className={`text-[11px] font-bold ${layer.id ? (activeLayers.has(layer.id) ? 'text-white' : 'text-slate-500') : (!activeFwiLayer ? 'text-white' : 'text-slate-500')}`}>
                      {layer.label}
                    </span>
                  </div>
                  {(layer.id ? activeLayers.has(layer.id) : !activeFwiLayer) && <ShieldCheck size={12} className="text-blue-500" />}
                </button>
              ))}
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
