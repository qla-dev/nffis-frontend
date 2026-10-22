import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { fetchDailyIndexAvailability, fetchFireIntelligenceGrid } from '../../services/fireMonitoringService';
import { SUPPLEMENTARY_INDICES, type SupplementaryIndexType } from '../../lib/fwi/supplementaryIndices';
import type { FwiLocation } from '../../services/fwiCalculationService';

export function SavedSupplementaryCalculation({ date, location, national }: { date: string; location: FwiLocation | null; national: boolean }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SupplementaryIndexType>('ANGSTROM');
  const [result, setResult] = useState<{ value: number | null; point?: number[]; audit?: Record<string, string | number>; message?: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !location) return;
    const controller = new AbortController();
    setResult(null); setError('');
    void (async () => {
      const products = await fetchDailyIndexAvailability(type, controller.signal);
      const product = products.data.find(item => item.valid_at.slice(0, 10) === date);
      if (!product) { if (!controller.signal.aborted) setResult({ value: null, message: `No saved ${type} product for ${date}.` }); return; }
      const [grid, audit] = await Promise.all([
        fetchFireIntelligenceGrid(product.id, controller.signal),
        apiRequest<{ data: Array<{ lat: number; lng: number; calculation: Record<string, string | number> }>; message?: string }>(`/admin/fwi/products/${product.id}/calculations`, { signal: controller.signal }),
      ]);
      const nearest = [...grid.features].sort((a, b) => {
        const distance = (point: number[]) => (point[0] - location.lng) ** 2 + (point[1] - location.lat) ** 2;
        return distance(a.geometry.coordinates) - distance(b.geometry.coordinates);
      })[0];
      const point = nearest?.geometry.coordinates;
      const record = audit.data.find(row => point && Math.abs(row.lng - point[0]) < 1e-5 && Math.abs(row.lat - point[1]) < 1e-5);
      if (!controller.signal.aborted) setResult({ value: national ? product.statistics?.mean ?? null : nearest?.properties.value ?? null, point, audit: record?.calculation, message: audit.message });
    })().catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [open, date, type, location?.lat, location?.lng, national]);
  return <section className="rounded-xl border border-slate-700 p-4">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="text-left text-sm font-bold">Saved Angström, GFDI and KBDI maps</button>
    {open && <div className="mt-3 space-y-3 text-xs">
      <label>Saved index<select aria-label="Saved supplementary index" value={type} onChange={event => setType(event.target.value as SupplementaryIndexType)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2">{Object.values(SUPPLEMENTARY_INDICES).map(index => <option key={index.type} value={index.type}>{index.label.en}</option>)}</select></label>
      {!location ? <p>Select a location first.</p> : error ? <p role="alert" className="text-red-300">{error}</p> : !result ? <p role="status">Loading saved index…</p> : <>
        <p>{date} · {national ? 'Saved national grid mean' : 'Nearest saved grid point'}: <output aria-label="Saved supplementary value">{result.value == null ? '—' : result.value.toFixed(3)}</output>{type === 'KBDI' ? ' mm' : ''}</p>
        {result.point && <p className="text-slate-400">Audit point: {result.point[1].toFixed(4)}, {result.point[0].toFixed(4)}. {national ? 'Detailed inputs below belong to this individual grid point, not to the national mean.' : ''}</p>}
        {result.audit ? <table aria-label="Saved supplementary calculation inputs" className="w-full [&_td]:border-b [&_td]:border-slate-800 [&_td]:py-2 [&_td:last-child]:text-right"><tbody>{Object.entries(result.audit).map(([key, value]) => <tr key={key}><td>{key.replace(/([A-Z])/g, ' $1')}</td><td>{typeof value === 'number' ? value.toFixed(3) : value}</td></tr>)}</tbody></table> : <p className="text-amber-200">{result.message || 'Exact inputs are unavailable for this older product. The saved raster value is retained; it is not replaced with a new calculation.'}</p>}
      </>}
    </div>}
  </section>;
}
