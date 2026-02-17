import React, { useState, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { GISMap } from './components/Map/GISMap';
import { ReportModal } from './components/Report/ReportModal';
import { Language, AppState, MapLayer, IncidentReport, IncidentType } from './types';
import { INITIAL_INCIDENTS, TRANSLATIONS } from './constants';
import { Activity, Shield, Waves, Flame, Search, Layers, Database, ChevronRight } from 'lucide-react';

const BASE_LAYER_IDS = [
  MapLayer.SATELLITE,
  MapLayer.SATELLITE_CLARITY,
  MapLayer.SATELLITE_GOOGLE,
  MapLayer.SENTINEL,
  MapLayer.INFRARED,
  MapLayer.METEOBLUE,
  MapLayer.NASA_FIRMS,
  MapLayer.THERMAL,
  MapLayer.TERRAIN,
  MapLayer.WINDY
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    language: Language.EN,
    // Removed MapLayer.COUNTRY_BORDERS and added MapLayer.BIH_BORDERS to activeLayers by default
    activeLayers: new Set([MapLayer.FIRE_RISK, MapLayer.BIH_BORDERS, MapLayer.FORESTS, MapLayer.LANDFILLS, MapLayer.WINDY]),
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
  const toggleReporting = () => setState(prev => ({ ...prev, isReporting: !prev.isReporting }));

  const toggleLayer = useCallback((layer: MapLayer) => {
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);
      if (newLayers.has(layer)) {
        newLayers.delete(layer);
      } else {
        newLayers.add(layer);
      }
      return { ...prev, activeLayers: newLayers };
    });
  }, []);

  const setBaseLayer = useCallback((layer: MapLayer | null) => {
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);
      // Remove all known base layers to ensure exclusivity
      BASE_LAYER_IDS.forEach(id => newLayers.delete(id));
      
      // If a layer is provided (not null/vector), add it
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
  };

  // Filter out base layers for the main "Layers" list view
  const overlayLayers = Object.values(MapLayer).filter(layer => !BASE_LAYER_IDS.includes(layer));

  return (
    <div className={`flex h-screen w-full overflow-hidden ${state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navigation state={state} onSetView={handleSetView} onSetLang={handleSetLang} onOpenReport={toggleReporting} />
      
      <main className="flex-1 relative md:ml-auto h-full overflow-hidden transition-all duration-300">
        {state.view === 'map' && (
          <GISMap 
            incidents={state.incidents} 
            activeLayers={state.activeLayers} 
            onReportClick={handleMapClick} 
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
          <div className="h-full w-full overflow-y-auto bg-slate-950 p-8">
            <div className="max-w-6xl mx-auto">
              <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-blue-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                    <Database size={14} /> {t.systemCoreData}
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {state.view === 'reports' ? t.recentReports : state.view === 'layers' ? t.layers : t.stats}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800" />)}
                   </div>
                   <span className="text-[10px] text-slate-500 ml-2 font-mono uppercase tracking-widest">3 {t.activeOperators}</span>
                </div>
              </header>

              {state.view === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.incidents.map(inc => (
                    <div key={inc.id} className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-xl">
                      <div className={`h-1.5 w-full ${inc.type === IncidentType.FIRE ? 'bg-red-600' : 'bg-blue-600'}`} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-2 rounded-lg ${inc.type === IncidentType.FIRE ? 'bg-red-600/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}>
                             {inc.type === IncidentType.FIRE ? <Flame size={20} /> : <Waves size={20} />}
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${inc.urgency === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/5' : 'border-slate-700 text-slate-400'}`}>
                             {inc.urgency.toUpperCase()}
                           </span>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-2">{inc.type === IncidentType.FIRE ? t.fireAlert : t.floodAlert}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3">"{inc.description}"</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">VERIFIED DATA</span>
                          <button className="text-blue-500 hover:text-blue-400 text-xs font-bold flex items-center gap-1 group">
                            VIEW ON MAP <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.view === 'layers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Layers size={16} className="text-blue-500" /> Active GIS Layers
                    </h3>
                    <div className="space-y-1">
                      {overlayLayers.map(layer => (
                        <label key={layer} className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${state.activeLayers.has(layer) ? 'bg-blue-600/5 border border-blue-500/20' : 'hover:bg-slate-800/50 border border-transparent'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${state.activeLayers.has(layer) ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
                            <span className={`text-sm ${state.activeLayers.has(layer) ? 'text-white font-medium' : 'text-slate-400'}`}>
                              {layer}
                            </span>
                          </div>
                          {/* Google Style Switch */}
                          <div 
                            onClick={(e) => { e.preventDefault(); toggleLayer(layer); }}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${state.activeLayers.has(layer) ? 'bg-blue-600' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${state.activeLayers.has(layer) ? 'left-5' : 'left-1'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Risk Threshold Filter</h3>
                      <div className="px-2">
                        <input type="range" className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <div className="flex justify-between mt-4">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">Low Risk</span>
                          <span className="text-[10px] font-bold text-red-500 uppercase">Critical Only</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-600 rounded-xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                      <h3 className="text-2xl font-black text-white mb-2">Automated Analysis</h3>
                      <p className="text-blue-100 text-sm mb-6">Our system uses machine learning to correlate NASA hotspots with community reports in real-time.</p>
                      <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold text-sm shadow-xl hover:bg-slate-50 transition-colors">
                        GENERATE REPORT
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {state.view === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Protected Area', val: '45.2k ha', icon: Shield, color: 'text-blue-500' },
                      { label: 'Active Alerts', val: state.incidents.length, icon: Flame, color: 'text-red-500' },
                      { label: 'Reliability', val: '99.8%', icon: Activity, color: 'text-emerald-500' }
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
                        <stat.icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 ${stat.color}`} />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                        <p className="text-4xl font-black text-white mt-4">{stat.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-white uppercase tracking-widest text-sm">Threat Index History</h3>
                      <select className="bg-slate-800 border-none text-[10px] rounded px-3 py-1 font-bold text-slate-400">
                        <option>LAST 7 DAYS</option>
                        <option>LAST 30 DAYS</option>
                      </select>
                    </div>
                    <div className="h-48 flex items-end gap-3">
                      {[30, 45, 25, 80, 65, 40, 55, 30, 45, 90, 70, 50, 35, 60].map((h, i) => (
                        <div key={i} className="group relative flex-1 h-full flex flex-col justify-end">
                          <div className="bg-blue-600/20 group-hover:bg-blue-600/40 transition-colors rounded-t w-full" style={{ height: `${h}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Val: {h}%</div>
                          </div>
                        </div>
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
            onClose={() => setShowModal(false)} 
            onSubmit={handleReportSubmit} 
          />
        )}
      </main>
    </div>
  );
};

export default App;