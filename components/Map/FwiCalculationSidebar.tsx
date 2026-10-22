import { SavedSupplementaryCalculation } from './SavedSupplementaryCalculation';
import { SupplementaryIndexSummary } from './SupplementaryIndexCalculations';
import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { FwiParameterComparison } from './FwiParameterComparison';
import { BOSNIAN_FWI_FORMULAS } from '../../lib/fwi/bosnianFwi';
import { FwiCanadianSteps as CanadianSteps } from './FwiCanadianSteps';
import type { CanadianFwiStep } from '../../lib/fwi/canadianFwi';
import { apiRequest } from '../../services/api';
import { fetchFwiAvailability, fetchFireIntelligenceGrid, type FireWeatherProduct } from '../../services/fireMonitoringService';
import { fetchFwiWeather, inspectFwiWeather, FWI_SAMPLE_LOCATIONS, sarajevoDate, type FwiLocation } from '../../services/fwiCalculationService';

type Inspection = ReturnType<typeof inspectFwiWeather>;
type AuditPoint = { lat: number; lng: number; calculation: CanadianFwiStep };
interface Props {
  isSuperAdmin: boolean; date: string; location: FwiLocation | null;
  onDateChange: (date: string) => void; onPickLocation: () => void; onClose: () => void;
}
const number = (value: number | undefined | null) => value == null ? '—' : value.toFixed(3);
const rowsClass = 'w-full text-xs [&_td]:border-b [&_td]:border-slate-800 [&_td]:py-2 [&_td:last-child]:text-right [&_td:last-child]:font-mono';

