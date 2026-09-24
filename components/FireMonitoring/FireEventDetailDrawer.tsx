import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trees, UserCheck, X } from 'lucide-react';
import { createFirePerimeter, fetchBurnSeverity, fetchFireDetails, fetchFireImpacts, fetchFirePerimeters, fetchFireRecovery, fetchFireScenarios, requestBurnSeverity, reviewBurnSeverity, reviewFirePerimeter, runFireScenario, updateFireIncidentCase, type BurnSeverityAssessment, type FireEventDetails, type FirePerimeter, type FirePriority, type FireScenarioRun, type FireWorkflowStatus } from '../../services/fireMonitoringService';

const NEXT: Record<FireWorkflowStatus, FireWorkflowStatus[]> = {
  new: ['acknowledged', 'false_positive'], acknowledged: ['verified', 'false_positive'],
  verified: ['assigned', 'contained', 'false_positive'], assigned: ['contained', 'false_positive'],
  contained: ['closed', 'assigned'], closed: ['assigned'], false_positive: ['new'],
};

export function FireEventDetailDrawer({ eventId, canManage, canViewIntelligence, canRunIntelligence, canReviewIntelligence, isDarkMode, onClose, onUpdated }: { eventId: number; canManage: boolean; canViewIntelligence: boolean; canRunIntelligence: boolean; canReviewIntelligence: boolean; isDarkMode: boolean; onClose: () => void; onUpdated: () => void }) {
  const [event, setEvent] = useState<FireEventDetails | null>(null);
  const [status, setStatus] = useState<FireWorkflowStatus>('new');
  const [priority, setPriority] = useState<FirePriority>('normal');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'operations' | 'intelligence'>('operations');

  const load = () => {
    const controller = new AbortController();
    fetchFireDetails(eventId, controller.signal).then(({ data }) => {
      setEvent(data); setStatus(data.incident_case?.workflow_status || 'new'); setPriority(data.incident_case?.priority || 'normal'); setError('');
    }).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); });
    return () => controller.abort();
  };
  useEffect(load, [eventId]);
  const options = useMemo(() => [status, ...NEXT[status]], [status]);

  const save = async (assignToMe = false) => {
    setSaving(true); setError('');
    try {
      await updateFireIncidentCase(eventId, { workflow_status: status, priority, note: note.trim() || undefined, assign_to_me: assignToMe || undefined });
      setNote(''); load(); onUpdated();
    } catch (reason) { setError((reason as Error).message); } finally { setSaving(false); }
  };

  const panel = isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900';
  return <div className="fixed inset-0 z-[6000] flex justify-end bg-slate-950/55" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <aside className={`h-full w-full max-w-xl overflow-y-auto border-l shadow-2xl ${panel}`} aria-label="Fire incident details">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/40 bg-inherit p-5">
        <div><div className="text-xs font-bold uppercase tracking-widest text-orange-500">Operational case</div><h2 className="mt-1 text-xl font-black">{event?.external_id || 'Loading event...'}</h2></div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-500/10" aria-label="Close"><X /></button>
      </header>
      {error && <div className="m-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
      {!event ? <div className="flex p-8 text-slate-500"><Loader2 className="mr-2 animate-spin" /> Loading...</div> : <div className="space-y-6 p-5">
        {canViewIntelligence && <div className="grid grid-cols-2 rounded-xl bg-slate-500/10 p-1"><button type="button" onClick={() => setTab('operations')} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === 'operations' ? 'bg-blue-600 text-white' : ''}`}>Operations</button><button type="button" onClick={() => setTab('intelligence')} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === 'intelligence' ? 'bg-orange-600 text-white' : ''}`}>Fire Intelligence</button></div>}
        {tab === 'operations' && <>
        <section className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Location" value={[event.municipality, event.canton, event.entity].filter(Boolean).join(', ') || 'Unresolved'} />
          <Info label="Coordinates" value={`${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`} />
          <Info label="Confidence" value={event.confidence_level.replaceAll('_', ' ')} />
          <Info label="Peak / latest FRP" value={`${event.peak_frp ?? '-'} / ${event.latest_frp ?? '-'} MW`} />
          <Info label="Nearest road" value={event.nearest_road?.distance_m != null ? `${Math.round(event.nearest_road.distance_m)} m` : 'Unavailable'} />
          <Info label="Water source" value={event.nearest_water_source?.distance_m != null ? `${Math.round(event.nearest_water_source.distance_m)} m` : 'Unavailable'} />
          <Info label="Forest / protected area" value={[event.forest_type, event.protected_area].filter(Boolean).join(' / ') || 'Unavailable'} />
          <Info label="Sources" value={(event.sources || []).join(', ') || 'Unknown'} />
        </section>

        <InitialExposure exposure={event.initial_exposure} />

        <section className="rounded-xl border border-slate-700/40 p-4">
          <h3 className="mb-4 flex items-center gap-2 font-bold"><UserCheck size={18} /> Response workflow</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-500">Status<select disabled={!canManage || saving} value={status} onChange={e => setStatus(e.target.value as FireWorkflowStatus)} className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2 text-sm text-inherit">{options.map(value => <option className="bg-slate-900" key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-500">Priority<select disabled={!canManage || saving} value={priority} onChange={e => setPriority(e.target.value as FirePriority)} className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2 text-sm text-inherit">{['low', 'normal', 'high', 'critical'].map(value => <option className="bg-slate-900" key={value}>{value}</option>)}</select></label>
          </div>
          <label className="mt-3 block text-xs font-bold text-slate-500">Operational note<textarea disabled={!canManage || saving} value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-600 bg-transparent p-2 text-sm text-inherit" placeholder="Verification, resources, access or command note" /></label>
          {canManage && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void save(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline" size={16} />Save update</button><button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-bold text-blue-500">Assign to me</button></div>}
          <div className="mt-3 text-xs text-slate-500">Assigned to: {event.incident_case?.assigned_user_name || 'Unassigned'}</div>
        </section>

        <Timeline title="Operational audit" items={(event.incident_case?.actions || []).map(action => ({ id: `case-${action.id}`, title: `${action.user_name || 'System'}: ${(action.to_status || action.action).replaceAll('_', ' ')}`, detail: action.note, at: action.created_at }))} />
        <Timeline title="Satellite lifecycle" items={(event.transitions || []).map((item, index) => ({ id: `transition-${index}`, title: String(item.kind || 'transition').replaceAll('_', ' '), detail: String(item.detail || ''), at: String(item.occurred_at || '') }))} />
        <Timeline title={`Linked field reports (${event.reports?.length || 0})`} items={(event.reports || []).map((item, index) => ({ id: `report-${String(item.id || index)}`, title: `${String(item.locality || 'Field report')} · ${String((item.user as { name?: string } | undefined)?.name || 'Reporter')}`, detail: String(item.description || ''), at: String(item.reported_at || item.created_at || '') }))} />
        <section><h3 className="mb-2 font-bold">Observations ({event.observations.length})</h3><div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700/40">{event.observations.map((item, index) => <div key={String(item.id || index)} className="flex justify-between border-b border-slate-700/30 p-3 text-xs"><span>{String(item.source || '')} · {String(item.sensor || '')}</span><span>{String(item.detected_at || '')} · {String(item.frp ?? '-')} MW</span></div>)}</div></section>
        </>}
        {tab === 'intelligence' && <FireIntelligenceTab event={event} canRun={canRunIntelligence} canReview={canReviewIntelligence} reload={load} />}
      </div>}
    </aside>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-500/5 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 break-words font-semibold">{value}</div></div>; }
function InitialExposure({ exposure }: { exposure: FireEventDetails['initial_exposure'] }) {
  if (!exposure) return <section className="rounded-xl border border-slate-700/40 p-4"><h3 className="flex items-center gap-2 font-bold"><Trees size={18} /> Potential exposure</h3><p className="mt-2 text-sm text-slate-500">Assessment pending. Run the fire GIS enrichment backfill for older events.</p></section>;
  const radius = `${(exposure.radius_m / 1000).toFixed(1)} km`;
  const buildings = exposure.mapped_buildings;
  return <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="flex items-center gap-2 font-bold"><AlertTriangle className="text-amber-500" size={18} /> Potential exposure</h3><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">Preliminary {radius} screening radius</div></div><time className="text-[10px] text-slate-500">{new Date(exposure.calculated_at).toLocaleString()}</time></div>
    <p className="mt-3 text-sm font-semibold leading-6">{exposure.summary}</p>
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <ExposureFact label="Land cover" value={exposure.land_cover?.label || 'Unavailable'} color={exposure.land_cover?.color} />
      <ExposureFact label="Forest composition" value={exposure.forest_composition?.label || 'Unavailable'} />
      <ExposureFact label={`Mapped buildings ≤ ${radius}`} value={buildings ? `${buildings.count_capped ? 'At least ' : ''}${buildings.count}` : 'Unavailable'} />
      <ExposureFact label="Protected areas" value={String(exposure.protected_areas?.length || 0)} />
    </div>
    {!!exposure.potentially_exposed?.length && <div className="mt-4"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Potentially exposed</div><ul className="mt-2 space-y-1.5 text-sm">{exposure.potentially_exposed.map((item, index) => <li key={`${item.kind}-${index}`} className="flex gap-2"><span className="text-amber-500">•</span><span>{item.label}</span></li>)}</ul></div>}
    {!!exposure.warnings?.length && <div className="mt-4 space-y-1 border-t border-amber-500/20 pt-3 text-[11px] leading-5 text-slate-500">{exposure.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>}
  </section>;
}
function ExposureFact({ label, value, color }: { label: string; value: string; color?: string }) { return <div className="rounded-lg bg-slate-500/5 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 flex items-center gap-2 font-semibold">{color && <span className="h-3 w-3 shrink-0 rounded-sm border border-white/20" style={{ backgroundColor: color }} />}{value}</div></div>; }
function Timeline({ title, items }: { title: string; items: Array<{ id: string; title: string; detail?: string | null; at: string }> }) { return <section><h3 className="mb-2 font-bold">{title}</h3><div className="space-y-2">{items.length ? items.map(item => <div key={item.id} className="border-l-2 border-blue-500 pl-3 text-sm"><div className="font-semibold capitalize">{item.title}</div>{item.detail && <div className="text-slate-500">{item.detail}</div>}<time className="text-xs text-slate-500">{item.at ? new Date(item.at).toLocaleString() : ''}</time></div>) : <div className="text-sm text-slate-500">No activity recorded.</div>}</div></section>; }

function FireIntelligenceTab({ event, canRun, canReview, reload }: { event: FireEventDetails; canRun: boolean; canReview: boolean; reload: () => () => void }) {
  const [geometry, setGeometry] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [pre, setPre] = useState<File>(); const [post, setPost] = useState<File>(); const [impacts, setImpacts] = useState<Array<Record<string, unknown>>>([]); const [recovery, setRecovery] = useState<Array<Record<string, unknown>>>([]); const [perimeters, setPerimeters] = useState<FirePerimeter[]>([]); const [assessments, setAssessments] = useState<BurnSeverityAssessment[]>([]); const [scenarios, setScenarios] = useState<FireScenarioRun[]>([]);
  const nationalBoundsFallback = event.longitude >= 15.70 && event.longitude <= 19.70 && event.latitude >= 42.50 && event.latitude <= 45.35;
  const inBih = event.fire_intelligence?.eligible ?? nationalBoundsFallback;
  const refreshIntelligence = async (signal?: AbortSignal) => { const [i, r, p, a, s] = await Promise.all([fetchFireImpacts(event.id, signal), fetchFireRecovery(event.id, signal), fetchFirePerimeters(event.id, signal), fetchBurnSeverity(event.id, signal), fetchFireScenarios(event.id, signal)]); setImpacts(i.data); setRecovery(r.data); setPerimeters(p.data); setAssessments(a.data); setScenarios(s.data); };
  useEffect(() => { if (!inBih) return; const c = new AbortController(); void refreshIntelligence(c.signal).catch(() => {}); return () => c.abort(); }, [event.id, inBih]);
  if (!inBih) return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">{event.fire_intelligence?.reason || 'Fire Intelligence is available only within Bosnia and Herzegovina.'}</div>;
  const run = async (action: () => Promise<unknown>, ok: string) => { setBusy(true); setMessage(''); try { await action(); setMessage(ok); reload(); await refreshIntelligence(); } catch (reason) { setMessage((reason as Error).message); } finally { setBusy(false); } };
  return <div className="space-y-5">
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm"><strong>Advisory intelligence.</strong> These products never change incident status, dispatch resources, or issue public warnings.</div>
    <section><h3 className="mb-2 font-bold">Pyretechnics spread scenarios</h3><p className="mb-3 text-xs text-slate-500">The test run uses the actual Pyretechnics engine with the national BiH fuel COG, DEM-derived slope/aspect and the nearest current forecast. Institutional approval may be bypassed only in labelled test mode.</p>{scenarios.length ? <div className="space-y-2">{scenarios.map(scenario => <div key={scenario.id} className="rounded-lg border border-slate-500/30 p-3 text-sm"><div className="flex justify-between gap-2"><strong>Scenario {scenario.id} · Pyretechnics</strong><span>{scenario.status.replaceAll('_', ' ')}</span></div><div className="mt-1 text-xs text-slate-500">{scenario.settings.test_mode ? 'TEST / NON-OPERATIONAL' : 'ADVISORY'} · up to {scenario.settings.duration_hours || 12} hours</div>{scenario.outputs?.metrics?.horizon_area_ha && <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">{Object.entries(scenario.outputs.metrics.horizon_area_ha).map(([hour, area]) => <div key={hour} className="rounded bg-slate-500/10 p-2"><strong>{hour} h</strong><div>{Number(area).toFixed(1)} ha</div></div>)}</div>}{scenario.outputs?.warnings?.map(warning => <div key={warning} className="mt-1 text-xs text-amber-500">{warning}</div>)}{scenario.artifact_urls && <div className="mt-2 flex gap-3 text-xs"><a className="font-bold text-blue-500 hover:underline" href={`/api/fires/${event.id}/scenarios/${scenario.id}/artifact/arrival`}>Arrival-time COG</a><a className="font-bold text-blue-500 hover:underline" href={`/api/fires/${event.id}/scenarios/${scenario.id}/artifact/perimeters`}>Perimeters GeoJSON</a></div>}</div>)}</div> : <p className="text-sm text-slate-500">No Pyretechnics scenarios yet.</p>}{canRun && <button disabled={busy} onClick={() => void run(() => runFireScenario(event.id, true), 'Pyretechnics test scenario queued. Refresh after the intelligence worker completes.')} className="mt-3 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Run Pyretechnics test scenario</button>}</section>
    <section><h3 className="mb-2 font-bold">Verified perimeter and version history</h3>{perimeters.length ? <div className="space-y-2">{perimeters.map(p => <div key={p.id} className="rounded-lg border border-slate-500/30 p-3 text-sm"><div className="flex justify-between"><strong>Version {p.version} · {p.source}</strong><span>{p.status.replaceAll('_', ' ')}</span></div><div className="text-xs text-slate-500">Observed {new Date(p.observed_at).toLocaleString()}</div>{canReview && p.status === 'review_required' && <div className="mt-2 flex gap-2"><button disabled={busy} onClick={() => void run(() => reviewFirePerimeter(event.id, p.id, 'approved', 'Reviewed in event intelligence workflow.'), 'Perimeter approved.')} className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Approve</button><button disabled={busy} onClick={() => void run(() => reviewFirePerimeter(event.id, p.id, 'rejected', 'Rejected in event intelligence workflow.'), 'Perimeter rejected.')} className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">Reject</button></div>}</div>)}</div> : <p className="text-sm text-slate-500">No perimeter versions.</p>}
      {canRun && <div className="mt-3"><textarea value={geometry} onChange={e => setGeometry(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-600 bg-transparent p-2 font-mono text-xs" placeholder='Paste GeoJSON Polygon or MultiPolygon'/><button disabled={busy || !geometry.trim()} onClick={() => void run(async () => { const parsed = JSON.parse(geometry) as GeoJSON.Polygon | GeoJSON.MultiPolygon; await createFirePerimeter(event.id, { geometry: parsed, source: 'operator', observed_at: new Date().toISOString() }); }, 'Perimeter saved for review.')} className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Add perimeter version</button></div>}
    </section>
    <section><h3 className="mb-2 font-bold">Sentinel-2 burn severity</h3>{assessments.length === 0 && <p className="text-sm text-slate-500">No assessments.</p>}{assessments.map(a => <div key={a.id} className="mb-2 rounded-lg border border-slate-500/30 p-3 text-sm"><strong>Assessment {a.id}</strong> · {a.status.replaceAll('_', ' ')}<div className="text-xs text-slate-500">Usable imagery: {a.quality_metrics?.usable_coverage == null ? 'pending' : `${(a.quality_metrics.usable_coverage * 100).toFixed(0)}%`}</div>{a.warnings?.map(w => <div key={w} className="mt-1 text-xs text-amber-500">{w}</div>)}{canReview && a.status === 'review_required' && <div className="mt-2 flex gap-2"><button disabled={busy} onClick={() => void run(() => reviewBurnSeverity(event.id, a.id, 'approved', 'Reviewed against imagery QA.'), 'Assessment approved.')} className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Approve</button><button disabled={busy} onClick={() => void run(() => reviewBurnSeverity(event.id, a.id, 'rejected', 'Imagery QA rejected.'), 'Assessment rejected.')} className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">Reject</button></div>}</div>)}
      {canRun && <div className="grid gap-2 rounded-lg bg-slate-500/5 p-3"><div className="text-xs text-slate-500">Optional approved multi-band GeoTIFF fallback. Otherwise the configured Copernicus STAC acquisition is used.</div><input type="file" accept=".tif,.tiff" onChange={e => setPre(e.target.files?.[0])}/><input type="file" accept=".tif,.tiff" onChange={e => setPost(e.target.files?.[0])}/><button disabled={busy || !perimeters.some(p => p.status === 'approved')} onClick={() => void run(() => requestBurnSeverity(event.id, pre, post), 'Severity assessment queued.')} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Run severity assessment</button></div>}
    </section>
    <section className="grid grid-cols-2 gap-3 text-sm"><Info label="Impact records" value={String(impacts.length)}/><Info label="Recovery observations" value={String(recovery.length)}/></section>
    {message && <div className="rounded-lg bg-slate-500/10 p-3 text-sm">{message}</div>}
  </div>;
}
