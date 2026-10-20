import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileUp, Loader2, PenLine, Send, Undo2, XCircle } from 'lucide-react';
import { Language } from '../../types';
import {
  calculatePdrReport, createPdrReport, getPdrReport, previewPerimeter, reviewPdrReport, savePerimeter, submitPdrReport, updatePdrReport,
  type PdrJurisdiction, type PdrMetadata, type PdrPermissions, type PdrReport, type PerimeterPreview,
} from '../../services/pdrService';
import { formatNumber, pdrText } from '../../lib/pdr/i18n';
import { PerimeterMap, drawingToGeometry } from './PerimeterMap';
import { PdrResultsView } from './PdrResultsView';
import { StatusBadge } from './PdrReportList';
import { navigatePdr } from './pdrRoute';

interface Props { reportId: number | 'new'; step?: number; language: Language; isDarkMode: boolean }

const METADATA_GROUPS: { key: 'timing' | 'response' | 'casualties' | 'contact'; fields: { name: keyof PdrMetadata; type: 'datetime-local' | 'text' | 'number' | 'textarea' }[] }[] = [
  { key: 'timing', fields: [{ name: 'started_at', type: 'datetime-local' }, { name: 'detected_at', type: 'datetime-local' }, { name: 'contained_at', type: 'datetime-local' }, { name: 'municipality', type: 'text' }, { name: 'canton', type: 'text' }, { name: 'locality', type: 'text' }, { name: 'cause', type: 'text' }, { name: 'description', type: 'textarea' }] },
  { key: 'response', fields: [{ name: 'personnel_deployed', type: 'number' }, { name: 'vehicles_deployed', type: 'number' }, { name: 'aerial_assets', type: 'number' }, { name: 'intervention', type: 'textarea' }] },
  { key: 'casualties', fields: [{ name: 'fatalities', type: 'number' }, { name: 'injured', type: 'number' }, { name: 'evacuated', type: 'number' }, { name: 'dangerous_substances', type: 'text' }, { name: 'assistance_required', type: 'textarea' }] },
  { key: 'contact', fields: [{ name: 'contact_name', type: 'text' }, { name: 'contact_phone', type: 'text' }] },
];