export function FwiCalculationSidebar({ isSuperAdmin, date, location, onDateChange, onPickLocation, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'calculations' | 'comparison'>('calculations');
  const [mode, setMode] = useState<'point' | 'average'>('point');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastWeatherRefresh, setLastWeatherRefresh] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [products, setProducts] = useState<FireWeatherProduct[]>([]);
  const [archive, setArchive] = useState<{ value: number | null; point?: [number, number]; audit?: CanadianFwiStep; message?: string } | null>(null);
  const [archiveError, setArchiveError] = useState('');
  const targets = mode === 'average' ? FWI_SAMPLE_LOCATIONS : location ? [location] : [];
  const targetSignature = JSON.stringify(targets);

  useEffect(() => {
    if (!isSuperAdmin || date !== sarajevoDate()) return;
    const timer = window.setInterval(() => setRefreshVersion(version => version + 1), 15 * 60_000);
    return () => window.clearInterval(timer);
  }, [isSuperAdmin, date]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    const controller = new AbortController();
    fetchFwiAvailability(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setProducts(result.data);
      setAvailabilityLoaded(true);
      setArchiveError('');
    }).catch(reason => {
      if (controller.signal.aborted || reason.name === 'AbortError') return;
      setArchiveError(reason.message || 'Canadian archive is unavailable.');
    });
    return () => controller.abort();
  }, [isSuperAdmin, refreshVersion]);
  useEffect(() => {
    if (!isSuperAdmin || !targets.length) { setInspections([]); return; }
    let alive = true;
    setLoading(true); setError(''); setInspections([]); setSampleIndex(0);
    const request = refreshVersion ? fetchFwiWeather(targets, date, true, true) : fetchFwiWeather(targets, date, true);
    request.then(result => {
      if (alive) { setInspections(result.data.map(weather => inspectFwiWeather(weather, result))); setSource(result.source); setLastWeatherRefresh(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sarajevo', hour: '2-digit', minute: '2-digit' }).format(new Date())); }
    }).catch(reason => { if (alive) setError(reason.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isSuperAdmin, date, targetSignature, refreshVersion]);
  const latestSavedDate = products.reduce((latest, item) => item.valid_at.slice(0, 10) > latest ? item.valid_at.slice(0, 10) : latest, '');
  const product = products.find(item => item.valid_at.slice(0, 10) === date);
  useEffect(() => {
    if (!isSuperAdmin) return;
    let alive = true;
    const controller = new AbortController();
    setArchive(null);
    if (!product || (mode === 'point' && !location)) return;
    setArchiveError('');
    Promise.all([
      fetchFireIntelligenceGrid(product.id, controller.signal),
      apiRequest<{ data: AuditPoint[]; message?: string }>(`/admin/fwi/products/${product.id}/calculations`, { signal: controller.signal }),
    ]).then(([grid, audit]) => {
      if (!alive) return;
      const nearest = location ? [...grid.features].sort((a, b) => {
        const distance = (coords: number[]) => (coords[0] - location.lng) ** 2 + (coords[1] - location.lat) ** 2;
        return distance(a.geometry.coordinates) - distance(b.geometry.coordinates);
      })[0] : undefined;
      const point = nearest?.geometry.coordinates as [number, number] | undefined;
      const sample = targets[sampleIndex];
      const recorded = mode === 'average'
        ? [...audit.data].sort((a, b) => (a.lng - sample.lng) ** 2 + (a.lat - sample.lat) ** 2 - (b.lng - sample.lng) ** 2 - (b.lat - sample.lat) ** 2)[0]?.calculation
        : audit.data.find(item => point && Math.abs(item.lng - point[0]) < 1e-5 && Math.abs(item.lat - point[1]) < 1e-5)?.calculation;
      setArchive({ value: mode === 'average' ? product.statistics?.mean ?? null : nearest?.properties.value ?? null, point, audit: recorded, message: audit.message });
    }).catch(reason => { if (alive && reason.name !== 'AbortError') setArchiveError(reason.message); });
    return () => { alive = false; controller.abort(); };
  }, [isSuperAdmin, product?.id, mode, location?.lat, location?.lng, sampleIndex]);
  if (!isSuperAdmin) return null;
  const selected = inspections[sampleIndex];
  const displayedCanadian = date === sarajevoDate() ? selected?.currentCanadian : selected?.currentCanadian ?? selected?.canadian?.steps.at(-1);
  const mean = inspections.length ? inspections.reduce((sum, item) => sum + item.bosnian.fwi, 0) / inspections.length : null;
  return <aside aria-label="FWI calculation details" className="absolute bottom-0 left-14 top-0 z-[2600] hidden w-[calc(100%-3.5rem)] max-w-[460px] flex-col md:flex border-r border-slate-700 bg-slate-950/95 text-slate-200 shadow-2xl backdrop-blur">
    <div className="flex shrink-0 items-center justify-between border-b border-slate-800 p-5"><div><h2 className="font-bold text-white">FWI calculations</h2><p className="text-xs text-slate-400">Superadmin · Bosnian and Canadian</p></div><button aria-label="Close FWI calculations" onClick={onClose}><X size={20} /></button></div>
    <div role="tablist" aria-label="FWI calculator sections" className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-800 p-3">
      {(['calculations', 'comparison'] as const).map(tab => <button key={tab} id={`fwi-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={`fwi-panel-${tab}`} onClick={() => setActiveTab(tab)}
        className={`rounded-lg border px-2 py-2 text-xs font-bold ${activeTab === tab ? 'border-blue-500 bg-blue-600/20 text-blue-200' : 'border-slate-700 text-slate-400 hover:text-white'}`}>{tab === 'calculations' ? 'Calculations' : 'Formula comparison'}</button>)}
    </div>
    <div className="min-h-0 space-y-5 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-2">{(['point', 'average'] as const).map(value => <button key={value} onClick={() => setMode(value)} aria-pressed={mode === value} className={`rounded-lg border p-2 text-xs ${mode === value ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-slate-700'}`}>{value === 'point' ? 'Selected location' : 'National overview'}</button>)}</div>
      <label className="block text-xs">Calculation date<div className="mt-2 flex gap-2"><input aria-label="FWI calculation date" type="date" min="1940-02-01" max={sarajevoDate()} value={date} onChange={event => { if (event.target.value) onDateChange(event.target.value); }} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 p-2 text-white [color-scheme:dark]" /><button onClick={() => onDateChange(sarajevoDate())} className="rounded-lg border border-slate-700 px-3">Today</button></div></label>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="text-slate-400">{date === sarajevoDate() ? 'Current weather - refreshes every 15 minutes' : 'Historical weather'}{lastWeatherRefresh ? ` - fetched ${lastWeatherRefresh}` : ''}</p>
        <button type="button" disabled={loading} onClick={() => setRefreshVersion(version => version + 1)} className="shrink-0 rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-40">Refresh weather</button>
      </div>
      {products.length > 0 && <label className="block text-xs">Saved Canadian map dates (archive)<select aria-label="Saved Canadian FWI date" value={product ? date : ''} onChange={event => { if (event.target.value) onDateChange(event.target.value); }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"><option value="">Choose a saved date</option>{products.map(item => <option key={item.id} value={item.valid_at.slice(0, 10)}>{item.valid_at.slice(0, 10)}</option>)}</select></label>}
      {latestSavedDate && latestSavedDate < sarajevoDate() && <p className="text-xs text-amber-300">Saved map archive ends on {latestSavedDate}. Choose Today for the current-weather calculation; it does not require a saved map.</p>}
      {mode === 'point' ? <div><p className="mb-2 text-xs">{location ? `${location.name} · ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Select a location to inspect its FWI.'}</p><button onClick={onPickLocation} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><MapPin size={14} />Select location on map</button></div> : <p className="text-xs text-slate-400">Bosnian: arithmetic mean of {FWI_SAMPLE_LOCATIONS.length} map sampling locations, not an area-weighted national index. The parameter comparison below uses the selected individual sample for both formulas. The saved Canadian raster mean is a separate reference.</p>}
      {loading && <p role="status" className="text-sm text-blue-300">Loading calculation inputs…</p>}
      {error && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-300">{error}</p>}
      {selected && <>
        {mode === 'average' && <label className="block text-xs">Inspect an individual sample<select aria-label="FWI sample location" value={sampleIndex} onChange={event => setSampleIndex(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-2">{targets.map((target, index) => <option key={index} value={index}>{target.name} · FWI {number(inspections[index]?.bosnian.fwi)}</option>)}</select></label>}
        <div role="tabpanel" id="fwi-panel-comparison" aria-labelledby="fwi-tab-comparison" hidden={activeTab !== 'comparison'}>
        <FwiParameterComparison supplementaryInputs={selected.supplementaryInputs} key={`${date}:${targetSignature}:${sampleIndex}:${selected.observationTime}`} inputs={selected.comparisonInputs}
          observationTime={selected.observationTime} locationName={targets[sampleIndex]?.name ?? 'Selected location'} />
        </div>
        <div role="tabpanel" id="fwi-panel-calculations" aria-labelledby="fwi-tab-calculations" hidden={activeTab !== 'calculations'} className="space-y-5">
        <section className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4"><h3 className="text-sm font-bold text-purple-300">Bosnian NFFIS FWI · original formula</h3><div className="my-3 text-3xl font-bold text-white">{number(mode === 'average' ? mean : selected.bosnian.fwi)}</div><p className="text-xs text-slate-400">{source} · {selected.observationTime} · Europe/Sarajevo</p></section>

        <section><h3 className="mb-2 text-sm font-bold">Inputs and intermediate values{mode === 'average' ? ` · ${targets[sampleIndex]?.name}` : ''}</h3><table className={rowsClass}><tbody>{[
          ['Temperature (°C)', selected.bosnian.temperatureC], ['Humidity (%)', selected.bosnian.humidityPct], ['Wind (km/h)', selected.bosnian.windKmh], ['Dry days (< 2 mm)', selected.bosnian.dryDays],
          ['ISI estimate', selected.bosnian.isi], ['BUI estimate', selected.bosnian.bui], ['Drought function fD', selected.bosnian.droughtFunction], ['B = 0.1 × ISI × fD', selected.bosnian.initialSpread], ['Point FWI', selected.bosnian.fwi],
        ].map(([label, value]) => <tr key={label}><td>{label}</td><td>{number(value as number)}</td></tr>)}</tbody></table></section>
        <details><summary className="cursor-pointer text-sm font-bold">Daily precipitation and dry-day count</summary><p className="my-2 text-xs text-slate-400">{selected.precipitationDays[0]?.date} – {selected.precipitationDays.at(-1)?.date}. Current-day calculations retain the original window, including forecast days; historical calculations use only dates through the selected day.</p><table className={rowsClass}><tbody>{selected.precipitationDays.map(day => <tr key={day.date}><td>{day.date}</td><td>{day.rainMm.toFixed(2)} mm</td><td>{day.dry ? 'Dry' : 'Wet'}</td></tr>)}</tbody></table></details>
        <details><summary className="cursor-pointer text-sm font-bold">Original formula</summary><ol className="mt-3 space-y-3 text-xs text-slate-300">{BOSNIAN_FWI_FORMULAS.map(formula => <li key={formula} className="rounded-lg bg-slate-900 p-2 font-mono">{formula}</li>)}</ol><p className="mt-2 text-xs text-slate-400">The original NFFIS estimates of ISI and BUI are distinct from the stateful Canadian moisture codes.</p></details>
      <section className="rounded-xl border border-emerald-500/30 p-4"><h3 className="text-sm font-bold text-emerald-200">Daily Angstr?m, GFDI and KBDI</h3><SupplementaryIndexSummary inputs={selected.supplementaryInputs} /><p className="mt-2 text-xs text-slate-400">13:00 Angstr?m, noon GFDI and daily KBDI for this location. KBDI replays {selected.supplementaryInputs.replayedDays} available days; saved raster values can differ. Open Formula comparison to inspect or edit these inputs.</p></section>
      {displayedCanadian && <section className="space-y-3">
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"><h3 className="text-sm font-bold text-orange-300">Canadian FWI - {date === sarajevoDate() ? 'current weather' : 'selected date'}</h3><div className="my-3 text-3xl font-bold text-white">{number(displayedCanadian.fwi)}</div><p className="text-xs text-slate-400">{source} - {displayedCanadian.time} - Europe/Sarajevo. {targets[sampleIndex]?.name}. Previous moisture codes come from the available daily replay. This calculation uses the displayed weather hour.</p></div>
        <h3 className="text-sm font-bold">Canadian inputs and intermediate values</h3>
        <CanadianSteps step={displayedCanadian} />
      </section>}
      </div>
      </>}
      <div hidden={activeTab !== 'calculations'} className="space-y-5">
      <details className="rounded-xl border border-slate-700 p-4"><summary className="cursor-pointer text-sm font-bold text-slate-300">Saved Canadian map (optional reference)</summary><h3 className="text-sm font-bold text-orange-300">Canadian FWI COG · saved product</h3>{archiveError ? <p role="alert" className="mt-2 text-xs text-red-300">{archiveError}</p> : !availabilityLoaded ? <p role="status" className="mt-2 text-xs">Checking saved map dates...</p> : !product ? <><p className="mt-2 text-xs">No Canadian COG is saved for {date}.</p><p className="mt-2 text-xs text-slate-400">This refers only to the saved map archive. The Formula comparison tab calculates Canadian FWI directly and does not require a saved raster.</p></> : archive ? <><div className="my-3 text-3xl font-bold text-white">{number(archive.value)}</div><p className="mb-3 text-xs text-slate-400">{mode === 'average' ? 'Saved grid mean; detailed inputs below are for the grid point nearest the selected Bosnian sample' : `Nearest saved grid point: ${archive.point?.[1].toFixed(4)}, ${archive.point?.[0].toFixed(4)}`} · {product.valid_at}</p>{archive.audit ? <CanadianSteps step={archive.audit} /> : <p className="text-xs text-amber-300">{archive.message || 'Exact input records are unavailable for this older Canadian product.'} New products retain weather inputs, previous moisture codes and all intermediate indices.</p>}</> : <p role="status" className="mt-2 text-xs">Loading saved product…</p>}</details>
      <SavedSupplementaryCalculation date={date} location={targets[sampleIndex] ?? null} national={mode === 'average'} />
      {selected && !displayedCanadian && <p role="status" className="text-xs text-amber-300">Canadian current-weather calculation requires a complete 24-hour rainfall window. Use the Formula comparison tab to enter the missing parameter.</p>}
      {selected?.canadian && <details><summary className="cursor-pointer text-sm font-bold">Canadian point recalculation · {targets[sampleIndex]?.name}</summary><p className="my-3 text-xs text-slate-400">Independent replay of the available local-noon weather observations, initialized with FFMC 85, DMC 6 and DC 15. This is not the saved COG value; its weather window and initial state can differ.</p><div className="text-lg font-bold">FWI {number(selected.canadian.fwi)}</div><p className="my-2 text-xs">{selected.canadian.observationCount} daily updates. FFMC → DMC → DC → ISI → BUI → FWI.</p>{selected.canadian.steps.map(step => <details key={step.time} className="mt-2 rounded-lg border border-slate-800 p-2"><summary className="cursor-pointer text-xs">{step.time} · FWI {number(step.fwi)}</summary><CanadianSteps step={step} /></details>)}</details>}
      </div>
    </div>
  </aside>;
}
