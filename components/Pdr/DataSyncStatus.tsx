import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Language } from '../../types';
import { listDataSyncRuns, type DataSyncOverview } from '../../services/pdrService';
import { formatNumber, pdrText } from '../../lib/pdr/i18n';
import { ErrorBox, errorText } from './PdrReportPage';

/** Synchronisation status and history of external datasets (FC_PDR05, acceptance PDR4). */
export function DataSyncStatus({ language, isDarkMode }: { language: Language; isDarkMode: boolean }) {
  const t = pdrText(language);
  const [overview, setOverview] = useState<DataSyncOverview | null>(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  const load = () => listDataSyncRuns(source).then(setOverview).catch(reason => setError(errorText(reason)));
  useEffect(() => { void load(); }, [source]);

  if (!overview) return error ? <ErrorBox message={error} /> : <Loader2 className="animate-spin text-slate-400" />;

  return (
    <div className="space-y-4" data-testid="pdr-sync">
      <p className="text-sm text-slate-500">{t.syncHelp}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overview.sources.map(item => (
          <button key={item.source} type="button" onClick={() => setSource(current => current === item.source ? '' : item.source)} className={`rounded-xl border p-4 text-left ${panel} ${source === item.source ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold">{item.source}</span>
              {item.latest_status === 'success' ? <CheckCircle2 size={16} className="text-emerald-500" /> : item.latest_status === 'failed' ? <XCircle size={16} className="text-red-500" /> : <RefreshCw size={16} className="text-amber-500" />}
            </div>
            <div className="mt-2 text-xs text-slate-500">{t.lastSuccess}: {item.last_success_at ? new Date(item.last_success_at).toLocaleString() : '—'}</div>
            <div className="text-xs text-slate-500">24h: {item.runs_24h} · {t.failures}: <span className={item.failures_24h ? 'font-bold text-red-500' : ''}>{item.failures_24h}</span></div>
          </button>
        ))}
        {overview.sources.length === 0 && <div className={`rounded-xl border border-dashed p-6 text-sm text-slate-500 ${panel}`}>{t.noSyncRuns}</div>}
      </div>
      <div className={`overflow-x-auto rounded-xl border ${panel}`}>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="px-4 py-2">{t.source}</th><th>{t.statusLabel}</th><th>{t.started}</th><th className="text-right">{t.duration}</th><th className="text-right">{t.fetched}</th><th className="text-right">{t.stored}</th><th className="px-4">{t.details}</th></tr></thead>
          <tbody>
            {overview.data.map(run => (
              <tr key={run.id} className="border-t border-slate-500/15 align-top">
                <td className="px-4 py-2 font-mono text-xs">{run.source}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${run.status === 'success' ? 'bg-emerald-500/15 text-emerald-600' : run.status === 'failed' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>{run.status}</span></td>
                <td className="text-xs">{new Date(run.started_at).toLocaleString()}</td>
                <td className="text-right text-xs tabular-nums">{run.duration_ms !== null ? `${formatNumber(run.duration_ms / 1000, 1, language)} s` : '—'}</td>
                <td className="text-right tabular-nums">{formatNumber(run.records_fetched, 0, language)}</td>
                <td className="text-right tabular-nums">{formatNumber(run.records_stored, 0, language)}</td>
                <td className="max-w-md px-4 text-xs text-slate-500">{run.error ? <span className="text-red-500">{run.error}</span> : run.summary ? JSON.stringify(run.summary) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
