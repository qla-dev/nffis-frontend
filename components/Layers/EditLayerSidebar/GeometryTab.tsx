import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Magnet, MousePointer2, Pentagon, RotateCcw, Save, Square, Trash2, X } from 'lucide-react';
import type { DatasetGeometryMetadata, DatasetLayer } from '../../../services/datasetService';

interface GeometryTabProps {
  layer: DatasetLayer;
  selectedFeature?: GeoJSON.Feature | null;
  isSaving: boolean;
  saveError?: string | null;
  geometryMetadata?: DatasetGeometryMetadata | null;
  canUpdate: boolean;
  canCreate: boolean;
  isCreatingPolygon: boolean;
  drawingPointCount: number;
  drawingName: string;
  snappingEnabled: boolean;
  snapMessage?: string | null;
  onDrawingNameChange: (name: string) => void;
  onSnappingEnabledChange: (enabled: boolean) => void;
  onStartPolygonDrawing: () => void;
  onCancelPolygonDrawing: () => void;
  onUndoDrawingPoint: () => void;
  onClearDrawing: () => void;
  onSaveNewPolygon: () => Promise<void>;
  isMapEditing: boolean;
  onStartMapEditing: () => void;
  onStopMapEditing: () => void;
  onUndoVertex: () => void;
  onClearBoundary: () => void;
  onSave: (geometry: GeoJSON.Geometry, sourceSrid: number) => Promise<void>;
}

function validateGeometry(value: unknown): value is GeoJSON.Geometry {
  if (!value || typeof value !== 'object') return false;
  const geometry = value as { type?: unknown; coordinates?: unknown };
  return typeof geometry.type === 'string' && Array.isArray(geometry.coordinates);
}

