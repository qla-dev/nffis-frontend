import React, { useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { Language } from '../../types';
import { aoiStatistics, type MultiPolygon, type PdrResults } from '../../services/pdrService';
import { pdrText } from '../../lib/pdr/i18n';
import { PerimeterMap, drawingToGeometry } from './PerimeterMap';
import { PdrResultsView } from './PdrResultsView';
import { ErrorBox, errorText } from './PdrReportPage';

/** AOI statistics and analytical tools (FC_PDR12, acceptance PDR7). */
export function AoiTool({ language, isDarkMode }: { language: Language; isDarkMode: boolean }) {
  const t = pdrText(language);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [results, setResults] = useState<PdrResults | null>(null);
  const [fileGeometry, setFileGeometry] = useState<MultiPolygon | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const geometry = drawingToGeometry(points);
  const run = async (input: Parameters<typeof aoiStatistics>[0]) => {
    setBusy(true); setError('');
    try { const response = (await aoiStatistics(input)).data; setResults(response.results); if (input.file) setFileGeometry(response.geometry); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4" data-testid="pdr-aoi">
      <p className="text-sm text-slate-500">{t.aoiHelp}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold">{points.length} {t.vertices}</span>
        <button type="button" onClick={() => setPoints(current => current.slice(0, -1))} disabled={!points.length} className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-1 text-xs font-bold disabled:opacity-50"><Undo2 size={13} />{t.undoVertex}</button>
        <button type="button" onClick={() => { setPoints([]); setResults(null); }} disabled={!points.length} className="rounded bg-slate-500/10 px-2 py-1 text-xs font-bold disabled:opacity-50">{t.clearDrawing}</button>
        <button type="button" disabled={busy || !geometry} onClick={() => { setFileGeometry(null); void run({ geometry: geometry! }); }} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />}{t.runAoi}</button>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-500/10 px-3 py-2 text-xs font-bold">
          {t.uploadFile}
          <input type="file" accept=".zip,.kml,.kmz,.geojson,.json" className="hidden" data-testid="aoi-file" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) { setPoints([]); void run({ file }); } }} />
        </label>
      </div>
      <PerimeterMap geometry={fileGeometry} drawing={points} onAddVertex={(vertex) => { setPoints(current => [...current, vertex]); setFileGeometry(null); setResults(null); }} height={420} label="AOI" />
      {error && <ErrorBox message={error} />}
      {results && <PdrResultsView results={results} language={language} isDarkMode={isDarkMode} />}
    </div>
  );
}
