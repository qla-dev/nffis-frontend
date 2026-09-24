import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Bell, ChevronDown, ChevronsUpDown, ChevronUp, Flame, HelpCircle, RefreshCw, Server, X } from 'lucide-react';
import { combineFireMonitoringRows, type FireMonitoringRow } from '../../lib/fireIncidentGroups';
import { BIH_FUEL_CLASS_CATALOGUE } from '../../lib/fireIntelligence/fuelClassCatalogue';
import { getFireResponseRecommendation } from '../../lib/fireResponseRecommendation';
import { fetchFirefighterStations } from '../../services/firefighterStationService';
import { markFireNotificationRead, type FireEventProperties } from '../../services/fireMonitoringService';
import type { FirefighterStation } from '../../firefighterData';
import { FireEventDetailDrawer } from './FireEventDetailDrawer';
import { FireIntelligenceOverview } from './FireIntelligenceOverview';
import { useFireMonitoringData } from './useFireMonitoringData';

type SortColumn = 'event' | 'location' | 'source' | 'reports' | 'frp' | 'response' | 'lastSeen' | 'status';
type SortDirection = 'asc' | 'desc';
const tableColumns: Array<{ key: SortColumn; label: string }> = [
  { key: 'event', label: 'Event' }, { key: 'location', label: 'Location' }, { key: 'source', label: 'Source' },
  { key: 'reports', label: 'Reports' }, { key: 'frp', label: 'FRP' }, { key: 'response', label: 'Suggested response' },
  { key: 'lastSeen', label: 'Last seen / reported' }, { key: 'status', label: 'Operational status' },
];

function sortValue(row: FireMonitoringRow, column: SortColumn, stations: readonly FirefighterStation[]): string | number | null {
  if (row.kind === 'reported' && row.reportGroup) {
    const group = row.reportGroup;
    return { event: 'Reported fire', location: group.locality || 'Reported location', source: 'Incident reports', reports: group.count, frp: null, response: 'Verify first', lastSeen: Date.parse(group.lastReportedAt), status: 'reported' }[column];
  }
  const event = row.event!;
  return { event: event.external_id, location: [event.municipality, event.canton || event.entity].filter(Boolean).join(' ') || null, source: 'Satellite', reports: row.linkedReportCount, frp: event.latest_frp ?? null, response: getFireResponseRecommendation(event, stations).title, lastSeen: Date.parse(event.last_seen_at), status: event.incident_case?.workflow_status || 'new' }[column];
}

