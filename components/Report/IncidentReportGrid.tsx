import { Flame, Waves } from 'lucide-react';
import { IncidentType, type IncidentReport } from '../../types';

export function IncidentReportGrid({ incidents, dark, fireLabel, floodLabel }: { incidents: IncidentReport[]; dark: boolean; fireLabel: string; floodLabel: string }) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{incidents.map(incident => {
    const fire = incident.type === IncidentType.FIRE;
    return <article key={incident.id} className={`group overflow-hidden rounded-xl border shadow-xl transition-all duration-300 ${dark ? 'border-slate-800 bg-slate-900 hover:border-blue-500/50' : 'border-slate-200 bg-white hover:border-blue-500/50'}`}><div className={`h-1.5 ${fire ? 'bg-red-600' : 'bg-blue-600'}`} /><div className="p-5"><div className="mb-4 flex items-start justify-between"><div className={`rounded-lg p-2 ${fire ? 'bg-red-600/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}>{fire ? <Flame size={20} /> : <Waves size={20} />}</div><strong className={`rounded border px-2 py-0.5 text-[10px] ${incident.urgency === 'high' ? 'border-red-500/50 bg-red-500/5 text-red-500' : dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>{incident.urgency.toUpperCase()}</strong></div><h3 className={`mb-2 text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{fire ? fireLabel : floodLabel}</h3><p className={`mb-6 line-clamp-3 text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>“{incident.description}”</p></div></article>;
  })}</div>;
}
