import React, { useEffect, useState } from 'react';
import { AlertTriangle, Coins, FileSpreadsheet, Flame, Hourglass } from 'lucide-react';
import { Language } from '../../types';
import { getPdrSummary, type PdrSummary } from '../../services/pdrService';
import { formatMoney, formatNumber, pdrText } from '../../lib/pdr/i18n';
import { navigatePdr } from './pdrRoute';

/** PDR analytical summary for the monitoring dashboard (FC_PDR09). */
export function PdrDashboardSummary({ language, isDarkMode, compact = false }: { language: Language; isDarkMode: boolean; compact?: boolean }) {
  const t = pdrText(language);
  const [summary, setSummary] = useState<PdrSummary | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getPdrSummary(controller.signal).then(setSummary).catch(() => setSummary(null));
    return () => controller.abort();
  }, []);
  if (!summary) return null;
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  const cards = [
    { icon: Hourglass, color: 'text-amber-500', label: t.awaitingVerification, value: formatNumber(summary.by_status.submitted ?? 0, 0, language) },
    { icon: FileSpreadsheet, color: 'text-slate-500', label: t.drafts, value: formatNumber(summary.by_status.draft ?? 0, 0, language) },
    { icon: Flame, color: 'text-orange-500', label: t.approvedAreaYear, value: `${formatNumber(summary.approved_this_year.burnt_area_ha, 1, language)} ha` },
    { icon: Coins, color: 'text-emerald-500', label: t.approvedDamageYear, value: formatMoney(summary.approved_this_year.damage_total, summary.approved_this_year.currency, language) },
  ];

  return (
    <section className={`rounded-xl border p-4 ${panel}`} data-testid="pdr-summary">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wider">{t.module}</h3>
        {summary.sync_failures_24h > 0 && <button type="button" onClick={() => navigatePdr('/pdr/sync')} className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-600"><AlertTriangle size={13} />{summary.sync_failures_24h} {t.syncFailures}</button>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="rounded-lg bg-slate-500/5 p-3"><div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><Icon size={13} className={color} />{label}</div><div className="mt-1 text-xl font-black tabular-nums">{value}</div></div>
        ))}
      </div>
      {!compact && summary.latest.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-500/15 text-sm">
          {summary.latest.map(report => (
            <li key={report.id}><button type="button" onClick={() => navigatePdr(`/pdr/${report.id}`)} className="flex w-full items-center justify-between gap-2 py-1.5 text-left hover:text-blue-500"><span><span className="mr-2 font-mono text-xs text-slate-500">{report.reference}</span>{report.title}</span><span className="text-xs text-slate-500">{t.status[report.status]}{report.perimeter_area_ha ? ` · ${formatNumber(report.perimeter_area_ha, 1, language)} ha` : ''}</span></button></li>
          ))}
        </ul>
      )}
    </section>
  );
}
