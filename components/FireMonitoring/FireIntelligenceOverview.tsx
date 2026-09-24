import { useEffect, useMemo, useRef, useState } from 'react';
import { fromArrayBuffer } from 'geotiff';
import { AlertTriangle, Database, Download, Loader2 } from 'lucide-react';
import {
  buildFuelModel, fetchFireIntelligenceCog, fetchFireIntelligenceHealth,
  fetchFireIntelligenceProducts, fetchFuelModels, reviewFuelModel,
  type FireIntelligenceHealth, type FireWeatherProduct, type FuelModelVersion,
} from '../../services/fireMonitoringService';
import { classifyEffisFwi, effisFwiGradientColor, EFFIS_FWI_CLASSES } from '../../lib/fwi/effisFwiScale';

export function FireIntelligenceOverview({ isDarkMode, canRun, canReview }: { isDarkMode: boolean; canRun: boolean; canReview: boolean }) {
  const [health, setHealth] = useState<FireIntelligenceHealth | null>(null);
  const [products, setProducts] = useState<FireWeatherProduct[]>([]);
  const [fuel, setFuel] = useState<FuelModelVersion[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [reviewNote, setReviewNote] = useState('');
  const load = (signal?: AbortSignal) => Promise.all([fetchFireIntelligenceHealth(signal), fetchFireIntelligenceProducts(signal), fetchFuelModels(signal)]).then(([h, p, f]) => { setHealth(h); setProducts(p.data); setFuel(f.data); });
  useEffect(() => { const controller = new AbortController(); void load(controller.signal).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); }); return () => controller.abort(); }, []);
  const fwi = useMemo(() => products.filter(product => product.index_type === 'FWI').sort((a, b) => a.forecast_day - b.forecast_day).slice(0, 4), [products]);
  const panel = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">Fire Intelligence: {error}</div>;
  if (!health) return <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/>Loading BiH intelligence...</div>;

  return <section className={`rounded-xl border p-4 ${panel}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-widest text-orange-500">National coverage · advisory</div><h2 className="mt-1 text-lg font-black">Bosnia and Herzegovina Fire Intelligence</h2></div><div className={`rounded-full px-3 py-1 text-xs font-bold ${health.readiness.ready ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{health.readiness.ready ? 'Inputs ready' : `${health.readiness.blocking_gaps.length} blocking gaps`}</div></div>
    {!health.readiness.ready && <div className="mt-3 text-sm text-amber-500"><AlertTriangle className="mr-1 inline" size={15}/>Missing: {health.readiness.blocking_gaps.join(', ')}</div>}
    <div className="mt-4 grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map(day => { const product = fwi.find(item => item.forecast_day === day); const value = product?.statistics?.mean; const danger = value === undefined ? null : classifyEffisFwi(value); return <div key={day} className="rounded-lg bg-slate-500/5 p-3"><div className="text-xs font-bold text-slate-500">{day ? `Day +${day}` : 'Today'} FWI</div><div className="mt-1 flex items-baseline gap-2"><span className="text-xl font-black">{value === undefined ? '—' : value.toFixed(1)}</span>{danger && <span className="text-[10px] font-black uppercase" style={{ color: danger.color }}>{danger.label}</span>}</div><div className="text-[10px] font-bold text-slate-400">EFFIS Europe scale</div><div className="text-[11px] text-slate-500">{product ? `${product.quality_state} · ${new Date(product.valid_at).toLocaleString()}` : 'No product'}</div></div>; })}</div>
    {fwi[0] && <DangerCogMap product={fwi[0]} />}
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span><Database className="mr-1 inline" size={13}/>Fuel: {fuel[0] ? `${fuel[0].version} (${fuel[0].status})` : 'not built'}</span><span>Pending review: {health.runs.pending_review}</span><span>Processing: {health.runs.processing}</span><span className={health.runs.failed ? 'text-red-500' : ''}>Failed: {health.runs.failed}</span></div>
    {canRun && !fuel.some(item => ['draft', 'processing', 'review_required'].includes(item.status)) && <button disabled={busy || !health.readiness.ready} onClick={() => { setBusy(true); void buildFuelModel().then(() => load()).catch(reason => setError(reason.message)).finally(() => setBusy(false)); }} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Build provisional BiH fuel model</button>}
    {fuel[0]?.status === 'review_required' && <details className="mt-4 rounded-lg border border-slate-500/30 p-3">
      <summary className="cursor-pointer text-sm font-bold">Fuel crosswalk review ({fuel[0].crosswalk.length} entries)</summary>
      <div className="mt-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">All entries begin as <strong>Awaiting institutional review</strong>. They change only when an authorized Forestry Service or Civil Protection reviewer records evidence and signs; generation alone is not approval.</div>
      <div className="mt-3 space-y-2">{fuel[0].crosswalk.map(entry => <div key={entry.source_class} className="grid grid-cols-[1fr_1fr] gap-2 rounded bg-slate-500/5 p-2 text-xs"><span>Source {entry.source_class}</span><strong>{entry.fuel_class}</strong><span className="col-span-2 text-slate-500">{entry.evidence || 'No evidence note'} · {entry.review_status || 'awaiting institutional review'}</span></div>)}</div>
      {canReview && <><textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} rows={2} className="mt-3 w-full rounded border border-slate-500/40 bg-transparent p-2 text-sm" placeholder="Evidence/reviewer note required"/><div className="mt-2 flex gap-2"><button disabled={busy || !reviewNote.trim()} onClick={() => { setBusy(true); void reviewFuelModel(fuel[0].id, 'approved', reviewNote, fuel[0].crosswalk.map(entry => ({ source_class: entry.source_class, status: 'approved', note: reviewNote }))).then(() => { setReviewNote(''); return load(); }).catch(reason => setError(reason.message)).finally(() => setBusy(false)); }} className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve entries and sign</button><button disabled={busy || !reviewNote.trim()} onClick={() => { setBusy(true); void reviewFuelModel(fuel[0].id, 'rejected', reviewNote).then(() => load()).catch(reason => setError(reason.message)).finally(() => setBusy(false)); }} className="rounded bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject</button></div><div className="mt-2 text-xs text-slate-500">Final approval requires separate Forestry Service and Civil Protection sign-offs.</div></>}
    </details>}
  </section>;
}

function DangerCogMap({ product }: { product: FireWeatherProduct }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [meta, setMeta] = useState<{ width: number; height: number; aspect: number } | null>(null); const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (!product.artifact_urls) return;
    const controller = new AbortController();
    void fetchFireIntelligenceCog(product.id, controller.signal).then(async buffer => {
      const tiff = await fromArrayBuffer(buffer); const image = await tiff.getImage(); const width = image.getWidth(); const height = image.getHeight();
      const values = await image.readRasters({ interleave: true }) as unknown as ArrayLike<number>; const nodata = Number(image.getGDALNoData());
      const box = image.getBoundingBox(); const middleLatitude = (box[1] + box[3]) / 2; const aspect = Math.max(.2, ((box[2] - box[0]) * Math.cos(middleLatitude * Math.PI / 180)) / Math.max(.0001, box[3] - box[1]));
      const target = canvas.current; if (!target) return; target.width = width; target.height = height; const context = target.getContext('2d'); if (!context) throw new Error('Canvas rendering is unavailable.'); const pixels = context.createImageData(width, height);
      for (let index = 0; index < width * height; index += 1) { const value = Number(values[index]); const missing = !Number.isFinite(value) || (Number.isFinite(nodata) && value === nodata); const hex = missing ? null : effisFwiGradientColor(value); const rgba = hex ? [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16), 235] : [0, 0, 0, 0]; pixels.data.set(rgba, index * 4); }
      context.putImageData(pixels, 0, 0); setMeta({ width, height, aspect }); setLoadError('');
    }).catch(reason => { if (reason.name !== 'AbortError') setLoadError(reason.message); });
    return () => controller.abort();
  }, [product.id, product.artifact_urls]);
  if (!product.artifact_urls) return <div className="mt-3 rounded-lg border border-dashed border-slate-500/30 p-3 text-xs text-slate-500">Today’s COG is withheld until the product is approved.</div>;
  return <div className="mt-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-bold uppercase text-slate-500">Approved BiH FWI COG · today</div><a href={product.artifact_urls.cog} className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:underline"><Download size={13}/>Download COG</a></div><div className="flex min-h-72 items-center justify-center rounded-lg bg-slate-950/10 p-3">{loadError ? <div className="text-xs text-red-500">{loadError}</div> : <div className="h-64 max-w-full" style={{ aspectRatio: meta?.aspect || 1.1 }}><canvas ref={canvas} className="h-full w-full rounded-sm [image-rendering:pixelated]" aria-label="BiH FWI Cloud Optimized GeoTIFF raster"/></div>}</div><div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">{EFFIS_FWI_CLASSES.map(item => <Legend key={item.key} color={item.color} label={item.label}/>) }{meta && <span>{meta.width}×{meta.height} source cells</span>}</div><div className="mt-1 text-[11px] text-slate-500">Rendered directly from the approved server COG with geographic aspect preserved; transparent cells are outside the imported Bosnia and Herzegovina boundary. Classification: current EFFIS Europe scale.</div></div>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }}/>{label}</span>; }
