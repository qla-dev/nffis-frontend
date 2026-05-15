import React from 'react';
import { AnyStation } from '../../AWSFBiHData';
import { RsStation } from '../../AWSRsData';

interface AWSHoverCardProps {
  station: AnyStation | RsStation;
}

function row(label: string, value: string | number, unit: string, colorClass: string) {
  return (
    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex flex-col">
      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">{label}</span>
      <span className={`font-mono font-bold text-sm ${colorClass}`}>{value} {unit}</span>
    </div>
  );
}

export const AWSHoverCard: React.FC<AWSHoverCardProps> = ({ station }) => {
  const name = 'city' in station ? station.city : station.name;
  const typeLabel = station.type === 'precipitation' ? 'Precipitation' :
                    station.type === 'agro' ? 'Agro' :
                    station.type === 'air_quality' ? 'Air Quality' : 'Meteo';

  // pick the accent color by type
  const accentColor = station.type === 'agro' ? '#eab308' :
                      station.type === 'precipitation' ? '#06b6d4' :
                      station.type === 'air_quality' ? '#a855f7' :
                      '#10b981';

  const windSpeedMs = ('windSpeedMs' in station) ? station.windSpeedMs : null;
  const windDirLabel = ('windDir' in station && typeof station.windDir === 'string') ? station.windDir :
                       ('windDir' in station && typeof station.windDir === 'number' && station.windDir !== null) ? `${station.windDir}°` : null;

  const pressure = ('pressureHpa' in station) ? station.pressureHpa : null;
  const precipMm = ('precipMm' in station) ? station.precipMm : null;

  return (
    <div className="bg-slate-950/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700 p-4 min-w-[220px]"
         style={{ borderTopColor: accentColor, borderTopWidth: 2 }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-black text-white text-sm leading-tight truncate max-w-[160px]">{name}</h3>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-3 pb-2 border-b border-slate-800"
           style={{ color: accentColor }}>
        {typeLabel} Station • FHMZ/RHMZ
      </div>

      <div className="grid grid-cols-2 gap-2">
        {station.tempC !== null && row('Temperature', station.tempC, '°C', 'text-emerald-400')}
        {station.humidityPct !== null && row('Humidity', station.humidityPct, '%', 'text-blue-400')}
        {pressure !== null && row('Pressure', pressure, 'hPa', 'text-slate-300')}
        {precipMm !== null && row('Precip.', precipMm, 'mm', 'text-cyan-400')}
        {windSpeedMs !== null && (
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex flex-col col-span-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Wind</span>
            <span className="font-mono font-bold text-sm text-slate-300">
              {windSpeedMs} m/s {windDirLabel ? `(${windDirLabel})` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
