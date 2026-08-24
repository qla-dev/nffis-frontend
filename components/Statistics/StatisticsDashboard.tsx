import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CloudSun,
  Flame,
  RefreshCw,
  Waves,
} from 'lucide-react';
import { Language } from '../../types';
import {
  fetchReportStatistics,
  type ReportStatistics,
  type StatisticsCountItem,
} from '../../services/reportStatisticsService';

interface StatisticsDashboardProps {
  language: Language;
  isDarkMode: boolean;
}

const COPY = {
  [Language.EN]: {
    total: 'Total incidents', fire: 'Fire incidents', flood: 'Flood incidents', activeDays: 'Active days',
    trend: 'Incident trend', trendHint: 'Reports grouped by day', types: 'Incidents by type',
    weather: 'Weather conditions', weatherHint: 'Conditions recorded with incident reports',
    from: 'From', to: 'To', apply: 'Apply filters', reset: 'Reset', refresh: 'Refresh',
    noData: 'No incidents were reported for the selected period.', retry: 'Try again',
  },
  [Language.BS]: {
    total: 'Ukupno incidenata', fire: 'Požari', flood: 'Poplave', activeDays: 'Aktivni dani',
    trend: 'Trend incidenata', trendHint: 'Prijave grupisane po danima', types: 'Incidenti po tipu',
    weather: 'Vremenski uslovi', weatherHint: 'Uslovi zabilježeni uz prijave incidenata',
    from: 'Od', to: 'Do', apply: 'Primijeni filtere', reset: 'Poništi', refresh: 'Osvježi',
    noData: 'Nema prijavljenih incidenata za odabrani period.', retry: 'Pokušaj ponovo',
  },
  [Language.JA]: {
    total: 'インシデント総数', fire: '火災', flood: '洪水', activeDays: '発生日数',
    trend: 'インシデント推移', trendHint: '日別の報告件数', types: '種類別インシデント',
    weather: '気象条件', weatherHint: '報告時に記録された気象条件',
    from: '開始日', to: '終了日', apply: 'フィルターを適用', reset: 'リセット', refresh: '更新',
    noData: '選択した期間にはインシデント報告がありません。', retry: '再試行',
  },
};

const TYPE_COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#8b5cf6', '#10b981'];

