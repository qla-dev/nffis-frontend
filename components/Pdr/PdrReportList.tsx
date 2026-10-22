import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { Language } from '../../types';
import { listPdrReports, type PdrReport, type PdrStatus } from '../../services/pdrService';
import { formatNumber, pdrText, type PdrText } from '../../lib/pdr/i18n';
import { navigatePdr } from './pdrRoute';
import { PdrDashboardSummary } from './PdrDashboardSummary';

const STATUS_STYLES: Record<PdrStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-500',
  submitted: 'bg-amber-500/15 text-amber-600',
  approved: 'bg-emerald-500/15 text-emerald-600',
  rejected: 'bg-red-500/15 text-red-600',
};

export function StatusBadge({ status, t }: { status: PdrStatus; t: PdrText }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS_STYLES[status]}`} data-status={status}>{t.status[status]}</span>;
}

/** Report list with entity and status filters (FC_PDR08, FC_PDR02). */
export function PdrReportList({ language, isDarkMode, canCreate }: { language: Language; isDarkMode: boolean; canCreate: boolean }) {
  const t = pdrText(language);
  const [reports, setReports] = useState<PdrReport[] | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      listPdrReports({ status, jurisdiction, q: query.trim(), page }, controller.signal)
        .then(response => { setReports(response.data); setLastPage(response.last_page); setTotal(response.total); setError(''); })
        .catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); });
    }, query ? 250 : 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [status, jurisdiction, query, page]);

  return (
    <div className="space-y-4" data-testid="pdr-report-list">
      <PdrDashboardSummary language={language} isDarkMode={isDarkMode} compact />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={event => { setPage(1); setReports(null); setQuery(event.target.value); }} placeholder={t.search} className="pdr-input pl-9" aria-label={t.search} />
        </div>
        <select value={status} onChange={event => { setPage(1); setReports(null); setStatus(event.target.value); }} className="pdr-input w-auto" aria-label={t.allStatuses}>
          <option value="">{t.allStatuses}</option>
          {(['draft', 'submitted', 'approved', 'rejected'] as PdrStatus[]).map(item => <option key={item} value={item}>{t.status[item]}</option>)}
        </select>
        <select value={jurisdiction} onChange={event => { setPage(1); setReports(null); setJurisdiction(event.target.value); }} className="pdr-input w-auto" aria-label={t.allEntities}>
          <option value="">{t.allEntities}</option>
          <option value="fbih">{t.jurisdiction.fbih}</option>
          <option value="rs">{t.jurisdiction.rs}</option>
          <option value="bd">{t.jurisdiction.bd}</option>
          <option value="shared">{t.jurisdiction.shared}</option>
        </select>
        {canCreate && <button type="button" onClick={() => navigatePdr('/pdr/new')} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus size={15} />{t.newReport}</button>}
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
      {!reports && !error && <Loader2 className="animate-spin text-slate-400" />}
      {reports && reports.length === 0 && <div className={`rounded-xl border border-dashed p-8 text-center text-sm text-slate-500 ${panel}`}>{status || jurisdiction || query.trim() ? t.noMatches : t.noReports}</div>}
      {reports && reports.length > 0 && (
        <div className={`overflow-x-auto rounded-xl border ${panel}`}>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">{t.reference}</th><th>{t.title}</th><th>{t.entity}</th><th className="text-right">{t.area}</th><th className="px-4">{t.statusLabel}</th><th className="pr-4 text-right">{t.updated}</th></tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id} onClick={() => navigatePdr(`/pdr/${report.id}`)} className="cursor-pointer border-t border-slate-500/15 hover:bg-blue-500/5">
                  <td className="px-4 py-3 font-mono text-xs">{report.reference}</td>
                  <td className="font-semibold">{report.title}<div className="text-xs font-normal text-slate-500">{report.metadata?.municipality}</div></td>
                  <td>{t.jurisdiction[report.jurisdiction]}</td>
                  <td className="text-right tabular-nums">{report.perimeter_area_ha ? `${formatNumber(report.perimeter_area_ha, 1, language)} ha` : '—'}</td>
                  <td className="px-4"><StatusBadge status={report.status} t={t} /></td>
                  <td className="pr-4 text-right text-xs text-slate-500">{new Date(report.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {reports && lastPage > 1 && <div className="flex items-center justify-end gap-3 text-sm">
        <button type="button" onClick={() => { setReports(null); setPage(current => Math.max(1, current - 1)); }} disabled={page <= 1} className="rounded border border-slate-500/30 px-3 py-1 disabled:opacity-40">{t.previous}</button>
        <span>{page} / {lastPage} · {total}</span>
        <button type="button" onClick={() => { setReports(null); setPage(current => Math.min(lastPage, current + 1)); }} disabled={page >= lastPage} className="rounded border border-slate-500/30 px-3 py-1 disabled:opacity-40">{t.next}</button>
      </div>}
    </div>
  );
}
