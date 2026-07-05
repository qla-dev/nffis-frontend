import React from 'react';
import { Map, ListFilter, AlertTriangle, BarChart3, ShieldCheck, Globe, Settings, HelpCircle } from 'lucide-react';
import { Language, AppState } from '../types';
import { TRANSLATIONS } from '../constants';

interface NavProps {
  state: AppState;
  onSetView: (view: AppState['view']) => void;
  onSetLang: (lang: Language) => void;
  onOpenReport: () => void;
  onOpenLayers: () => void;
  isLayersOpen: boolean;
}

export const Navigation: React.FC<NavProps> = ({ state, onSetView, onSetLang, onOpenReport, onOpenLayers, isLayersOpen }) => {
  const t = TRANSLATIONS[state.language];
  const languages = Object.values(Language);
  const activeLanguageIndex = languages.indexOf(state.language);
  const nextLanguage = languages[(activeLanguageIndex + 1) % languages.length];

  const NavItem = ({ icon: Icon, label, id, onClick, color = "text-slate-400" }: any) => {
    const isActive = id === 'layers' ? isLayersOpen : state.view === id && !onClick;
    return (
      <button
        onClick={() => onClick ? onClick() : onSetView(id)}
        className={`group relative flex items-center w-full h-10 transition-all duration-150 ${
          isActive 
            ? 'bg-blue-600/10 text-blue-400' 
            : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-sm" />
        )}
        <div className="flex items-center justify-center min-w-[56px]">
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-500' : color} />
        </div>
        <span className="pointer-events-none absolute left-14 z-[5001] whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 shadow-xl transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100">
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-14 flex-col bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-[4000] shadow-2xl">
        {/* Brand Area */}
        <div className="group relative flex h-14 items-center justify-center border-b border-slate-800/50">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <div className="pointer-events-none absolute left-14 z-[5001] whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-1 opacity-0 shadow-xl transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white">{t.appName}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest leading-none text-slate-500">CORE v4.2</div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 py-4 flex flex-col gap-1">
          <NavItem icon={Map} label={t.map} id="map" />
          <NavItem icon={AlertTriangle} label={t.reports} id="reports" />
          <NavItem icon={BarChart3} label={t.stats} id="stats" />
          <NavItem icon={ListFilter} label={t.layers} id="layers" onClick={onOpenLayers} />
          
          <div className="my-2 border-t border-slate-800/30 mx-2" />
          
          <NavItem 
            icon={AlertTriangle} 
            label={t.reportIncident} 
            onClick={onOpenReport} 
            color="text-red-500"
          />
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-slate-800/50 bg-slate-900/50">
           <div className="py-2">
             <NavItem
               icon={Globe}
               label={`${t.activeLanguage}: ${state.language.toUpperCase()}`}
               onClick={() => onSetLang(nextLanguage)}
             />
             <NavItem icon={Settings} label={t.system} onClick={() => {}} />
             <NavItem icon={HelpCircle} label={t.support} onClick={() => {}} />
           </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - FIXED: High Z-Index, Grid Layout for equal width icons */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 grid grid-cols-5 items-center p-2 pb-[max(1rem,env(safe-area-inset-bottom))] z-[5000] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <button 
          onClick={() => onSetView('map')} 
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${state.view === 'map' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <Map size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center px-1">{t.map}</span>
        </button>
        <button 
          onClick={() => onSetView('reports')} 
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${state.view === 'reports' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <AlertTriangle size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center px-1">{t.reports}</span>
        </button>
        
        {/* Action Button Container - Maintains its center column slot */}
        <div className="flex justify-center w-full">
          <button 
            onClick={onOpenReport} 
            className="bg-red-600 w-14 h-14 rounded-full -mt-10 shadow-2xl text-white border-4 border-slate-900 flex items-center justify-center active:scale-90 transition-transform"
          >
            <AlertTriangle size={26} fill="currentColor" />
          </button>
        </div>

        <button 
          onClick={() => onSetView('stats')} 
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${state.view === 'stats' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <BarChart3 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center px-1">{t.stats}</span>
        </button>
        <button 
          onClick={onOpenLayers} 
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${isLayersOpen ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <ListFilter size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center px-1">{t.layers}</span>
        </button>
      </nav>
    </>
  );
};