function countFor(items: StatisticsCountItem[], aliases: string[]): number {
  return items
    .filter((item) => aliases.includes(item.label.toLowerCase()))
    .reduce((sum, item) => sum + Number(item.count), 0);
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ language, isDarkMode }) => {
  const copy = COPY[language];
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchReportStatistics(appliedFilters, controller.signal)
      .then(setStatistics)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Report statistics are unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters, refreshKey]);

  const applyFilters = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters({ from, to });
  }, [from, to]);

  const resetFilters = useCallback(() => {
    setFrom('');
    setTo('');
    setAppliedFilters({ from: '', to: '' });
  }, []);

  const fireCount = useMemo(
    () => countFor(statistics?.by_incident_type ?? [], ['fire', 'požar', 'pozar']),
    [statistics],
  );
  const floodCount = useMemo(
    () => countFor(statistics?.by_incident_type ?? [], ['flood', 'poplava']),
    [statistics],
  );

  const cardClass = `rounded-2xl border shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`;
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const mainText = isDarkMode ? 'text-white' : 'text-slate-900';
  const inputClass = `rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'}`;

  if (isLoading && !statistics) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading statistics">
        {[0, 1, 2, 3].map((item) => <div key={item} className={`${cardClass} h-32 animate-pulse`} />)}
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className={`${cardClass} flex min-h-72 flex-col items-center justify-center p-8 text-center`}>
        <AlertCircle className="mb-4 text-red-500" size={36} />
        <p className={`mb-5 text-sm ${mutedText}`}>{error}</p>
        <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          {copy.retry}
        </button>
      </div>
    );
  }

  const data = statistics ?? { total: 0, by_incident_type: [], daily: [], by_weather_condition: [] };

  return (
    <div className="space-y-6">
      <form onSubmit={applyFilters} className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <label className={`flex flex-col gap-1.5 text-xs font-semibold ${mutedText}`}>
          {copy.from}
          <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
        </label>
        <label className={`flex flex-col gap-1.5 text-xs font-semibold ${mutedText}`}>
          {copy.to}
          <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={inputClass} />
        </label>
        <button type="submit" disabled={isLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
          {copy.apply}
        </button>
        {(appliedFilters.from || appliedFilters.to) && (
          <button type="button" onClick={resetFilters} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            {copy.reset}
          </button>
        )}
        <button type="button" title={copy.refresh} aria-label={copy.refresh} onClick={() => setRefreshKey((value) => value + 1)} disabled={isLoading} className={`ml-auto rounded-lg border p-2.5 transition ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<BarChart3 size={20} />} label={copy.total} value={data.total} color="blue" isDarkMode={isDarkMode} />
        <MetricCard icon={<Flame size={20} />} label={copy.fire} value={fireCount} color="red" isDarkMode={isDarkMode} />
        <MetricCard icon={<Waves size={20} />} label={copy.flood} value={floodCount} color="cyan" isDarkMode={isDarkMode} />
        <MetricCard icon={<CalendarDays size={20} />} label={copy.activeDays} value={data.daily.length} color="violet" isDarkMode={isDarkMode} />
      </div>

      {data.total === 0 ? (
        <div className={`${cardClass} flex min-h-64 flex-col items-center justify-center p-8 text-center`}>
          <BarChart3 size={42} className="mb-4 text-blue-500/60" />
          <p className={`text-sm ${mutedText}`}>{copy.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className={`${cardClass} p-5 xl:col-span-2`}>
            <SectionHeading title={copy.trend} hint={copy.trendHint} isDarkMode={isDarkMode} />
            <DailyTrendChart daily={data.daily} isDarkMode={isDarkMode} language={language} />
          </section>
          <section className={`${cardClass} p-5`}>
            <SectionHeading title={copy.types} isDarkMode={isDarkMode} />
            <DistributionList items={data.by_incident_type} total={data.total} colors={TYPE_COLORS} isDarkMode={isDarkMode} />
          </section>
          <section className={`${cardClass} p-5 xl:col-span-3`}>
            <SectionHeading title={copy.weather} hint={copy.weatherHint} icon={<CloudSun size={18} />} isDarkMode={isDarkMode} />
            <DistributionList items={data.by_weather_condition} total={data.total} colors={['#0ea5e9', '#14b8a6', '#6366f1', '#f59e0b', '#64748b']} isDarkMode={isDarkMode} columns />
          </section>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: 'blue' | 'red' | 'cyan' | 'violet'; isDarkMode: boolean }> = ({ icon, label, value, color, isDarkMode }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500', red: 'bg-red-500/10 text-red-500',
    cyan: 'bg-cyan-500/10 text-cyan-500', violet: 'bg-violet-500/10 text-violet-500',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className={`mb-4 inline-flex rounded-xl p-2.5 ${colors[color]}`}>{icon}</div>
      <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value.toLocaleString()}</div>
      <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
    </div>
  );
};

const SectionHeading: React.FC<{ title: string; hint?: string; icon?: React.ReactNode; isDarkMode: boolean }> = ({ title, hint, icon, isDarkMode }) => (
  <div className="mb-5 flex items-start gap-2">
    {icon && <span className="mt-0.5 text-blue-500">{icon}</span>}
    <div>
      <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {hint && <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  </div>
);

const DistributionList: React.FC<{ items: StatisticsCountItem[]; total: number; colors: string[]; isDarkMode: boolean; columns?: boolean }> = ({ items, total, colors, isDarkMode, columns }) => (
  <div className={columns ? 'grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2' : 'space-y-5'}>
    {items.map((item, index) => {
      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      const color = colors[index % colors.length];
      return (
        <div key={`${item.label}-${index}`}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className={`truncate font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
            <span className={`shrink-0 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.count} <span className={`ml-1 text-xs font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>({percentage}%)</span></span>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
          </div>
        </div>
      );
    })}
  </div>
);

const DailyTrendChart: React.FC<{ daily: ReportStatistics['daily']; isDarkMode: boolean; language: Language }> = ({ daily, isDarkMode, language }) => {
  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 42, left: 42 };
  const maxCount = Math.max(1, ...daily.map((item) => item.count));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = daily.map((item, index) => ({
    ...item,
    x: padding.left + (daily.length === 1 ? plotWidth / 2 : (index / (daily.length - 1)) * plotWidth),
    y: padding.top + plotHeight - (item.count / maxCount) * plotHeight,
  }));
  const locale = language === Language.BS ? 'bs-BA' : language === Language.JA ? 'ja-JP' : 'en-GB';
  const labelIndexes = new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1]);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label="Incident reports by day">
        {[0, 1, 2, 3, 4].map((step) => {
          const y = padding.top + (step / 4) * plotHeight;
          const value = Math.round(maxCount - (step / 4) * maxCount);
          return (
            <g key={step}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill={isDarkMode ? '#64748b' : '#94a3b8'}>{value}</text>
            </g>
          );
        })}
        {points.length > 1 && <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((point, index) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke={isDarkMode ? '#0f172a' : '#fff'} strokeWidth="3">
              <title>{`${point.date}: ${point.count}`}</title>
            </circle>
            {labelIndexes.has(index) && (
              <text x={point.x} y={height - 13} textAnchor="middle" fontSize="11" fill={isDarkMode ? '#94a3b8' : '#64748b'}>
                {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(`${point.date}T00:00:00`))}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default StatisticsDashboard;
