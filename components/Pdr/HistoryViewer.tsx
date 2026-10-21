import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Language } from '../../types';
import { fetchHotspotsForDate, fetchTimeSeriesCatalogue, timeSeriesRasterUrl, type TimeSeriesLayer } from '../../services/timeSeriesService';
import { CogRasterLayer, FWI_COG_STYLE, supplementaryIndexCogStyle, type CogRasterStyle } from '../Map/layers/Rasters/CogRasterLayer';
import type { SupplementaryIndexType } from '../../lib/fwi/supplementaryIndices';
import { bilingual, formatNumber, pdrText } from '../../lib/pdr/i18n';
import { ErrorBox, errorText } from './PdrReportPage';

const BIH_BOUNDS: [[number, number], [number, number]] = [[42.55, 15.72], [45.28, 19.62]];

function rasterStyle(layer: TimeSeriesLayer): CogRasterStyle {
  if (layer.key === 'fwi') return FWI_COG_STYLE;
  if (layer.group === 'fire_danger') return supplementaryIndexCogStyle(layer.key.toUpperCase() as SupplementaryIndexType);
  return { scale: (layer.scale || 'dryness') as CogRasterStyle['scale'], min: layer.min ?? 0, max: layer.max ?? 1 };
}

/** Calendar/timeline inspection of historized rasters and hotspot detections (FC_PDR11, acceptance PDR5). */
export function HistoryViewer({ language, isDarkMode }: { language: Language; isDarkMode: boolean }) {
  const t = pdrText(language);
  const [layers, setLayers] = useState<TimeSeriesLayer[] | null>(null);
  const [layerKey, setLayerKey] = useState('');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hotspots, setHotspots] = useState<GeoJSON.FeatureCollection<GeoJSON.Point, { id: number; sensor: string | null; source: string; detected_at: string; frp: number | null; confidence: number | null }> | null>(null);
  const [error, setError] = useState('');
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';

  useEffect(() => {
    const controller = new AbortController();
    fetchTimeSeriesCatalogue(365, controller.signal).then(response => {
      setLayers(response.data);
      const first = response.data.find(layer => layer.dates.length > 0) || response.data[0];
      if (first) { setLayerKey(first.key); setIndex(Math.max(0, first.dates.length - 1)); }
    }).catch(reason => { if (reason.name !== 'AbortError') setError(errorText(reason)); });
    return () => controller.abort();
  }, []);

  const layer = useMemo(() => layers?.find(item => item.key === layerKey) || null, [layers, layerKey]);
  const entry = layer?.dates[index] || null;

  useEffect(() => {
    setHotspots(null);
    if (!layer || layer.type !== 'points' || !entry) return;
    const controller = new AbortController();
    fetchHotspotsForDate(entry.date, controller.signal).then(setHotspots).catch(reason => { if (reason.name !== 'AbortError') setError(errorText(reason)); });
    return () => controller.abort();
  }, [layer?.key, entry?.date]);

  useEffect(() => {
    if (!playing || !layer) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % Math.max(1, layer.dates.length)), 1500);
    return () => window.clearInterval(timer);
  }, [playing, layer]);

  if (!layers) return error ? <ErrorBox message={error} /> : <Loader2 className="animate-spin text-slate-400" />;
  const rasterUrl = layer && entry ? timeSeriesRasterUrl(layer, entry) : null;
  const groups: TimeSeriesLayer['group'][] = ['fire_danger', 'vegetation', 'detections'];

  return (
    <div className="space-y-4" data-testid="pdr-history">
      <p className="text-sm text-slate-500">{t.historyHelp}</p>
      {error && <ErrorBox message={error} />}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className={`space-y-3 rounded-xl border p-3 ${panel}`}>
          {groups.map(group => {
            const items = layers.filter(item => item.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-500">{t.historyGroups[group]}</div>
                {items.map(item => (
                  <button key={item.key} type="button" disabled={!item.dates.length} onClick={() => { setPlaying(false); setLayerKey(item.key); setIndex(Math.max(0, item.dates.length - 1)); }}
                    className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${item.key === layerKey ? 'bg-blue-600 text-white' : 'hover:bg-slate-500/10'} disabled:opacity-40`} aria-pressed={item.key === layerKey}>
                    <span>{bilingual(item.label, language)}</span>
                    <span className="text-[11px] opacity-80">{item.dates.length}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <div className="space-y-3">
          {layer && layer.dates.length > 0 && entry ? (
            <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${panel}`}>
              <button type="button" aria-label={t.previous} onClick={() => setIndex(current => Math.max(0, current - 1))} disabled={index === 0} className="rounded-lg bg-slate-500/10 p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(value => !value)} className="rounded-lg bg-blue-600 p-2 text-white">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
              <button type="button" aria-label={t.next} onClick={() => setIndex(current => Math.min(layer.dates.length - 1, current + 1))} disabled={index >= layer.dates.length - 1} className="rounded-lg bg-slate-500/10 p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
              <input type="date" aria-label={t.historyDate} value={entry.date} min={layer.dates[0].date} max={layer.dates[layer.dates.length - 1].date}
                onChange={event => { const found = layer.dates.findIndex(item => item.date === event.target.value); if (found >= 0) { setPlaying(false); setIndex(found); } }}
                className="pdr-input w-auto" />
              <input type="range" aria-label={t.historyTimeline} min={0} max={layer.dates.length - 1} value={index} onChange={event => { setPlaying(false); setIndex(Number(event.target.value)); }} className="min-w-40 flex-1" />
              <span className="text-sm font-bold tabular-nums" data-testid="history-summary">
                {layer.type === 'points'
                  ? `${formatNumber(hotspots?.features.length ?? entry.count ?? 0, 0, language)} ${t.historyDetections}`
                  : entry.mean !== undefined && entry.mean !== null ? `${t.historyMean}: ${formatNumber(entry.mean, 1, language)}` : entry.title || ''}
              </span>
            </div>
          ) : <div className={`rounded-xl border border-dashed p-4 text-sm text-slate-500 ${panel}`}>{t.historyNoDates}</div>}

          <div className="overflow-hidden rounded-xl border border-slate-500/30" style={{ height: 520 }}>
            <MapContainer bounds={BIH_BOUNDS} className="h-full w-full" scrollWheelZoom>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
              {layer?.type === 'raster' && rasterUrl && <CogRasterLayer key={rasterUrl} url={rasterUrl} pane="overlayPane" style={rasterStyle(layer)} />}
              {layer?.type === 'points' && hotspots?.features.map(feature => {
                const [lon, lat] = feature.geometry.coordinates;
                const frp = feature.properties.frp ?? 0;
                return (
                  <CircleMarker key={feature.properties.id} center={[lat, lon]} radius={Math.min(14, 4 + Math.sqrt(frp))} pathOptions={{ color: '#7f1d1d', weight: 1, fillColor: frp > 50 ? '#dc2626' : '#f97316', fillOpacity: 0.8 }}>
                    <Tooltip>{feature.properties.sensor || feature.properties.source} · {new Date(feature.properties.detected_at).toLocaleTimeString()} · FRP {formatNumber(frp, 1, language)} MW</Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
