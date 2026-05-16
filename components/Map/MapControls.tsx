
import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, LandPlot, Wind, Thermometer, Trees, Settings2, Info, Satellite, X, Map as MapIcon, Globe2, ShieldCheck, Trash2, Flame, Waves, Eye, Cloud, Radar, Mountain, ThermometerSun, Check, MapPin, Users } from 'lucide-react';
import { MapLayer, Language, RegionType } from '../../types';
import { TRANSLATIONS } from '../../constants';
import type { CantonCode, CantonDefinition } from '../../bihData';

const FirefighterIcon = ({ size = 24, className = '', color = 'currentColor' }: { size?: number | string; className?: string; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" fill={color} className={className}>
    <path d="M447.914,152.582c7.106-21.525-11.432-27.796-32.816-25.646c-13.67,1.371-34.454,10.077-44.728,5.034 c0,0-5.791-92.214-82.374-107.625v34.745h-7.524c-0.78-0.157-1.529-0.331-2.324-0.464V7.784c0-4.302-4.168-7.784-9.297-7.784H256 h-12.85c-5.129,0-9.297,3.482-9.297,7.784v50.843c-0.796,0.134-1.544,0.307-2.324,0.464h-7.524V24.346 c-76.582,15.41-82.374,107.625-82.374,107.625c-10.274,5.042-31.058-3.664-44.728-5.034c-21.384-2.151-39.923,4.12-32.816,25.646 c4.9,14.852,24.55,27.284,46.359,36.857c9.809,4.302,20.572,7.769,30.854,10.519c-0.433,2.032-0.678,4.215-0.678,6.555 c0,4.325,0.741,9.186,2.34,14.772c4.215,14.686,8.021,24.172,12.953,31.13c2.458,3.458,5.263,6.232,8.321,8.344 c1.851,1.292,3.773,2.285,5.712,3.16c4.436,20.524,13.914,34.95,22.36,45.295l-0.275-0.032c-4.46-0.007-8.588,1.142-12.031,3.026 c-5.193,2.853-8.833,7.138-11.228,11.566c-2.38,4.475-3.64,9.076-3.664,13.552c0,6.106,0,15.49,0,21.352 c-7.383,2.308-21.596,7.076-36.771,13.914c-10.96,4.956-22.407,10.976-32.24,18.106c-9.793,7.169-18.192,15.395-22.36,25.7 c-5.563,13.977-7.335,25.614-7.335,34.636c-0.008,13.536,3.986,21.052,4.49,21.903l0.733,1.3l1.198,0.899 c0.969,0.756,26.11,19.13,90.268,29.324c26.512,4.531,57.878,7.532,92.907,7.54c34.438,0,65.316-2.923,91.552-7.319 c65.166-10.156,90.647-28.79,91.616-29.546l1.206-0.899l0.732-1.3c0.504-0.858,4.492-8.367,4.484-21.903 c0.008-9.022-1.765-20.659-7.328-34.636c-4.168-10.305-12.566-18.531-22.36-25.7c-14.749-10.684-33.162-18.925-48.021-24.677 c-8.808-3.396-16.27-5.862-20.99-7.336c0-5.87,0-15.253,0-21.36c-0.008-2.994-0.59-6.012-1.663-9.045 c-1.622-4.522-4.348-9.1-8.54-12.787c-4.152-3.688-10.006-6.343-16.719-6.312l-0.276,0.032 c8.447-10.345,17.925-24.771,22.36-45.295c1.938-0.875,3.861-1.868,5.712-3.16c4.609-3.176,8.517-7.792,11.834-14.072 c3.333-6.303,6.287-14.371,9.439-25.401c1.6-5.594,2.332-10.447,2.332-14.78c0.008-2.332-0.244-4.523-0.67-6.555 c10.282-2.758,21.044-6.209,30.853-10.511C423.363,179.866,443.013,167.434,447.914,152.582z M221.672,113.298 C247.672,106.01,256,87.282,256,87.282s8.328,18.728,34.328,26.016v33.296c0,0-14.56,22.88-34.328,26.008 c-19.768-3.128-34.328-26.008-34.328-26.008V113.298z M150.738,185.965c-1.993,1.229-3.884,3.16-5.554,5.436 c-7.627-3.396-13.354-6.5-16.294-8.58c-9.384-6.642-3.948-12.661,11.677-4.412c4.175,2.206,8.375,4.302,12.63,6.287 C152.393,185.043,151.581,185.452,150.738,185.965z M246.16,492.121c-27.742-0.473-54.561-2.773-79.758-7.066 c-47.43-7.54-71.555-19.619-79.112-24.015c-0.551-2.001-1.197-5.358-1.197-9.999c0-7.366,1.678-15.529,4.83-24.235 c46.225,9.29,99.038,14.757,155.238,15.34V492.121z M246.16,375.83c-21.525-0.496-42.184-2.482-61.361-5.902v-32.602 c0.008-1.111,0.488-2.671,1.355-4.302c0.858-1.591,1.993-2.829,3.309-3.545c0.489-0.268,1.339-0.606,2.498-0.606 c0.85,0,2.088,0.134,3.806,0.74c5.112,1.804,11.582,2.93,16.104,3.561c5.058,0.701,10.935,1.276,17.444,1.686 c6.358,0.402,12.33,0.59,16.845,0.693V375.83z M421.086,426.798c3.136,8.682,4.821,16.852,4.821,24.219 c0,4.632-0.645,7.974-1.212,10.022c-7.628,4.444-32.083,16.695-80.176,24.188c-25.102,4.207-51.504,6.437-78.679,6.893v-49.975 C322.04,441.563,374.86,436.095,421.086,426.798z M319.914,328.872c1.993,0,3.254,0.945,3.702,1.347 c1.686,1.488,2.608,3.38,3.081,4.704c0.323,0.906,0.504,1.781,0.504,2.45v32.555c-19.178,3.42-39.836,5.406-61.361,5.902v-40.285 c8.698-0.189,22.636-0.732,34.328-2.379c4.499-0.623,10.991-1.757,16.12-3.577C317.581,329.132,318.866,328.872,319.914,328.872z M355.155,217.331c-3.978,14.008-7.548,22.171-10.826,26.694c-1.638,2.292-3.136,3.718-4.806,4.884 c-1.67,1.158-3.584,2.08-6.098,2.978l-3.956,1.402l-0.725,4.136c-4.617,25.867-17.948,40.426-27.796,51.386l-1.852,2.065v2.537 l-1.671,0.26c-11.487,1.615-25.787,2.095-34.21,2.237L256,315.966l-7.218-0.056c-4.727-0.071-11.306-0.26-18.231-0.701 c-5.389-0.339-10.976-0.843-15.978-1.536l-1.67-0.26v-2.537l-1.852-2.065c-9.849-10.96-23.18-25.519-27.797-51.386l-0.732-4.136 l-3.948-1.402c-2.513-0.899-4.428-1.82-6.099-2.978c-2.474-1.741-4.704-4.12-7.319-8.99c-2.584-4.846-5.318-12.086-8.312-22.588 c-1.315-4.601-1.78-8.17-1.78-10.818c0-3.081,0.591-4.877,1.198-6.012c0.906-1.654,2.025-2.363,3.435-2.93 c1.158-0.442,2.355-0.56,2.836-0.584l7.714,0.954v-6.036c23.731,8.919,50.448,14.276,85.754,14.276 c35.306,0,62.022-5.357,85.754-14.276v5.626l7.524-0.544c0.354-0.031,2.781,0.197,4.342,1.237c0.827,0.528,1.496,1.142,2.12,2.277 c0.598,1.135,1.189,2.931,1.197,6.004C356.936,209.168,356.463,212.73,355.155,217.331z M383.11,182.821 c-2.923,2.064-8.62,5.161-16.215,8.541c-2.364-3.262-5.334-5.405-8.107-6.658c4.262-1.993,8.462-4.089,12.646-6.295 C387.057,170.16,392.493,176.179,383.11,182.821z" />
  </svg>
);

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
  onStartPickingLocation?: () => void;
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
  containerRef,
  onStartPickingLocation
}) => {
  const [activePanel, setActivePanel] = useState<'assets' | 'layers' | 'satellite' | 'fwi' | 'borders' | 'aws' | null>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const effectiveRef = containerRef || localRef;
  const t = TRANSLATIONS[language];

  const togglePanel = (panel: 'assets' | 'layers' | 'satellite' | 'fwi' | 'borders' | 'aws') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (effectiveRef.current && !effectiveRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    };

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel, containerRef]);

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
    MapLayer.FWI_KBDI, MapLayer.FWI_BOSNIAN].find((layer) => activeLayers.has(layer)) ?? null;
  const isAnyFwiActive = [
    MapLayer.FWI_ANGSTROM,
    MapLayer.FWI_GFI,
    MapLayer.FWI_KBDI, MapLayer.FWI_BOSNIAN].some((layer) => activeLayers.has(layer));

  return (
    <div ref={effectiveRef} className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] md:absolute md:top-4 md:right-4 md:left-auto md:pt-0 z-[2000] flex flex-col items-end gap-2 pointer-events-none">
      {/* HORIZONTAL Control Cluster */}
      <div className="w-full md:w-auto pointer-events-auto">
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

            <button
              onClick={() => onToggleLayer(MapLayer.FIREFIGHTER_STATIONS)}
              className={`p-2.5 rounded-lg transition-colors ${
                activeLayers.has(MapLayer.FIREFIGHTER_STATIONS)
                  ? 'text-orange-300 bg-orange-950/40 shadow-[0_0_10px_rgba(251,146,60,0.25)]'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title={t.firefighterStations}
            >
              <FirefighterIcon size={22} />
            </button>

            <button
              onClick={() => onToggleLayer(MapLayer.RS_FIREFIGHTER_DENSITY)}
              className={`p-2.5 rounded-lg transition-colors ${
                activeLayers.has(MapLayer.RS_FIREFIGHTER_DENSITY)
                  ? 'text-emerald-300 bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title={t.firefighterDensity}
            >
              <Users size={18} />
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

            <button 
              onClick={() => togglePanel('aws')}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded-lg leading-none transition-colors ${
                activePanel === 'aws' || 
                activeLayers.has('AWS Precipitation' as MapLayer) || 
                activeLayers.has('AWS Agro' as MapLayer) || 
                activeLayers.has('AWS Meteo' as MapLayer)
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Automatic Weather Stations"
            >
              <span className="text-[11px] font-black leading-none tracking-[0.18em]">AWS</span>
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
      <div className="relative w-64 mr-4 md:mr-0 pointer-events-auto">
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
              <button 
                onClick={() => { onSetBaseLayer(null); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  !isAnyBaseLayerActive ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <MapIcon size={20} className={!isAnyBaseLayerActive ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Vector</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Satellite size={20} className={isBaseLayerActive(MapLayer.SATELLITE) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Standard</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE_CLARITY); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE_CLARITY) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Eye size={20} className={isBaseLayerActive(MapLayer.SATELLITE_CLARITY) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Clarity</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SATELLITE_GOOGLE); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SATELLITE_GOOGLE) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Globe2 size={20} className={isBaseLayerActive(MapLayer.SATELLITE_GOOGLE) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Google</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.SENTINEL); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.SENTINEL) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Radar size={20} className={isBaseLayerActive(MapLayer.SENTINEL) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Sentinel</span>
              </button>
              
              <button 
                onClick={() => { onSetBaseLayer(MapLayer.TERRAIN); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.TERRAIN) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Mountain size={20} className={isBaseLayerActive(MapLayer.TERRAIN) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Terrain</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.INFRARED); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.INFRARED) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Sun size={20} className={isBaseLayerActive(MapLayer.INFRARED) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Infrared</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.NASA_FIRMS); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.NASA_FIRMS) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Flame size={20} className={isBaseLayerActive(MapLayer.NASA_FIRMS) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">NASA FIRMS</span>
              </button>

              <button 
                onClick={() => { onSetBaseLayer(MapLayer.THERMAL); setActivePanel(null); }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isBaseLayerActive(MapLayer.THERMAL) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-transparent hover:border-slate-700'
                }`}
              >
                <Thermometer size={20} className={isBaseLayerActive(MapLayer.THERMAL) ? 'text-blue-500' : 'text-slate-500'} />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">Thermal</span>
              </button>

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
                { id: MapLayer.FWI_BOSNIAN, label: t.dashboard.fwiBosnian, icon: Flame, color: 'text-purple-500' },
              ].map((layer) => (
                <button
                  key={layer.id ?? 'fwi-off'}
                  onClick={() => {
                    if (layer.id) {
                      onToggleLayer(layer.id);
                    } else if (activeFwiLayer) {
                      onToggleLayer(activeFwiLayer);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                    (layer.id ? activeLayers.has(layer.id) : !activeFwiLayer)
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

            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onStartPickingLocation?.();
                  setActivePanel(null);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg border border-transparent bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all text-slate-400 hover:text-white group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                  <MapPin size={16} className="text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-bold">Uzmi lokaciju</span>
                  <span className="text-[9px] text-slate-500 italic">Analiza tačke na mapi</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* AWS Panel */}
        {activePanel === 'aws' && (
          <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl p-4 w-64 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              {(t as any).aws?.title || 'Automatske Stanice'}
              <button onClick={() => setActivePanel(null)} className="hover:text-white transition-colors">
                <X size={14} />
              </button>
            </h4>
            <div className="space-y-1">
              {[
                { id: 'AWS Precipitation' as MapLayer, label: (t as any).aws?.precipitation || 'Padavinska', dotColor: '#06b6d4' },
                { id: 'AWS Agro' as MapLayer, label: (t as any).aws?.agro || 'Agrometeo', dotColor: '#eab308' },
                { id: 'AWS Meteo' as MapLayer, label: (t as any).aws?.meteo || 'Meteorološka', dotColor: '#10b981' },
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
                    <div className="w-3 h-3 rounded-full shrink-0"
                         style={{ background: activeLayers.has(layer.id) ? layer.dotColor : '#334155' }} />
                    <span className={`text-[11px] font-bold ${activeLayers.has(layer.id) ? 'text-white' : 'text-slate-500'}`}>
                      {layer.label}
                    </span>
                  </div>
                  {activeLayers.has(layer.id) && <ShieldCheck size={12} className="text-blue-500" />}
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
                { id: MapLayer.FIREFIGHTER_STATIONS, label: t.firefighterStations, icon: FirefighterIcon, color: 'text-orange-400' },
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
              <div className="space-y-1">
                {[
                  { id: MapLayer.FIRE_RISK, label: t.fireThreats, icon: Flame, color: 'text-red-500' },
                  { id: MapLayer.FLOOD_RISK, label: t.hydrological, icon: Waves, color: 'text-blue-500' },
                  { id: MapLayer.RS_FIREFIGHTER_DENSITY, label: t.firefighterDensity, icon: Users, color: 'text-emerald-400' },
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
        )}
      </div>
    </div>
  );
};
