import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Flame, RefreshCw } from 'lucide-react';
import { combineFireMonitoringRows, type FireIncidentReport } from '../../lib/fireIncidentGroups';
import { getFireResponseRecommendation } from '../../lib/fireResponseRecommendation';
import type { FirefighterStation } from '../../firefighterData';
import { fetchFirefighterStations } from '../../services/firefighterStationService';
import { fetchFireIncidentReports, fetchFires, fetchFireStatistics, FIRE_REFRESH_MS, type FireEventProperties, type FireStatistics } from '../../services/fireMonitoringService';

export default function FireMonitoringDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  const [stats, setStats] = useState<FireStatistics | null>(null);
  const [events, setEvents] = useState<FireEventProperties[]>([]);
  const [reports, setReports] = useState<FireIncidentReport[]>([]);
  const [stations, setStations] = useState<FirefighterStation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true; let controller: AbortController;
    const load = async () => {
      controller?.abort(); controller = new AbortController();
      try {
        const [nextStats, nextEvents, nextReports] = await Promise.all([
          fetchFireStatistics(controller.signal), fetchFires(controller.signal),
          fetchFireIncidentReports(controller.signal).catch(() => ({ data: [] })),
        ]);
        if (live) { setStats(nextStats); setEvents(nextEvents.data); setReports(nextReports.data); setError(''); }
      } catch (reason) {
        if (live && (reason as Error).name !== 'AbortError') setError((reason as Error).message);
      } finally { if (live) setLoading(false); }
    };
    void load(); const timer = window.setInterval(load, FIRE_REFRESH_MS);
    return () => { live = false; controller?.abort(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchFirefighterStations(controller.signal).then(setStations).catch(() => setStations([]));
    return () => controller.abort();
  }, []);

  const rows = useMemo(() => combineFireMonitoringRows(events, reports), [events, reports]);
  if (loading) return <div className="flex items-center gap-2 text-slate-500"><RefreshCw className="animate-spin" size={18} /> Loading fire monitoring...</div>;
  if (error || !stats) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">{error || 'Fire monitoring unavailable.'}</div>;

  const cards = [['Active events', stats.active_events], ['New in 1 hour', stats.new_last_hour], ['New in 24 hours', stats.new_last_24h], ['High priority', stats.high_priority], ['Extinguished (24h)', stats.extinguished_last_24h], ['Highest current FRP', `${stats.highest_current_frp.toFixed(1)} MW`]];
  return <div className="space-y-6">
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><AlertTriangle className="mr-2 inline text-amber-500" size={17} /><strong>Interpretation:</strong> satellite detections and public incident reports are grouped when they are within 3.5 km and 8 hours. They are not automatically confirmed fires.</div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([label, value]) => <div key={label} className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}><div className="text-xs uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>)}</div>
    <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2 border-b border-slate-700/40 p-4 font-bold"><Flame className="text-orange-500" size={18} /> FireWatch events and incident reports</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500"><tr>{['Event', 'Location', 'Source', 'Reports', 'FRP', 'Suggested response', 'Last seen / reported', 'Status'].map(h => <th className="px-4 py-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(row => {
          if (row.kind === 'reported' && row.reportGroup) {
            const group = row.reportGroup;
            return <tr className="border-t border-slate-700/30" key={row.key}><td className="px-4 py-3 font-mono text-slate-500">Reported fire</td><td className="px-4 py-3">{group.locality || 'Reported location'}</td><td className="px-4 py-3">Incident reports</td><td className="px-4 py-3"><span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-600">{group.count} grouped</span></td><td className="px-4 py-3">-</td><td className="px-4 py-3"><span className="rounded-full bg-slate-500/10 px-2 py-1 text-xs font-bold text-slate-600">Verify first</span></td><td className="px-4 py-3">{new Date(group.lastReportedAt).toLocaleString()}</td><td className="px-4 py-3"><span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-600">reported</span></td></tr>;
          }
          const event = row.event!;
          const recommendation = getFireResponseRecommendation(event, stations);
          return <tr className="border-t border-slate-700/30" key={row.key}><td className="px-4 py-3 font-mono">{event.external_id}</td><td className="px-4 py-3"><div>{event.municipality || '-'}</div><div className="mt-0.5 text-xs text-slate-500">{event.canton || event.entity || 'Bosnia and Herzegovina'}</div></td><td className="px-4 py-3">Satellite</td><td className="px-4 py-3">{row.linkedReportCount ? <span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-600">{row.linkedReportCount} linked</span> : '-'}</td><td className="px-4 py-3">{event.latest_frp ?? '-'} MW</td><td className="px-4 py-3"><span title={recommendation.summary} className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-600">{recommendation.title}</span></td><td className="px-4 py-3">{new Date(event.last_seen_at).toLocaleString()}</td><td className="px-4 py-3"><span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-500">{event.status}</span></td></tr>;
        })}</tbody>
      </table></div>
    </div>
  </div>;
}