export const GeometryTab: React.FC<GeometryTabProps> = ({
  layer,
  selectedFeature,
  isSaving,
  saveError,
  geometryMetadata,
  canUpdate,
  canCreate,
  isCreatingPolygon,
  drawingPointCount,
  drawingName,
  snappingEnabled,
  snapMessage,
  onDrawingNameChange,
  onSnappingEnabledChange,
  onStartPolygonDrawing,
  onCancelPolygonDrawing,
  onUndoDrawingPoint,
  onClearDrawing,
  onSaveNewPolygon,
  isMapEditing,
  onStartMapEditing,
  onStopMapEditing,
  onUndoVertex,
  onClearBoundary,
  onSave,
}) => {
  const [sourceSrid, setSourceSrid] = useState(4326);
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(selectedFeature?.geometry ? JSON.stringify(selectedFeature.geometry, null, 2) : '');
    setValidationError(null);
  }, [selectedFeature?.id, selectedFeature?.geometry]);

  const geometryType = useMemo(() => {
    try { return (JSON.parse(draft) as GeoJSON.Geometry)?.type || '—'; } catch { return '—'; }
  }, [draft]);

  const save = async () => {
    try {
      const parsed: unknown = JSON.parse(draft);
      if (!validateGeometry(parsed)) throw new Error('Expected a GeoJSON geometry with type and coordinates.');
      setValidationError(null);
      await onSave(parsed, sourceSrid);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Invalid GeoJSON geometry.');
    }
  };

  return (
    <div className="space-y-3">
      {canCreate && layer.geometry_family === 'polygon' && (
        <section className="space-y-3 rounded-md border border-amber-400/25 bg-amber-500/5 p-3">
          <div className="flex items-start gap-3"><div className="rounded bg-amber-500/15 p-2 text-amber-300"><Pentagon size={18} /></div><div><div className="text-sm font-black text-white">Nacrtaj novi poligon</div><div className="mt-1 text-xs text-slate-400">Mahala način crtanja: tačke, Undo, Clear, Finish i snap na postojeće granice.</div></div></div>
          {!isCreatingPolygon ? (
            <button type="button" onClick={onStartPolygonDrawing} className="flex w-full items-center justify-center gap-2 rounded bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950"><MousePointer2 size={15} />Počni crtanje</button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded border border-amber-400/25 bg-slate-950/50 px-3 py-2"><span className="text-xs font-black text-amber-200">{drawingPointCount} {drawingPointCount === 1 ? 'tačka' : 'tačaka'}</span><span className="text-[10px] text-slate-500">min. 3 · preporučeno 6+</span></div>
              <label className="flex cursor-pointer items-center justify-between rounded border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"><span className="flex items-center gap-2"><Magnet size={15} className="text-emerald-400" />Snap na vertex i segment</span><input type="checkbox" checked={snappingEnabled} onChange={(event) => onSnappingEnabledChange(event.target.checked)} /></label>
              {snapMessage && <div className="rounded border border-emerald-500/25 bg-emerald-500/10 p-2 text-xs text-emerald-200">{snapMessage}</div>}
              <div className="rounded border border-blue-500/25 bg-blue-500/10 p-2 text-xs text-blue-100">Klikaj po mapi da postaviš granicu poligona.</div>
              <div className="grid grid-cols-3 gap-2"><button type="button" disabled={!drawingPointCount} onClick={onUndoDrawingPoint} className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-800 py-2 text-xs font-bold disabled:opacity-40"><RotateCcw size={14} />Nazad</button><button type="button" disabled={!drawingPointCount} onClick={onClearDrawing} className="flex items-center justify-center gap-1 rounded border border-red-500/25 bg-red-500/10 py-2 text-xs font-bold text-red-200 disabled:opacity-40"><Trash2 size={14} />Očisti</button><button type="button" onClick={onCancelPolygonDrawing} className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900 py-2 text-xs font-bold"><X size={14} />Poništi</button></div>
              <input value={drawingName} onChange={(event) => onDrawingNameChange(event.target.value)} placeholder="Naziv novog poligona" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400" />
              <button type="button" disabled={drawingPointCount < 3 || !drawingName.trim() || isSaving} onClick={onSaveNewPolygon} className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 disabled:opacity-40"><CheckCircle2 size={15} />{isSaving ? 'Spremanje…' : drawingPointCount < 3 ? 'Izaberi minimalno 3 tačke' : 'Završi i spremi'}</button>
            </div>
          )}
        </section>
      )}

      {!selectedFeature && !isCreatingPolygon && <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">Za izmjenu postojeće geometrije odaberi poligon na mapi.</div>}
      {selectedFeature && canUpdate && <>
      <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-300">
        Coordinates use GeoJSON order <strong>[longitude, latitude]</strong>. Polygon holes and MultiPolygon parts are preserved. PostGIS validates, normalizes and calculates metrics after saving.
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1"><span className="text-slate-500">Input SRID</span><input type="number" min={1} value={sourceSrid} onChange={(event) => setSourceSrid(Number(event.target.value))} className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /></label>
        <div className="space-y-1"><span className="text-slate-500">Layer SRID</span><div className="rounded border border-slate-800 bg-slate-950/50 px-2 py-2">EPSG:{layer.srid}</div></div>
      </div>
      <div className="text-xs text-slate-500">Geometry type: <span className="font-bold text-slate-200">{geometryType}</span></div>
      {selectedFeature.geometry?.type === 'Polygon' && <div className="grid grid-cols-3 gap-2"><button type="button" onClick={isMapEditing ? onStopMapEditing : onStartMapEditing} className={`flex items-center justify-center gap-1 rounded border px-2 py-2 text-xs font-bold ${isMapEditing ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-slate-700 bg-slate-800 text-white'}`}>{isMapEditing ? <Square size={14} /> : <MousePointer2 size={14} />}{isMapEditing ? 'Finish' : 'Map edit'}</button><button type="button" disabled={!isMapEditing} onClick={onUndoVertex} className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-2 text-xs font-bold text-white disabled:opacity-40"><RotateCcw size={14} />Undo</button><button type="button" disabled={!isMapEditing} onClick={onClearBoundary} className="flex items-center justify-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-2 text-xs font-bold text-red-200 disabled:opacity-40"><Trash2 size={14} />Redraw</button></div>}
      {isMapEditing && <div className="rounded border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-100">Click the map to append boundary vertices. Existing holes remain unchanged.</div>}
      <textarea aria-label="GeoJSON geometry" spellCheck={false} value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[300px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-5 text-emerald-200 outline-none focus:border-blue-500" />
      {(validationError || saveError) && <div className="flex gap-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200"><AlertTriangle size={15} />{validationError || saveError}</div>}
      {geometryMetadata && <div className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300"><div className="mb-2 flex items-center gap-2 font-bold text-emerald-400"><CheckCircle2 size={15} />PostGIS result</div><div>{geometryMetadata.vertex_count} vertices</div><div>{Math.round(geometryMetadata.area_square_metres || 0).toLocaleString()} m² area</div><div>{Math.round(geometryMetadata.perimeter_metres || 0).toLocaleString()} m perimeter</div><div>{geometryMetadata.validity_reason || (geometryMetadata.is_valid ? 'Valid geometry' : 'Invalid geometry')}</div></div>}
      <button type="button" disabled={isSaving || !draft} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"><Save size={15} />{isSaving ? 'Saving geometry…' : 'Save geometry'}</button>
      </>}
    </div>
  );
};
