import React from 'react';
import { MapPin } from 'lucide-react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import type { FirefighterStation } from '../../firefighterData';
import { FIREFIGHTER_STATION_STYLE } from './firefighterStationUi';

interface FirefighterHoverCardProps {
  station: FirefighterStation;
  language: Language;
  onOpenDetails: () => void;
}

export const FirefighterHoverCard: React.FC<FirefighterHoverCardProps> = ({
  station,
  language,
  onOpenDetails,
}) => {
  const t = TRANSLATIONS[language];
  const fs = t.firefighterStation;
  const style = FIREFIGHTER_STATION_STYLE[station.stationType];

  return (
    <div
      className="w-64 bg-slate-950/90 backdrop-blur-xl border rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden font-sans"
      style={{ borderColor: style.color }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-1 w-full" style={{ backgroundColor: style.color }} />

      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-sm font-bold text-white leading-tight mb-1">{station.name}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {fs.types[station.stationType]} • {station.municipality}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] text-slate-500 uppercase font-bold">{fs.memberCount}</span>
            <span className="block text-xs font-mono text-slate-300">{station.capacity}</span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] text-slate-500 uppercase font-bold">{fs.vehicleCount}</span>
            <span className="block text-xs font-mono text-slate-300">{station.vehicleCount ?? '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <MapPin size={12} className="shrink-0" style={{ color: style.color }} />
          <span className="truncate">{station.address}</span>
        </div>

      </div>
    </div>
  );
};
