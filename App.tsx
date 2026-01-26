
import React, { useState, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { GISMap } from './components/Map/GISMap';
import { ReportModal } from './components/Report/ReportModal';
import { Language, AppState, MapLayer, IncidentReport, IncidentType } from './types';
import { INITIAL_INCIDENTS, TRANSLATIONS } from './constants';
import { Activity, Shield, Waves, Flame, Search } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    language: Language.EN,
    activeLayers: new Set([MapLayer.FIRE_RISK, MapLayer.VEGETATION, MapLayer.COUNTRY_BORDERS]),
    incidents: INITIAL_INCIDENTS as any,
    view: 'map',
    isReporting: false,
    isDarkMode: true,
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
      if (layer === MapLayer.FIRE_RISK) { newLayers.add(MapLayer.FIRE_RISK); newLayers.delete(MapLayer.FLOOD_RISK); }
      else if (layer === MapLayer.FLOOD_RISK) { newLayers.add(MapLayer.FLOOD_RISK); newLayers.delete(MapLayer.FIRE_RISK); }
      else { newLayers.has(layer) ? newLayers.delete(layer) : newLayers.add(layer); }
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
    setState(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents]
    }));
    setShowModal(false);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors ${state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navigation state={state} onSetView={handleSetView} onSetLang={handleSetLang} onOpenReport={toggleReporting} />
      <main className="flex-1 relative md:ml-64 pb-[60px] md:pb-0 h-full">
        {state.view === 'map' && <GISMap incidents={state.incidents} activeLayers={state.activeLayers} onReportClick={handleMapClick} isReporting={state.isReporting} onToggleLayer={toggleLayer} isDarkMode={state.isDarkMode} onToggleTheme={handleToggleTheme} language={state.language} />}
        {state.view === 'reports' && (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Activity className="text-emerald-500" />{t.recentReports}</h2>
            <div className="grid gap-4">
              {state.incidents.map(inc => (
                <div key={inc.id} className={`p-4 rounded-2xl border flex gap-4 ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className={`p-3 rounded-xl ${inc.type === IncidentType.FIRE ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-blue-500'}`}>
                    {inc.type === IncidentType.FIRE ? <Flame size={24} /> : <Waves size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{inc.type === IncidentType.FIRE ? t.fireAlert : t.floodAlert}</h3>
                    <p className="text-sm opacity-70">{inc.description}</p>
                    <div className="mt-3 flex gap-4 text-xs opacity-50"><span className="flex items-center gap-1"><Shield size={12} />{t.verifiedData}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {state.view === 'layers' && (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{t.filters} & {t.layers}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl border ${state.isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20} className="text-emerald-500" />GIS Layers</h3>
                <div className="space-y-2">
                  {Object.values(MapLayer).map(layer => (
                    <label key={layer} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 cursor-pointer">
                      <span>{layer === MapLayer.NASA_FIRMS ? t.nasaFirms : layer}</span>
                      <input type="checkbox" checked={state.activeLayers.has(layer)} onChange={() => toggleLayer(layer)} className="w-5 h-5 accent-emerald-500" />
                    </label>
                  ))}
                </div>
              </div>
              <div className={`p-6 rounded-2xl border ${state.isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                <h3 className="text-lg font-bold mb-4">{t.regFilters}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold opacity-50 uppercase mb-2">{t.forestType}</p>
                    <select className="w-full bg-slate-800 border-slate-700 p-3 rounded-xl"><option>{t.allTypes}</option></select>
                  </div>
                  <div>
                    <p className="text-xs font-bold opacity-50 uppercase mb-2">{t.riskThreshold}</p>
                    <input type="range" className="w-full accent-emerald-500" />
                    <div className="flex justify-between text-[10px] opacity-50 mt-1"><span>{t.low.toUpperCase()}</span><span>{t.critical}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {state.view === 'stats' && (
          <div className="p-6 h-full">
            <h2 className="text-2xl font-bold mb-6">{t.stats}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[ { label: t.totalProtected, val: '45,230 Ha' }, { label: t.activeHotspots, val: state.incidents.length }, { label: t.avgRiskIndex, val: '0.34' } ].map(stat => (
                <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black mt-2">{stat.val}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-bold mb-4">{t.histComparison}</h3>
              <div className="h-40 flex items-end gap-2 px-4">{[40, 60, 45, 90, 75, 55, 30].map((h, i) => (<div key={i} className="flex-1 bg-emerald-600/20 rounded-t-lg" style={{ height: `${h}%` }} />))}</div>
            </div>
          </div>
        )}
        {showModal && <ReportModal language={state.language} location={reportLocation} onClose={() => setShowModal(false)} onSubmit={handleReportSubmit} />}
      </main>
    </div>
  );
};

export default App;
