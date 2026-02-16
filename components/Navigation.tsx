import React, { useState } from 'react';
import { Map, ListFilter, AlertTriangle, BarChart3, Menu, ShieldCheck, ChevronRight, Globe, Settings, HelpCircle } from 'lucide-react';
import { Language, AppState } from '../types';
import { TRANSLATIONS } from '../constants';

interface NavProps {
  state: AppState;
  onSetView: (view: AppState['view']) => void;
  onSetLang: (lang: Language) => void;
  onOpenReport: () => void;
}

export const Navigation: React.FC<NavProps> = ({ state, onSetView, onSetLang, onOpenReport }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = TRANSLATIONS[state.language];

  const NavItem = ({ icon: Icon, label, id, onClick, color = "text-slate-400" }: any) => {
    const isActive = state.view === id && !onClick;
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
        <span className={`text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
        }`}>
          {label}
        </span>
        {!isExpanded && (
          <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[10px] rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] shadow-xl whitespace-nowrap font-bold uppercase tracking-wider">
            {label}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-[4000] transition-all duration-300 ease-in-out shadow-2xl ${
          isExpanded ? 'w-56' : 'w-14'
        }`}
      >
        {/* Brand Area */}
        <div className="h-14 flex items-center border-b border-slate-800/50 px-3 overflow-hidden">
          <div className="min-w-[32px] h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldCheck className="text-white" size={18} />
          </div>
          <div className={`ml-3 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="font-bold text-sm tracking-tight text-white uppercase">{t.appName}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">CORE v4.2</p>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 py-4 flex flex-col gap-1">
          <NavItem icon={Map} label={t.map} id="map" />
          <NavItem icon={AlertTriangle} label={t.reports} id="reports" />
          <NavItem icon={BarChart3} label={t.stats} id="stats" />
          <NavItem icon={ListFilter} label={t.layers} id="layers" />
          
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
             <NavItem icon={Settings} label={t.system} onClick={() => {}} />
             <NavItem icon={HelpCircle} label={t.support} onClick={() => {}} />
           </div>
           <div className={`flex flex-col gap-1 p-2 bg-slate-950/50 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
              <div className="flex gap-1">
                {Object.values(Language).map((lang) => (
                  <button 
                    key={lang}
                    onClick={() => onSetLang(lang)}
                    className={`flex-1 py-1 text-[10px] rounded font-bold transition-colors ${
                      state.language === lang 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
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
          onClick={() => onSetView('layers')} 
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${state.view === 'layers' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <ListFilter size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center px-1">{t.layers}</span>
        </button>
      </nav>
    </>
  );
};