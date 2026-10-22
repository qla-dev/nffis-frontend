import React, { useEffect, useState } from 'react';
import { Download, Loader2, Save } from 'lucide-react';
import { Language } from '../../types';
import { incidentReportPdfUrl, listIncidentReports, updateIncidentReport, type IncidentReportRecord } from '../../services/incidentReportService';
import { INCIDENT_STATUSES, type IncidentStatus } from '../../services/reportStatisticsService';
import { formatNumber, pdrText } from '../../lib/pdr/i18n';
import { ErrorBox, errorText } from './PdrReportPage';

type Draft = Record<'status' | 'locality' | 'description' | 'affected_area_ha' | 'intervention_details' | 'personnel_deployed' | 'vehicles_deployed' | 'fatalities' | 'injured' | 'evacuated' | 'dangerous_substances' | 'assistance_required', string>;
const NUMBER_FIELDS = ['affected_area_ha', 'personnel_deployed', 'vehicles_deployed', 'fatalities', 'injured', 'evacuated'] as const;

function toDraft(report: IncidentReportRecord): Draft {
  const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  return {
    status: report.status || 'reported', locality: text(report.locality), description: text(report.description),
    affected_area_ha: text(report.affected_area_ha), intervention_details: text(report.intervention_details),
    personnel_deployed: text(report.personnel_deployed), vehicles_deployed: text(report.vehicles_deployed),
    fatalities: text(report.fatalities), injured: text(report.injured), evacuated: text(report.evacuated),
    dangerous_substances: text(report.dangerous_substances), assistance_required: text(report.assistance_required),
  };
}

/** Incident attribute management (FC_PDR13, acceptance PDR9). */
export function IncidentManager({ language, isDarkMode, canUpdate }: { language: Language; isDarkMode: boolean; canUpdate: boolean }) {
  const t = pdrText(language);
  const [reports, setReports] = useState<IncidentReportRecord[] | null>(null);
  const [selected, setSelected] = useState<IncidentReportRecord | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  const load = (keep?: number, requestedPage = page) => listIncidentReports({ page: requestedPage }).then(response => {
    setReports(response.data);
    setLastPage(response.last_page);
    setTotal(response.total);
    setPage(requestedPage);
    const next = response.data.find(report => report.id === keep) || response.data[0] || null;
    setSelected(next);
    setDraft(next ? toDraft(next) : null);
    setError('');
  }).catch(reason => setError(errorText(reason)));
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!selected || !draft) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const body: Record<string, unknown> = { ...draft };
      for (const field of NUMBER_FIELDS) body[field] = draft[field] === '' ? null : Number(draft[field]);
      for (const field of ['locality', 'description', 'intervention_details', 'dangerous_substances', 'assistance_required'] as const) body[field] = draft[field].trim() || null;
      await updateIncidentReport(selected.id, body as Partial<IncidentReportRecord>);
      await load(selected.id);
      setSaved(true);
    } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  };

  if (!reports) return error ? <ErrorBox message={error} /> : <Loader2 className="animate-spin text-slate-400" />;
  const field = (name: keyof Draft, label: string, type: 'text' | 'number' | 'textarea' = 'text', wide = false) => (
    <label key={name} className={`block text-xs font-bold text-slate-500 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block">{label}</span>
      {type === 'textarea'
        ? <textarea name={name} rows={2} disabled={!canUpdate} value={draft?.[name] ?? ''} onChange={event => setDraft(current => current && ({ ...current, [name]: event.target.value }))} className="pdr-input" />
        : <input name={name} type={type} min={type === 'number' ? 0 : undefined} step="any" disabled={!canUpdate} value={draft?.[name] ?? ''} onChange={event => setDraft(current => current && ({ ...current, [name]: event.target.value }))} className="pdr-input" />}
    </label>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]" data-testid="incident-manager">
      <div className={`max-h-[640px] overflow-y-auto rounded-xl border ${panel}`}>
        {reports.length === 0 && <div className="p-6 text-sm text-slate-500">{t.incidentsEmpty}</div>}
        {reports.map(report => (
          <button key={report.id} type="button" onClick={() => { setSelected(report); setDraft(toDraft(report)); setSaved(false); }}
            className={`block w-full border-b border-slate-500/15 px-4 py-3 text-left text-sm ${selected?.id === report.id ? 'bg-blue-500/10' : 'hover:bg-slate-500/5'}`}>
            <div className="flex justify-between gap-2"><strong>#{report.id} · {report.locality || report.region || report.incident_type}</strong><span className="text-xs text-slate-500">{t.incidentStatus[report.status] || report.status}</span></div>
            <div className="truncate text-xs text-slate-500">{report.description}</div>
            <div className="text-[11px] text-slate-400">{new Date(report.reported_at || report.created_at).toLocaleString()}{report.affected_area_ha ? ` · ${formatNumber(report.affected_area_ha, 1, language)} ha` : ''}</div>
          </button>
        ))}
        {lastPage > 1 && <div className="flex items-center justify-between gap-2 p-3 text-xs">
          <button type="button" disabled={page <= 1} onClick={() => { setReports(null); void load(undefined, page - 1); }} className="rounded border border-slate-500/30 px-2 py-1 disabled:opacity-40">{t.previous}</button>
          <span>{page} / {lastPage} · {total}</span>
          <button type="button" disabled={page >= lastPage} onClick={() => { setReports(null); void load(undefined, page + 1); }} className="rounded border border-slate-500/30 px-2 py-1 disabled:opacity-40">{t.next}</button>
        </div>}
      </div>

      {selected && draft && (
        <section className={`space-y-4 rounded-xl border p-4 ${panel}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h3 className="text-lg font-black">#{selected.id} · {selected.incident_type}</h3><div className="text-xs text-slate-500">{selected.user?.name} · {selected.latitude}, {selected.longitude}</div></div>
            <a href={incidentReportPdfUrl(selected.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-slate-500/15 px-3 py-1.5 text-xs font-bold"><Download size={13} />PDF</a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-500"><span className="mb-1 block">{t.statusLabel}</span>
              <select name="status" disabled={!canUpdate} value={draft.status} onChange={event => setDraft(current => current && ({ ...current, status: event.target.value as IncidentStatus }))} className="pdr-input">
                {INCIDENT_STATUSES.map(status => <option key={status} value={status}>{t.incidentStatus[status]}</option>)}
              </select>
            </label>
            {field('locality', t.metadata.locality)}
            {field('description', t.metadata.description, 'textarea', true)}
            {field('affected_area_ha', t.incidentArea, 'number')}
            {field('personnel_deployed', t.metadata.personnel_deployed, 'number')}
            {field('vehicles_deployed', t.metadata.vehicles_deployed, 'number')}
            {field('fatalities', t.metadata.fatalities, 'number')}
            {field('injured', t.metadata.injured, 'number')}
            {field('evacuated', t.metadata.evacuated, 'number')}
            {field('intervention_details', t.metadata.intervention, 'textarea', true)}
            {field('dangerous_substances', t.metadata.dangerous_substances, 'textarea', true)}
            {field('assistance_required', t.metadata.assistance_required, 'textarea', true)}
          </div>
          {error && <ErrorBox message={error} />}
          {canUpdate && <div className="flex items-center gap-3"><button type="button" disabled={busy} onClick={() => void save()} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Save size={15} />{busy ? t.saving : t.save}</button>{saved && <span className="text-sm font-bold text-emerald-600">{t.incidentSaved}</span>}</div>}
        </section>
      )}
    </div>
  );
}
