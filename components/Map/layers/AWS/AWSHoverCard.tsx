import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Check, Clock3, Edit3, Loader2, RotateCcw, X } from 'lucide-react';
import { AnyStation } from '../../../../AWSFBiHData';
import { RsStation } from '../../../../AWSRsData';
import {
  adjustAwsStation,
  fetchAwsStationHistory,
  type AwsStationAdjustment,
  type AwsStationHistoryEntry,
  type AwsStationSource,
  type AwsStationValues,
} from '../../../../services/awsStationService';

interface AWSHoverCardProps {
  station: AnyStation | RsStation;
  source: AwsStationSource;
  canAdjust: boolean;
  adjustment?: AwsStationAdjustment;
  onAdjusted: (adjustment: AwsStationAdjustment) => void;
}

const FIELD_META: Array<{ key: keyof AwsStationValues; label: string; unit: string; color: string; step?: string }> = [
  { key: 'tempC', label: 'Temperature', unit: '°C', color: 'text-emerald-400', step: '0.1' },
  { key: 'humidityPct', label: 'Humidity', unit: '%', color: 'text-blue-400', step: '0.1' },
  { key: 'pressureHpa', label: 'Pressure', unit: 'hPa', color: 'text-slate-300', step: '0.1' },
  { key: 'precipMm', label: 'Precipitation', unit: 'mm', color: 'text-cyan-400', step: '0.1' },
  { key: 'windSpeedMs', label: 'Wind speed', unit: 'm/s', color: 'text-violet-300', step: '0.1' },
  { key: 'windDir', label: 'Wind direction', unit: '', color: 'text-violet-300' },
];

function getStationName(station: AnyStation | RsStation): string {
  if ('city' in station) return station.city;
  if ('station' in station) return station.station;
  return station.name;
}

function getStationValues(station: AnyStation | RsStation): AwsStationValues {
  const record = station as unknown as Record<string, unknown>;
  return Object.fromEntries(FIELD_META.filter(({ key }) => key in record && record[key] !== null).map(({ key }) => [key, record[key]])) as AwsStationValues;
}

export const AWSHoverCard: React.FC<AWSHoverCardProps> = ({ station, source, canAdjust, adjustment, onAdjusted }) => {
  const name = getStationName(station);
  const typeLabel = station.type === 'precipitation' ? 'Precipitation' : station.type === 'agro' ? 'Agro' : station.type === 'air_quality' ? 'Air Quality' : 'Meteo';
  const accentColor = source === 'rs' ? '#818cf8' : station.type === 'agro' ? '#eab308' : station.type === 'precipitation' ? '#06b6d4' : station.type === 'air_quality' ? '#a855f7' : '#10b981';
  const visibleValues = useMemo(() => getStationValues(station), [station]);
  const visibleFields = FIELD_META.filter(({ key }) => key in visibleValues);
  const [mode, setMode] = useState<'view' | 'edit' | 'history'>('view');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AwsStationHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMode('view'); setError(null); }, [name, source, station.type]);

  useEffect(() => {
    if (!cardRef.current) return;
    L.DomEvent.disableClickPropagation(cardRef.current);
    L.DomEvent.disableScrollPropagation(cardRef.current);
  }, []);

  const beginEdit = () => {
    setDraft(Object.fromEntries(Object.entries(visibleValues).map(([key, value]) => [key, value == null ? '' : String(value)])));
    setError(null);
    setMode('edit');
  };

  const openHistory = async () => {
    setMode('history'); setIsLoadingHistory(true); setError(null);
    try { setHistory(await fetchAwsStationHistory(source, station.type, name)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Station history is unavailable.'); }
    finally { setIsLoadingHistory(false); }
  };

  const save = async () => {
    setIsSaving(true); setError(null);
    try {
      const values = Object.fromEntries(visibleFields.map(({ key }) => {
        const raw = draft[key] ?? '';
        if (key === 'windDir' && typeof visibleValues.windDir === 'string') return [key, raw.trim() || null];
        return [key, raw.trim() === '' ? null : Number(raw)];
      })) as AwsStationValues;
      onAdjusted(await adjustAwsStation(source, station.type, name, values, visibleValues));
      setMode('view');
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Station values could not be updated.'); }
    finally { setIsSaving(false); }
  };

  return (
    <div ref={cardRef} className="min-w-[260px] max-w-[340px] rounded-xl border border-slate-700 bg-slate-950/95 p-4 font-sans shadow-2xl backdrop-blur-xl" style={{ borderTopColor: accentColor, borderTopWidth: 2 }}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div><h3 className="max-w-[210px] truncate text-sm font-black leading-tight text-white">{name}</h3><div className="mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>{typeLabel} Station • FHMZ/RHMZ</div></div>
        {adjustment && <span title={`Adjusted ${new Date(adjustment.adjusted_at).toLocaleString()}`} className="rounded bg-amber-500/15 px-1.5 py-1 text-[8px] font-black uppercase text-amber-400">Adjusted</span>}
      </div>
      <div className="my-3 border-t border-slate-800" />

      {mode === 'history' ? (
        <div>
          <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-bold text-white"><Clock3 size={14} /> History</span><button type="button" onClick={() => setMode('view')} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={14} /></button></div>
          {isLoadingHistory ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-400" size={20} /></div> : history.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">No adjustments recorded yet.</p> : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">{history.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5"><div className="mb-1 flex justify-between gap-2 text-[9px] text-slate-500"><span>{entry.changed_by?.name ?? 'System'} · {entry.origin}</span><span>{new Date(entry.recorded_at).toLocaleString()}</span></div><div className="flex flex-wrap gap-1">{entry.changed_fields.map((field) => <span key={field} className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">{FIELD_META.find((item) => item.key === field)?.label ?? field}: {String(entry.previous_values?.[field] ?? '—')} → {String(entry.values[field] ?? '—')}</span>)}</div></div>)}</div>
          )}
          {error && <p role="alert" className="mt-2 text-[10px] text-red-400">{error}</p>}
        </div>
      ) : mode === 'edit' ? (
        <div>
          <div className="grid grid-cols-2 gap-2">{visibleFields.map((field) => <label key={field.key}><span className="mb-1 block text-[9px] font-bold uppercase text-slate-500">{field.label}</span><div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500"><input type={field.key === 'windDir' && typeof visibleValues.windDir === 'string' ? 'text' : 'number'} step={field.step ?? '1'} value={draft[field.key] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-xs text-white outline-none" />{field.unit && <span className="pr-2 text-[9px] text-slate-500">{field.unit}</span>}</div></label>)}</div>
          {error && <p role="alert" className="mt-2 text-[10px] text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2"><button type="button" onClick={() => setMode('view')} disabled={isSaving} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800"><RotateCcw size={12} /> Cancel</button><button type="button" onClick={save} disabled={isSaving} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-[10px] font-bold text-white hover:bg-blue-500 disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />} Save</button></div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-2">{visibleFields.map((field) => <div key={field.key} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/60 p-2"><span className="mb-1 text-[9px] font-bold uppercase text-slate-500">{field.label}</span><span className={`font-mono text-sm font-bold ${field.color}`}>{String(visibleValues[field.key])} {field.unit}</span></div>)}</div>
          {error && <p role="alert" className="mt-2 text-[10px] text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2"><button type="button" onClick={openHistory} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800"><Clock3 size={12} /> History</button>{canAdjust && <button type="button" onClick={beginEdit} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-[10px] font-bold text-white hover:bg-blue-500"><Edit3 size={12} /> Adjust</button>}</div>
        </div>
      )}
    </div>
  );
};