/** PDR wizard (FC_PDR01) for editable reports and the verification view (FC_PDR07) otherwise. */
export function PdrReportPage({ reportId, step, language, isDarkMode }: Props) {
  const t = pdrText(language);
  const [report, setReport] = useState<PdrReport | null>(null);
  const [permissions, setPermissions] = useState<PdrPermissions | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  const load = useCallback(async (signal?: AbortSignal) => {
    if (reportId === 'new') return;
    const response = await getPdrReport(reportId, signal);
    setReport(response.data);
    setPermissions(response.permissions);
  }, [reportId]);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void load(controller.signal).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); });
    return () => controller.abort();
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  };

  if (reportId === 'new') {
    return <Shell t={t}><Stepper t={t} active={1} reachable={1} reportId={null} isDarkMode={isDarkMode} /><IncidentStep t={t} panel={panel} busy={busy} error={error} onSave={(title, jurisdiction) => run(async () => { const created = await createPdrReport({ title, jurisdiction }); navigatePdr(`/pdr/${created.data.id}/step/2`); })} /></Shell>;
  }
  if (!report || !permissions) return <Shell t={t}>{error ? <ErrorBox message={error} /> : <Loader2 className="animate-spin" />}</Shell>;

  if (!permissions.update) {
    return (
      <Shell t={t}>
        <ReportHeader report={report} t={t} language={language} />
        {error && <ErrorBox message={error} />}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {report.perimeter_geometry && <PerimeterMap geometry={report.perimeter_geometry} label={t.mapPerimeter} />}
            <MetadataSummary report={report} t={t} panel={panel} />
            {report.results ? <PdrResultsView results={report.results} language={language} isDarkMode={isDarkMode} /> : <p className="text-sm text-slate-500">{t.notCalculated}</p>}
          </div>
          <ReviewPanel report={report} permissions={permissions} t={t} panel={panel} busy={busy} onReview={(status, note) => run(async () => { await reviewPdrReport(report.id, status, note); await load(); })} />
        </div>
      </Shell>
    );
  }

  const reachable = report.calculated_at ? 6 : report.perimeter_geometry ? 5 : 2;
  const active = Math.min(step || (report.calculated_at ? 6 : report.perimeter_geometry ? 3 : 2), reachable);

  return (
    <Shell t={t}>
      <ReportHeader report={report} t={t} language={language} />
      <Stepper t={t} active={active} reachable={reachable} reportId={report.id} isDarkMode={isDarkMode} />
      {error && <ErrorBox message={error} />}
      {report.status === 'rejected' && report.review_note && <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm"><strong>{t.status.rejected}</strong> · {report.reviewer_name}: {report.review_note}</div>}

      {active === 1 && <IncidentStep t={t} panel={panel} busy={busy} error="" initialTitle={report.title} initialJurisdiction={report.jurisdiction} onSave={(title, jurisdiction) => run(async () => { await updatePdrReport(report.id, { title, jurisdiction }); await load(); navigatePdr(`/pdr/${report.id}/step/2`); })} />}
      {active === 2 && <PerimeterStep t={t} panel={panel} report={report} language={language} onSaved={async () => { await load(); navigatePdr(`/pdr/${report.id}/step/3`); }} />}
      {active === 3 && <MetadataStep t={t} panel={panel} busy={busy} report={report} onSave={(metadata) => run(async () => { await updatePdrReport(report.id, { metadata }); await load(); navigatePdr(`/pdr/${report.id}/step/4`); })} />}
      {active === 4 && (
        <div className={`space-y-4 rounded-xl border p-4 ${panel}`}>
          <PerimeterMap geometry={report.perimeter_geometry} label={t.mapPerimeter} />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-bold text-emerald-600"><CheckCircle2 size={16} />{t.validationOk}</span>
            <span>{t.area}: <strong>{formatNumber(report.perimeter_area_ha, 2, language)} ha</strong></span>
            <span>{report.perimeter_vertex_count} {t.vertices}</span>
            <span className="text-slate-500">{report.perimeter_source}{report.perimeter_file_name ? ` · ${report.perimeter_file_name}` : ''} · v{report.perimeter_version}</span>
          </div>
          {!!report.perimeter_warnings?.length && <Warnings t={t} warnings={report.perimeter_warnings} />}
          <button type="button" onClick={() => navigatePdr(`/pdr/${report.id}/step/5`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{t.next}</button>
        </div>
      )}
      {active === 5 && (
        <div className="space-y-4">
          <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${panel}`}>
            <button type="button" disabled={busy} onClick={() => run(async () => { await calculatePdrReport(report.id); await load(); })} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}{busy ? t.calculating : report.calculated_at ? t.recalculate : t.calculate}
            </button>
            {report.calculated_at && <button type="button" onClick={() => navigatePdr(`/pdr/${report.id}/step/6`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{t.next}</button>}
            {!report.calculated_at && <span className="text-sm text-slate-500">{t.notCalculated}</span>}
          </div>
          {report.results && <PdrResultsView results={report.results} language={language} isDarkMode={isDarkMode} />}
        </div>
      )}
      {active === 6 && report.results && (
        <div className="space-y-5">
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${panel}`}>
            <div className="text-sm">{t.summary}: <strong>{formatNumber(report.results.perimeter.area_ha, 2, language)} ha</strong> · {report.reference}</div>
            <button type="button" disabled={busy || !permissions.submit} onClick={() => run(async () => { await submitPdrReport(report.id); await load(); })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Send size={15} />{t.submit}</button>
          </div>
          <PerimeterMap geometry={report.perimeter_geometry} label={t.mapPerimeter} height={320} />
          <MetadataSummary report={report} t={t} panel={panel} />
          <PdrResultsView results={report.results} language={language} isDarkMode={isDarkMode} />
        </div>
      )}
    </Shell>
  );
}

function Shell({ t, children }: { t: ReturnType<typeof pdrText>; children: React.ReactNode }) {
  return (
    <div data-testid="pdr-report-page">
      <button type="button" onClick={() => navigatePdr('/pdr')} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-blue-500 hover:underline"><ArrowLeft size={15} />{t.back}</button>
      {children}
    </div>
  );
}

function ReportHeader({ report, t, language }: { report: PdrReport; t: ReturnType<typeof pdrText>; language: Language }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="font-mono text-xs text-slate-500">{report.reference}</div>
        <h2 className="text-2xl font-black">{report.title}</h2>
        <div className="text-sm text-slate-500">{t.jurisdiction[report.jurisdiction]}{report.perimeter_area_ha ? ` · ${formatNumber(report.perimeter_area_ha, 2, language)} ha` : ''}</div>
      </div>
      <StatusBadge status={report.status} t={t} />
    </div>
  );
}

function Stepper({ t, active, reachable, reportId, isDarkMode }: { t: ReturnType<typeof pdrText>; active: number; reachable: number; reportId: number | null; isDarkMode: boolean }) {
  return (
    <ol className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="PDR wizard">
      {t.steps.map((label, index) => {
        const number = index + 1;
        const enabled = reportId !== null && number <= reachable;
        const state = number === active ? 'bg-blue-600 text-white border-blue-600' : number < active ? 'border-emerald-500/50 text-emerald-600' : isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400';
        return (
          <li key={label}>
            <button type="button" disabled={!enabled} onClick={() => reportId && navigatePdr(`/pdr/${reportId}/step/${number}`)} aria-current={number === active ? 'step' : undefined} className={`w-full rounded-lg border px-2 py-2 text-left text-xs font-bold ${state} disabled:cursor-default`}>
              <span className="mr-1 opacity-70">{number}.</span>{label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function IncidentStep({ t, panel, busy, error, onSave, initialTitle = '', initialJurisdiction }: { t: ReturnType<typeof pdrText>; panel: string; busy: boolean; error: string; onSave: (title: string, jurisdiction: PdrJurisdiction | null) => void; initialTitle?: string; initialJurisdiction?: PdrJurisdiction }) {
  const [title, setTitle] = useState(initialTitle);
  const [jurisdiction, setJurisdiction] = useState<PdrJurisdiction | ''>(initialJurisdiction || '');
  return (
    <form className={`max-w-2xl space-y-4 rounded-xl border p-5 ${panel}`} onSubmit={(event) => { event.preventDefault(); onSave(title.trim(), jurisdiction || null); }}>
      {error && <ErrorBox message={error} />}
      <Field label={t.incidentTitle}><input required value={title} onChange={event => setTitle(event.target.value)} placeholder={t.incidentTitleHint} className="pdr-input" name="title" /></Field>
      <Field label={t.entity}>
        <select value={jurisdiction} onChange={event => setJurisdiction(event.target.value as PdrJurisdiction)} className="pdr-input" name="jurisdiction">
          <option value="">{t.jurisdiction.shared}</option>
          <option value="fbih">{t.jurisdiction.fbih}</option>
          <option value="rs">{t.jurisdiction.rs}</option>
        </select>
      </Field>
      <button type="submit" disabled={busy || !title.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{initialTitle ? t.next : t.createDraft}</button>
    </form>
  );
}

function PerimeterStep({ t, panel, report, language, onSaved }: { t: ReturnType<typeof pdrText>; panel: string; report: PdrReport; language: Language; onSaved: () => Promise<void> }) {
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [srid, setSrid] = useState('');
  const [points, setPoints] = useState<[number, number][]>([]);
  const [preview, setPreview] = useState<PerimeterPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = () => mode === 'upload' ? { file: file || undefined, sourceSrid: srid ? Number(srid) : null } : { geometry: drawingToGeometry(points) || undefined };

  const act = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); } };

  return (
    <div className={`space-y-4 rounded-xl border p-4 ${panel}`}>
      <p className="text-sm text-slate-500">{t.perimeterHelp}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => { setMode('upload'); setPreview(null); }} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-500/10'}`}><FileUp size={15} />{t.uploadFile}</button>
        <button type="button" onClick={() => { setMode('draw'); setPreview(null); }} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-slate-500/10'}`}><PenLine size={15} />{t.drawOnMap}</button>
      </div>
      {mode === 'upload' ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
          <input type="file" accept=".zip,.kml,.kmz,.geojson,.json" onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); }} className="pdr-input" data-testid="perimeter-file" />
          <input value={srid} onChange={event => setSrid(event.target.value.replace(/\D/g, ''))} placeholder={t.sourceSrid} className="pdr-input" aria-label={t.sourceSrid} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">{t.drawHelp}</span>
          <span className="font-bold">{points.length} {t.vertices}</span>
          <button type="button" onClick={() => setPoints(current => current.slice(0, -1))} disabled={!points.length} className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-1 text-xs font-bold disabled:opacity-50"><Undo2 size={13} />{t.undoVertex}</button>
          <button type="button" onClick={() => { setPoints([]); setPreview(null); }} disabled={!points.length} className="rounded bg-slate-500/10 px-2 py-1 text-xs font-bold disabled:opacity-50">{t.clearDrawing}</button>
        </div>
      )}
      <PerimeterMap geometry={preview?.geometry || (mode === 'upload' ? report.perimeter_geometry : null)} drawing={mode === 'draw' ? points : undefined} onAddVertex={mode === 'draw' ? (vertex) => { setPoints(current => [...current, vertex]); setPreview(null); } : undefined} label={t.mapPerimeter} />
      {error && <ErrorBox message={error} />}
      {preview && (
        <div className="rounded-lg bg-emerald-500/10 p-3 text-sm">
          <span className="mr-3 font-bold text-emerald-600"><CheckCircle2 size={15} className="mr-1 inline" />{t.validationOk}</span>
          {t.area}: <strong>{formatNumber(preview.area_ha, 2, language)} ha</strong> · {preview.vertex_count} {t.vertices}
          {preview.warnings.length > 0 && <Warnings t={t} warnings={preview.warnings} />}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" disabled={busy || (mode === 'upload' ? !file : points.length < 3)} onClick={() => act(async () => setPreview((await previewPerimeter(input())).data))} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t.validate}</button>
        <button type="button" disabled={busy || !preview} onClick={() => act(async () => { await savePerimeter(report.id, input()); await onSaved(); })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t.usePerimeter}</button>
        {report.perimeter_geometry && <button type="button" onClick={() => navigatePdr(`/pdr/${report.id}/step/3`)} className="rounded-lg bg-slate-500/10 px-4 py-2 text-sm font-bold">{t.next}</button>}
      </div>
    </div>
  );
}

function MetadataStep({ t, panel, busy, report, onSave }: { t: ReturnType<typeof pdrText>; panel: string; busy: boolean; report: PdrReport; onSave: (metadata: PdrMetadata) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(report.metadata || {}).map(([key, value]) => [key, value === null || value === undefined ? '' : String(value).replace(/:\d{2}(\.\d+)?Z?$/, '').replace(/Z$/, '')])));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const metadata: Record<string, unknown> = {};
    METADATA_GROUPS.flatMap(group => group.fields).forEach(({ name, type }) => {
      const raw = (values[name] || '').trim();
      metadata[name] = raw === '' ? null : type === 'number' ? Number(raw) : raw;
    });
    onSave(metadata as PdrMetadata);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {METADATA_GROUPS.map(group => (
        <fieldset key={group.key} className={`rounded-xl border p-4 ${panel}`}>
          <legend className="px-1 text-xs font-black uppercase tracking-wider text-slate-500">{t.metadataGroups[group.key]}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map(({ name, type }) => (
              <Field key={name} label={t.metadata[name]} wide={type === 'textarea'}>
                {type === 'textarea'
                  ? <textarea name={name} rows={2} value={values[name] || ''} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} className="pdr-input" />
                  : <input name={name} type={type} min={type === 'number' ? 0 : undefined} value={values[name] || ''} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} className="pdr-input" />}
              </Field>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="submit" disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? t.saving : t.next}</button>
    </form>
  );
}

function MetadataSummary({ report, t, panel }: { report: PdrReport; t: ReturnType<typeof pdrText>; panel: string }) {
  const entries = Object.entries(report.metadata || {}).filter(([, value]) => value !== null && value !== '');
  if (!entries.length) return null;
  return (
    <dl className={`grid gap-x-4 gap-y-2 rounded-xl border p-4 text-sm sm:grid-cols-2 lg:grid-cols-3 ${panel}`}>
      {entries.map(([key, value]) => <div key={key}><dt className="text-xs text-slate-500">{t.metadata[key as keyof typeof t.metadata] || key}</dt><dd className="font-semibold">{formatMetadataValue(value)}</dd></div>)}
    </dl>
  );
}

/** ISO datetimes are shown as "YYYY-MM-DD HH:MM"; other values unchanged. */
export function formatMetadataValue(value: unknown): string {
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) ? text.slice(0, 16).replace('T', ' ') : text;
}

function ReviewPanel({ report, permissions, t, panel, busy, onReview }: { report: PdrReport; permissions: PdrPermissions; t: ReturnType<typeof pdrText>; panel: string; busy: boolean; onReview: (status: 'approved' | 'rejected', note: string) => void }) {
  const [note, setNote] = useState('');
  return (
    <aside className={`h-fit space-y-3 rounded-xl border p-4 ${panel}`} data-testid="pdr-review-panel">
      <h3 className="text-sm font-black uppercase tracking-wider">{t.review}</h3>
      {report.reviewed_at && <p className="text-sm">{t.reviewedBy}: <strong>{report.reviewer_name}</strong> · {new Date(report.reviewed_at).toLocaleString()}<br /><span className="text-slate-500">{report.review_note}</span></p>}
      {permissions.review ? (
        <>
          <textarea rows={4} value={note} onChange={event => setNote(event.target.value)} placeholder={t.reviewNote} className="pdr-input" name="review-note" />
          <div className="flex flex-col gap-2">
            <button type="button" disabled={busy || note.trim().length < 3} onClick={() => onReview('approved', note.trim())} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />{t.approve}</button>
            <button type="button" disabled={busy || note.trim().length < 3} onClick={() => onReview('rejected', note.trim())} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><XCircle size={15} />{t.reject}</button>
          </div>
        </>
      ) : !report.reviewed_at && <p className="text-sm text-slate-500">{t.readOnly}</p>}
      {report.results?.data_sources && <p className="text-xs text-slate-500">{t.dataSources}: {report.results.data_sources.map(source => source.label).join(', ')}</p>}
    </aside>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block text-xs font-bold text-slate-500 ${wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}><span className="mb-1 block">{label}</span>{children}</label>;
}

function Warnings({ t, warnings }: { t: ReturnType<typeof pdrText>; warnings: string[] }) {
  return <div className="mt-2 text-xs text-amber-600"><strong>{t.warnings}:</strong> {warnings.join(' ')}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div role="alert" className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{message}</div>;
}

export function errorText(reason: unknown): string {
  const error = reason as { message?: string; errors?: Record<string, string[]> };
  const details = error.errors ? Object.values(error.errors).flat().join(' ') : '';
  return details || error.message || 'Error';
}