export default function OperationalFireDashboard({ isDarkMode, canManage = false, canViewIntelligence = false, canRunIntelligence = false, canReviewIntelligence = false }: { isDarkMode: boolean; canManage?: boolean; canViewIntelligence?: boolean; canRunIntelligence?: boolean; canReviewIntelligence?: boolean }) {
  const { stats, events, reports, health, notifications, unreadCount, error, loading, reload, setUnreadCount } = useFireMonitoringData();
  const [stations, setStations] = useState<FirefighterStation[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFuelHelp, setShowFuelHelp] = useState(false);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  useEffect(() => { const controller = new AbortController(); fetchFirefighterStations(controller.signal).then(setStations).catch(() => setStations([])); return () => controller.abort(); }, []);
  useEffect(() => { setHeaderActions(document.getElementById('fire-monitoring-header-actions')); }, []);

  const rows = useMemo(() => combineFireMonitoringRows(events, reports), [events, reports]);
  const sortedRows = useMemo(() => [...rows].sort((left, right) => {
    const a = sortValue(left, sortColumn, stations); const b = sortValue(right, sortColumn, stations);
    if (a == null) return b == null ? 0 : 1; if (b == null) return -1;
    const comparison = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [rows, sortColumn, sortDirection, stations]);
  const toggleSort = (column: SortColumn) => { if (column === sortColumn) setSortDirection(value => value === 'asc' ? 'desc' : 'asc'); else { setSortColumn(column); setSortDirection('asc'); } };
  if (loading) return <div className="flex items-center gap-2 text-slate-500"><RefreshCw className="animate-spin" size={18} /> Loading fire monitoring...</div>;
  if (error || !stats) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">{error || 'Fire monitoring unavailable.'}</div>;

  const cards = [['Active events', stats.active_events], ['New in 1 hour', stats.new_last_hour], ['New in 24 hours', stats.new_last_24h], ['High priority', stats.high_priority], ['Extinguished (24h)', stats.extinguished_last_24h], ['Highest current FRP', `${stats.highest_current_frp.toFixed(1)} MW`]];
  return <div className="space-y-6">
    {headerActions && createPortal(<div className="relative"><button type="button" onClick={() => setShowNotifications(value => !value)} className="rounded-lg border border-slate-500/30 px-3 py-2 text-sm"><Bell className="mr-2 inline" size={16} />Alerts {unreadCount > 0 && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">{unreadCount}</span>}</button>{showNotifications && <div className={`absolute right-0 z-50 mt-2 w-96 max-w-[90vw] rounded-xl border p-2 shadow-2xl ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>{notifications.length ? notifications.slice(0, 10).map(item => <button type="button" key={item.id} onClick={() => { setSelectedEventId(item.data.fire_event_id); if (!item.read_at) void markFireNotificationRead(item.id).then(() => setUnreadCount(Math.max(0, unreadCount - 1))); setShowNotifications(false); }} className={`block w-full rounded-lg p-3 text-left text-sm hover:bg-blue-500/10 ${item.read_at ? 'opacity-60' : ''}`}><div className="font-bold">{item.data.transition}: {item.data.external_id}</div><div className="text-xs text-slate-500">{item.data.detail}</div></button>) : <div className="p-4 text-sm text-slate-500">No fire alerts.</div>}</div>}</div>, headerActions)}
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><AlertTriangle className="mr-2 inline text-amber-500" size={17} /><strong>Interpretation:</strong> satellite detections and public incident reports are grouped when they are within 3.5 km and 8 hours. They are not automatically confirmed fires.</div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([label, value]) => <div key={label} className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}><div className="text-xs uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>)}</div>
    {canViewIntelligence && <FireIntelligenceOverview isDarkMode={isDarkMode} canRun={canRunIntelligence} canReview={canReviewIntelligence} />}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2">{health?.sources.map(source => <div key={source.source} title={source.last_error || `Last success: ${source.last_success_at || 'never'}`} className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase ${source.status === 'healthy' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : source.status === 'stale' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-slate-500/30 text-slate-500'}`}><Server className="mr-1 inline" size={13} />{source.source}: {source.status}</div>)}</div>
      <button type="button" onClick={() => setShowFuelHelp(true)} className="rounded-lg border border-slate-500/30 px-3 py-2 text-sm"><HelpCircle className="mr-2 inline" size={16} />Fuel class help</button>
    </div>
    {showFuelHelp && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="fuel-help-title" onMouseDown={event => { if (event.target === event.currentTarget) setShowFuelHelp(false); }}><div className={`max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 shadow-2xl ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}><div className="mb-4 flex items-start justify-between gap-4"><div><h2 id="fuel-help-title" className="text-lg font-black">BiH fuel-class catalogue</h2><p className="mt-1 text-sm text-slate-500">Pyretechnics-compatible proxy classes derived from ESA WorldCover. These descriptions support review; they are not local institutional approval.</p></div><button type="button" onClick={() => setShowFuelHelp(false)} className="rounded-lg p-2 hover:bg-slate-500/10" aria-label="Close fuel-class help"><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2">{BIH_FUEL_CLASS_CATALOGUE.map(item => <article key={item.code} className="rounded-xl border border-slate-500/20 p-4"><div className="flex items-baseline gap-2"><span className="rounded bg-orange-500/10 px-2 py-1 font-mono text-sm font-black text-orange-500">{item.code}</span><h3 className="font-bold">{item.name}</h3></div><p className="mt-2 text-sm">{item.meaning}</p><p className="mt-2 text-xs text-slate-500"><strong>Review note:</strong> {item.caution}</p></article>)}</div></div></div>}
    <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2 border-b border-slate-700/40 p-4 font-bold"><Flame className="text-orange-500" size={18} /> FireWatch events and incident reports</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{tableColumns.map(({ key, label }) => { const active = key === sortColumn; const SortIcon = active ? sortDirection === 'asc' ? ChevronUp : ChevronDown : ChevronsUpDown; return <th className="px-4 py-3" key={key} aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded focus-visible:ring-2 focus-visible:ring-blue-500">{label}<SortIcon size={14} className={active ? 'text-blue-400' : 'text-slate-600'} /></button></th>; })}</tr></thead>
        <tbody>{sortedRows.map(row => row.kind === 'reported' && row.reportGroup ? <ReportedRow key={row.key} row={row} /> : <EventRow key={row.key} row={row} stations={stations} onOpen={setSelectedEventId} />)}</tbody>
      </table></div>
    </div>
    {selectedEventId != null && <FireEventDetailDrawer eventId={selectedEventId} canManage={canManage} canViewIntelligence={canViewIntelligence} canRunIntelligence={canRunIntelligence} canReviewIntelligence={canReviewIntelligence} isDarkMode={isDarkMode} onClose={() => setSelectedEventId(null)} onUpdated={() => void reload()} />}
  </div>;
}

function ReportedRow({ row }: { row: FireMonitoringRow }) { const group = row.reportGroup!; return <tr className="border-t border-slate-700/30"><td className="px-4 py-3 font-mono text-slate-500">Reported fire</td><td className="px-4 py-3">{group.locality || 'Reported location'}</td><td className="px-4 py-3">Incident reports</td><td className="px-4 py-3">{group.count} grouped</td><td className="px-4 py-3">-</td><td className="px-4 py-3">Verify first</td><td className="px-4 py-3">{new Date(group.lastReportedAt).toLocaleString()}</td><td className="px-4 py-3">reported</td></tr>; }
function EventRow({ row, stations, onOpen }: { row: FireMonitoringRow; stations: FirefighterStation[]; onOpen: (id: number) => void }) { const event: FireEventProperties = row.event!; const recommendation = getFireResponseRecommendation(event, stations); return <tr className="cursor-pointer border-t border-slate-700/30 hover:bg-blue-500/5" onClick={() => onOpen(event.id)}><td className="px-4 py-3 font-mono"><button type="button" className="text-blue-500 underline-offset-2 hover:underline">{event.external_id}</button></td><td className="px-4 py-3"><div>{event.municipality || '-'}</div><div className="text-xs text-slate-500">{event.canton || event.entity || 'Bosnia and Herzegovina'}</div></td><td className="px-4 py-3">Satellite</td><td className="px-4 py-3">{row.linkedReportCount || '-'}</td><td className="px-4 py-3">{event.latest_frp ?? '-'} MW</td><td className="px-4 py-3"><span title={recommendation.summary}>{recommendation.title}</span></td><td className="px-4 py-3">{new Date(event.last_seen_at).toLocaleString()}</td><td className="px-4 py-3"><span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-500">{event.incident_case?.workflow_status || 'new'}</span></td></tr>; }
