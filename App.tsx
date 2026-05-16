
import React, { useState, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { GISMap } from './components/Map/GISMap';
import { ReportModal } from './components/Report/ReportModal';
import { SessionLoginGate } from './components/Auth/SessionLoginGate';
import { Language, AppState, MapLayer, IncidentReport, IncidentType } from './types';
import { INITIAL_INCIDENTS, TRANSLATIONS } from './constants';
import { Activity, Shield, Waves, Flame, Search, Layers, Database, ChevronRight } from 'lucide-react';

const BASE_LAYER_IDS = [
  MapLayer.SATELLITE,
  MapLayer.SATELLITE_CLARITY,
  MapLayer.SATELLITE_GOOGLE,
  MapLayer.SENTINEL,
  MapLayer.INFRARED,
  MapLayer.NASA_FIRMS,
  MapLayer.THERMAL,
  MapLayer.TERRAIN,
  MapLayer.WINDY
];

const FWI_LAYER_IDS = [
  MapLayer.FWI_BOSNIAN
];

const FWI_DEBUG_PREFIX = '[FWI DEBUG]';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    language: Language.EN,
    // Enable AWS layers by default along with core GIS layers
    activeLayers: new Set([
      MapLayer.FIRE_RISK, 
      MapLayer.BIH_BORDERS, 
      MapLayer.FORESTS, 
      MapLayer.LANDFILLS,
      MapLayer.FWI_BOSNIAN,
      'AWS Precipitation' as MapLayer,
      'AWS Agro' as MapLayer,
      'AWS Meteo' as MapLayer
    ]),
    incidents: INITIAL_INCIDENTS as any,
    view: 'map',
    isReporting: false,
    isDarkMode: false,
  });

  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const t = TRANSLATIONS[state.language];

  const handleSetView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));
  const handleSetLang = (language: Language) => setState(prev => ({ ...prev, language }));
  const handleToggleTheme = () => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  
  const startReporting = () => {
    setShowModal(false);
    setReportLocation(null);
    setState(prev => ({ ...prev, view: 'map', isReporting: true }));
  };
  
  const cancelReporting = () => {
    setReportLocation(null);
    setState(prev => ({ ...prev, isReporting: false }));
  };

  const toggleLayer = useCallback((layer: MapLayer) => {
    if (!layer) return;
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);

      if (FWI_LAYER_IDS.includes(layer)) {
        const isAlreadyActive = newLayers.has(layer);
        FWI_LAYER_IDS.forEach(id => newLayers.delete(id));
        if (!isAlreadyActive) {
          newLayers.add(layer);
        }
        return { ...prev, activeLayers: newLayers };
      }

      if (newLayers.has(layer)) {
        newLayers.delete(layer);
      } else {
        newLayers.add(layer);
      }
      return { ...prev, activeLayers: new Set(newLayers) };
    });
  }, []);

  const setBaseLayer = useCallback((layer: MapLayer | null) => {
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);
      BASE_LAYER_IDS.forEach(id => newLayers.delete(id));
      if (layer) {
        newLayers.add(layer);
      }
      return { ...prev, activeLayers: newLayers };
    });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setReportLocation({ lat, lng });
    setShowModal(true);
    setState(prev => ({ ...prev, isReporting: false }));
  }, []);

  const handleReportSubmit = (data: any) => {
    const newIncident: IncidentReport = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      ...data
    };
    setState(prev => ({ ...prev, incidents: [newIncident, ...prev.incidents] }));
    setShowModal(false);
    setReportLocation(null);
  };

  const overlayLayers = Object.values(MapLayer).filter(
    (layer) =>
      !BASE_LAYER_IDS.includes(layer) &&
      layer !== MapLayer.METEOBLUE &&
      layer !== MapLayer.BIH_BORDERS &&
      layer !== MapLayer.FWI_ANGSTROM &&
      layer !== MapLayer.FWI_GFI &&
      layer !== MapLayer.FWI_KBDI
  );

  return (
    <div className={`flex h-screen w-full overflow-hidden ${state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navigation state={state} onSetView={handleSetView} onSetLang={handleSetLang} onOpenReport={startReporting} />
      
      <main className="flex-1 relative md:ml-auto h-full min-h-0 min-w-0 overflow-hidden transition-all duration-300">
        {state.view === 'map' && (
          <GISMap 
            incidents={state.incidents} 
            activeLayers={state.activeLayers} 
            onReportClick={handleMapClick} 
            onCancelReport={cancelReporting}
            isReporting={state.isReporting} 
            onToggleLayer={toggleLayer}
            onSetBaseLayer={setBaseLayer}
            isDarkMode={state.isDarkMode} 
            onToggleTheme={handleToggleTheme} 
            language={state.language} 
            onSetLanguage={handleSetLang}
          />
        )}

        {state.view !== 'map' && (
          <div className={`h-full w-full overflow-y-auto p-8 ${state.isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="max-w-6xl mx-auto">
              <header className={`mb-10 flex items-center justify-between border-b pb-6 ${state.isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-2 text-blue-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                    <Database size={14} /> {t.systemCoreData}
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${state.isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {state.view === 'reports' ? t.recentReports : state.view === 'layers' ? t.layers : t.stats}
                  </h1>
                </div>
              </header>

              {state.view === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.incidents.map(inc => (
                    <div key={inc.id} className={`group border rounded-xl overflow-hidden transition-all duration-300 shadow-xl ${state.isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50'}`}>
                      <div className={`h-1.5 w-full ${inc.type === IncidentType.FIRE ? 'bg-red-600' : 'bg-blue-600'}`} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-2 rounded-lg ${inc.type === IncidentType.FIRE ? 'bg-red-600/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}>
                             {inc.type === IncidentType.FIRE ? <Flame size={20} /> : <Waves size={20} />}
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${inc.urgency === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/5' : state.isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                             {inc.urgency.toUpperCase()}
                           </span>
                        </div> 
                        <h3 className={`font-bold text-lg mb-2 ${state.isDarkMode ? 'text-white' : 'text-slate-900'}`}>{inc.type === IncidentType.FIRE ? t.fireAlert : t.floodAlert}</h3>
                        <p className={`text-sm leading-relaxed mb-6 line-clamp-3 ${state.isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>"{inc.description}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.view === 'layers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`border rounded-xl p-6 ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Layers size={16} className="text-blue-500" /> Active GIS Layers
                    </h3>
                    <div className="space-y-1">
                      {overlayLayers.map(layer => (
                        <label key={layer} className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${state.activeLayers.has(layer) ? (state.isDarkMode ? 'bg-blue-600/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-200') : (state.isDarkMode ? 'hover:bg-slate-800/50 border border-transparent' : 'hover:bg-slate-50 border border-transparent')}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${state.activeLayers.has(layer) ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className={`text-sm ${state.activeLayers.has(layer) ? (state.isDarkMode ? 'text-white font-medium' : 'text-slate-900 font-bold') : 'text-slate-500'}`}>
                              {layer}
                            </span>
                          </div>
                          <div 
                            onClick={(e) => { e.preventDefault(); toggleLayer(layer); }}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${state.activeLayers.has(layer) ? 'bg-blue-600' : (state.isDarkMode ? 'bg-slate-700' : 'bg-slate-300')}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${state.activeLayers.has(layer) ? 'left-5' : 'left-1'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showModal && (
          <ReportModal 
            language={state.language} 
            location={reportLocation} 
            onClose={() => {
              setShowModal(false);
              setReportLocation(null);
            }} 
            onSubmit={handleReportSubmit} 
          />
        )}
      </main>

      <SessionLoginGate />
    </div>
  );
};

export default App;
