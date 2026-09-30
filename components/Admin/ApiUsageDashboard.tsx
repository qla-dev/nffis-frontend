import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { fetchApiUsage, type ApiUsageProvider, type ApiUsageSummary } from '../../services/apiUsageService';

function compact(value: number) { return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value); }
function resetLabel(value: string) {
  const date = new Date(value); const milliseconds = date.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(milliseconds / 3_600_000));
  return `${date.toLocaleString()} · ${hours < 48 ? `${hours} h` : `${Math.ceil(hours / 24)} days`}`;
}
function tone(provider: ApiUsageProvider) {
  if (!provider.configured) return { bar: 'bg-slate-600', text: 'text-slate-400', label: 'Not configured' };
  if (provider.usage_percent !== null && provider.usage_percent >= 90) return { bar: 'bg-red-500', text: 'text-red-400', label: 'Critical' };
  if (provider.usage_percent !== null && provider.usage_percent >= 70) return { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Watch' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: provider.active ? 'Active' : 'Inactive' };
}

export function ApiUsageDashboard({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState<ApiUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); fetchApiUsage().then(setSummary).catch(value => setError(value instanceof Error ? value.message : 'Unable to load API usage.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  const riskCount = useMemo(() => summary?.providers.filter(provider => (provider.usage_percent ?? 0) >= 70).length ?? 0, [summary]);

  return <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/95 p-4 text-white backdrop-blur-md md:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-6">
        <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-cyan-400"><Activity size={16}/> Super-admin monitoring</div><h2 className="mt-2 text-3xl font-black">API & Subscription Usage</h2><p className="mt-2 max-w-3xl text-sm text-slate-400">NFFIS counters help detect unexpected growth. Provider invoices and consoles remain the authoritative billing source.</p></div>
        <div className="flex gap-2"><button onClick={load} disabled={loading} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-300 hover:border-cyan-500"><RefreshCw size={18} className={loading?'animate-spin':''}/></button><button onClick={onClose} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-300 hover:border-red-500"><X size={18}/></button></div>
      </header>
      {riskCount > 0 && <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200"><AlertTriangle size={20}/>{riskCount} provider{riskCount===1?' is':'s are'} above the configured 70% warning threshold.</div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
      {loading && !summary ? <div className="flex justify-center py-24"><Loader2 size={34} className="animate-spin text-cyan-400"/></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary?.providers.map(provider => { const status=tone(provider); const percent=Math.min(100,provider.usage_percent??0); return <article key={provider.id} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{provider.category}</div><h3 className="mt-1 text-lg font-black">{provider.name}</h3><div className="mt-1 text-xs text-slate-400">{provider.plan}</div></div><div className={`flex items-center gap-1 text-[10px] font-black uppercase ${status.text}`}>{provider.configured&&provider.active?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>} {status.label}</div></div>
          <div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-black">{provider.usage_source==='provider_console_only'?'—':compact(provider.usage)}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{provider.unit} · NFFIS meter</div></div><div className="text-right text-xs text-slate-400">{provider.limit?`of ${compact(provider.limit)}`:'No configured limit'}</div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${status.bar}`} style={{width:`${provider.limit?percent:0}%`}}/></div>
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-500">Cycle</span><strong className="capitalize">{provider.cycle}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Resets</span><strong className="text-right">{resetLabel(provider.resets_at)}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Usage source</span><strong>{provider.usage_source==='nffis_meter'?'NFFIS measured':'Provider console only'}</strong></div></div>
          <p className="mt-4 min-h-10 text-[11px] leading-relaxed text-slate-500">{provider.note}</p>
          <a href={provider.dashboard_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300">Open provider dashboard <ExternalLink size={13}/></a>
        </article>; })}
      </div>}
      {summary && <div className="mt-5 text-right text-[10px] text-slate-600">Updated {new Date(summary.generated_at).toLocaleString()}</div>}
    </div>
  </div>;
}
