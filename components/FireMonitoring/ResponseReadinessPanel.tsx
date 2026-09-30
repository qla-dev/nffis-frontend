import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, Droplets, Loader2, MapPinned, ShieldAlert, Truck } from 'lucide-react';
import { createFireResponsePlan, fetchFireResponsePlan, reviewFireResponsePlan, type FireResponsePlan, type FireResponsePlanPayload } from '../../services/fireMonitoringService';

export function ResponseReadinessPanel({ eventId, canManage }: { eventId: number; canManage: boolean }) {
  const [snapshot, setSnapshot] = useState<FireResponsePlan | null>(null);
  const [preview, setPreview] = useState<FireResponsePlanPayload | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((signal?: AbortSignal) => fetchFireResponsePlan(eventId, signal).then(response => {
    setSnapshot(response.data); setPreview(response.preview); setError('');
  }), [eventId]);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); }); return () => controller.abort(); }, [load]);

  const save = async () => {
    setBusy(true); setError('');
    try { const response = await createFireResponsePlan(eventId); setSnapshot(response.data); }
    catch (reason) { setError((reason as Error).message); } finally { setBusy(false); }
  };
  const review = async (status: 'approved' | 'rejected') => {
    if (!snapshot || !note.trim()) return;
    setBusy(true); setError('');
    try { const response = await reviewFireResponsePlan(eventId, snapshot.id, status, note.trim()); setSnapshot(response.data); setNote(''); }
    catch (reason) { setError((reason as Error).message); } finally { setBusy(false); }
  };

  const plan = snapshot?.plan ?? preview;
  if (!plan) return <section className="rounded-xl border border-slate-700/40 p-4"><Loader2 className="mr-2 inline animate-spin" size={16} /> Building response-readiness preview...</section>;

  return <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="flex items-center gap-2 font-bold"><ShieldAlert className="text-blue-500" size={18} /> Response readiness</h3><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">{snapshot ? `Version ${snapshot.version} · ${snapshot.status}` : 'Live preview · not saved'}</div></div>
      <time className="text-[10px] text-slate-500">{new Date(plan.generated_at).toLocaleString()}</time>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">{plan.decision_support_notice}</p>
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <Fact icon={<MapPinned size={15} />} label="Mapped road" value={plan.access.nearest_road?.distance_m != null ? `${Math.round(plan.access.nearest_road.distance_m)} m` : 'Unavailable'} />
      <Fact icon={<Droplets size={15} />} label="Water source" value={plan.access.nearest_water_source?.distance_m != null ? `${Math.round(plan.access.nearest_water_source.distance_m)} m` : 'Unavailable'} />
    </div>
    <div className="mt-4"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ranked stations</div>{plan.ranked_stations.length ? <div className="mt-2 space-y-2">{plan.ranked_stations.slice(0, 3).map(station => <div key={station.id} className="rounded-lg bg-slate-500/5 p-3 text-sm"><div className="flex justify-between gap-3"><strong className="flex items-center gap-2"><Truck size={14} />{station.name}</strong><span>{station.straight_line_distance_km.toFixed(1)} km</span></div><div className="mt-1 text-xs text-slate-500">{station.municipality} · capacity {station.capacity || 'unknown'} ({station.capacity_source}) · {station.verification_status}</div></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No verified station coordinates available.</p>}</div>
    {!!plan.staging_candidates.length && <div className="mt-4 rounded-lg border border-amber-500/20 p-3 text-sm"><strong>Staging screening point</strong><div className="mt-1 text-xs text-slate-500">{plan.staging_candidates[0].basis} {plan.staging_candidates[0].limitations}</div></div>}
    {!!plan.warnings.length && <ul className="mt-4 space-y-1 text-xs text-amber-500">{plan.warnings.map(warning => <li key={warning}>• {warning}</li>)}</ul>}
    {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
    {canManage && <div className="mt-4 border-t border-blue-500/20 pt-3">{!snapshot || snapshot.status !== 'draft' ? <button disabled={busy} onClick={() => void save()} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Save new plan snapshot</button> : <><textarea value={note} onChange={event => setNote(event.target.value)} rows={2} placeholder="Required review evidence or operational note" className="w-full rounded-lg border border-slate-600 bg-transparent p-2 text-sm"/><div className="mt-2 flex gap-2"><button disabled={busy || !note.trim()} onClick={() => void review('approved')} className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline" size={14}/>Approve</button><button disabled={busy || !note.trim()} onClick={() => void review('rejected')} className="rounded bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject</button></div></>}</div>}
  </section>;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-lg bg-slate-500/5 p-3"><div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{icon}{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
