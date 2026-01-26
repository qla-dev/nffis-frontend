
import React from 'react';
import { Map, ListFilter, AlertTriangle, BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { Language, AppState } from '../types';
import { TRANSLATIONS } from '../constants';

interface NavProps {
  state: AppState;
  onSetView: (view: AppState['view']) => void;
  onSetLang: (lang: Language) => void;
  onOpenReport: () => void;
}

export const Navigation: React.FC<NavProps> = ({ state, onSetView, onSetLang, onOpenReport }) => {
  const t = TRANSLATIONS[state.language];

  const NavItem = ({ icon: Icon, label, id, onClick }: any) => (
    <button
      onClick={() => onClick ? onClick() : onSetView(id)}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-xl transition-all ${
        state.view === id && !onClick
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={22} />
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </button>
  );

  const cycleLanguage = () => {
    const langs = [Language.EN, Language.BS, Language.JA];
    const currentIndex = langs.indexOf(state.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    onSetLang(langs[nextIndex]);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen p-6 fixed left-0 top-0 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">{t.appName}</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mt-1">BiH Initiative</p>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <NavItem icon={Map} label={t.map} id="map" />
          <NavItem icon={ListFilter} label={t.layers} id="layers" />
          <NavItem icon={AlertTriangle} label={t.reports} id="reports" />
          <NavItem icon={BarChart3} label={t.stats} id="stats" />
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-800">
          <button
            onClick={onOpenReport}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all"
          >
            <AlertTriangle size={18} />
            {t.reportIncident}
          </button>

          <div className="flex gap-2">
            {[Language.EN, Language.BS, Language.JA].map((lang) => (
              <button 
                key={lang}
                onClick={() => onSetLang(lang)}
                className={`flex-1 py-1 text-[10px] rounded-lg border font-bold ${
                  state.language === lang 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around items-center p-2 pb-safe z-50">
        <NavItem icon={Map} label={t.map} id="map" />
        <NavItem icon={ListFilter} label={t.layers} id="layers" />
        <button 
          onClick={onOpenReport}
          className="bg-red-600 p-3 rounded-full -mt-8 shadow-xl shadow-red-900/40 text-white"
        >
          <AlertTriangle size={24} />
        </button>
        <NavItem icon={AlertTriangle} label={t.reports} id="reports" />
        <button 
          onClick={cycleLanguage}
          className="flex flex-col items-center gap-1 p-2 text-slate-400"
        >
          <Globe size={22} />
          <span className="text-[10px] font-bold">{state.language.toUpperCase()}</span>
        </button>
      </nav>
    </>
  );
};
