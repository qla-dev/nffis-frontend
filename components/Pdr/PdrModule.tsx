import React, { useEffect, useState } from 'react';
import { Calculator, FileText, Flame, History, Map as MapIcon, RefreshCw } from 'lucide-react';
import { Language } from '../../types';
import { pdrText } from '../../lib/pdr/i18n';
import { AoiTool } from './AoiTool';
import { CoefficientMatrix } from './CoefficientMatrix';
import { DataSyncStatus } from './DataSyncStatus';
import { HistoryViewer } from './HistoryViewer';
import { IncidentManager } from './IncidentManager';
import { PdrReportList } from './PdrReportList';
import { PdrReportPage } from './PdrReportPage';
import { navigatePdr, parsePdrHash, type PdrRoute } from './pdrRoute';

interface Props {
  language: Language;
  isDarkMode: boolean;
  canCreate: boolean;
  canReview: boolean;
  canViewIncidents?: boolean;
  canUpdateIncidents?: boolean;
}

/** Preliminary Damage Report module shell with hash deep links (#/pdr/...). */
export default function PdrModule({ language, isDarkMode, canCreate, canReview, canViewIncidents = false, canUpdateIncidents = false }: Props) {
  const t = pdrText(language);
  const [route, setRoute] = useState<PdrRoute>(() => parsePdrHash(window.location.hash) || { page: 'list' });

  useEffect(() => {
    if (!parsePdrHash(window.location.hash)) navigatePdr('/pdr');
    const onHash = () => { const next = parsePdrHash(window.location.hash); if (next) setRoute(next); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const tab = (page: PdrRoute['page'], label: string, Icon: typeof FileText, path: string) => {
    const active = route.page === page || (page === 'list' && route.page === 'report');
    return <button type="button" onClick={() => navigatePdr(path)} aria-current={active ? 'page' : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${active ? 'bg-blue-600 text-white' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={15} />{label}</button>;
  };

  return (
    <div className={isDarkMode ? 'pdr-dark text-slate-100' : 'text-slate-900'} data-testid="pdr-module">
      <style>{`
        .pdr-input { border-radius: 0.5rem; border: 1px solid rgb(148 163 184 / 0.45); background: #fff; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #0f172a; }
        .pdr-input:not(.w-auto) { width: 100%; }
        .pdr-input.pl-9 { padding-left: 2.25rem; }
        .pdr-input:disabled { opacity: 0.7; }
        .pdr-dark .pdr-input { background: rgb(15 23 42); color: #e2e8f0; border-color: rgb(51 65 85); }
      `}</style>
      <p className="-mt-6 mb-5 text-sm text-slate-500">{t.subtitle}</p>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label={t.module}>
        {tab('list', t.reports, FileText, '/pdr')}
        {canViewIncidents && tab('incidents', t.incidents, Flame, '/pdr/incidents')}
        {tab('coefficients', t.coefficients, Calculator, '/pdr/coefficients')}
        {tab('aoi', t.aoi, MapIcon, '/pdr/aoi')}
        {tab('history', t.history, History, '/pdr/history')}
        {tab('sync', t.sync, RefreshCw, '/pdr/sync')}
      </nav>
      {route.page === 'list' && <PdrReportList language={language} isDarkMode={isDarkMode} canCreate={canCreate} />}
      {route.page === 'report' && <PdrReportPage key={`${route.id}`} reportId={route.id} step={route.step} language={language} isDarkMode={isDarkMode} />}
      {route.page === 'coefficients' && <CoefficientMatrix language={language} isDarkMode={isDarkMode} canEdit={canReview} />}
      {route.page === 'aoi' && <AoiTool language={language} isDarkMode={isDarkMode} />}
      {route.page === 'incidents' && canViewIncidents && <IncidentManager language={language} isDarkMode={isDarkMode} canUpdate={canUpdateIncidents} />}
      {route.page === 'history' && <HistoryViewer language={language} isDarkMode={isDarkMode} />}
      {route.page === 'sync' && <DataSyncStatus language={language} isDarkMode={isDarkMode} />}
    </div>
  );
}
