
import React from 'react';
import { Activity, ShieldAlert, Trees } from 'lucide-react';
import { ForestRegion, Language } from '../../types';
import { REGION_STYLES, TRANSLATIONS } from '../../constants';

interface ForestHoverCardProps {
  forest: ForestRegion;
  language: Language;
}

export const ForestHoverCard: React.FC<ForestHoverCardProps> = ({ forest, language }) => {
  const style = REGION_STYLES[forest.type];
  const t = TRANSLATIONS[language];

  // Determine risk color
  const riskColor = forest.riskScore > 0.7 ? 'text-red-500' : forest.riskScore > 0.4 ? 'text-orange-500' : 'text-emerald-500';
  const RiskIcon = forest.riskScore > 0.7 ? ShieldAlert : Activity;

  return (
    <div className="w-64 bg-slate-950/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="h-1 w-full" style={{ backgroundColor: style.color }} />
      
      <div className="p-4">
        {/* Title Section */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-bold text-white leading-tight mb-1">{forest.name}</h4>
            <div className="flex items-center gap-1.5">
               <Trees size={12} className={riskColor} />
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.regionTypes[forest.type]}</span>
            </div>
          </div>
          <div className={`flex flex-col items-end ${riskColor}`}>
             <RiskIcon size={16} />
             <span className="text-[10px] font-black">{Math.round(forest.riskScore * 100)}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <span className="block text-[9px] text-slate-500 uppercase font-bold">{t.dashboard.area}</span>
              <span className="block text-xs font-mono text-slate-300">{forest.area.toLocaleString()} ha</span>
           </div>
           <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <span className="block text-[9px] text-slate-500 uppercase font-bold">{t.dashboard.coordinates}</span>
              <span className="block text-[9px] font-mono text-slate-300 truncate">
                {forest.coordinates[0].toFixed(2)}, {forest.coordinates[1].toFixed(2)}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};
