import React from 'react';
import { Check, MousePointer2, Pencil, RotateCcw, Save, Share2, Trash2, Undo2 } from 'lucide-react';
import type { GeoEditorMode, Position } from '../../../lib/gis/geoEditor';

interface Props {
  mode: GeoEditorMode;
  drawing: Position[];
  snappingEnabled: boolean;
  newPolygonName: string;
  pendingChanges: number;
  selectedFeatureId: string | null;
  isSaving: boolean;
  error?: string | null;
  onModeChange: (mode: GeoEditorMode) => void;
  onSnappingChange: (enabled: boolean) => void;
  onNewPolygonNameChange: (name: string) => void;
  onUndoDrawing: () => void;
  onClearDrawing: () => void;
  onFinishDrawing: () => void;
  onSave: () => Promise<void>;
  onReset: () => void;
}

const MODES: Array<{ id: GeoEditorMode; label: string; icon: React.ElementType }> = [
  { id: 'view', label: 'Select', icon: MousePointer2 },
  { id: 'draw', label: 'Draw', icon: Pencil },
  { id: 'edit-single', label: 'Single', icon: MousePointer2 },
  { id: 'edit-shared', label: 'Shared', icon: Share2 },
];

export const GeoEditorTab: React.FC<Props> = ({
  mode, drawing, snappingEnabled, newPolygonName, pendingChanges, selectedFeatureId,
  isSaving, error, onModeChange, onSnappingChange, onNewPolygonNameChange,
  onUndoDrawing, onClearDrawing, onFinishDrawing, onSave, onReset,
}) => (
  <div className="space-y-4">
    <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Editing mode</div>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onModeChange(id)} className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-bold transition-colors ${mode === id ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
    </section>

    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs font-bold text-slate-300">
      Snap to visible vertices
      <input type="checkbox" checked={snappingEnabled} onChange={(event) => onSnappingChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />
    </label>

    {mode === 'draw' && (
      <section className="space-y-3 rounded-lg border border-pink-500/30 bg-pink-500/5 p-3">
        <p className="text-xs leading-5 text-slate-300">Click on the map to add points. Snapping uses vertices from the currently visible layer data.</p>
        <input value={newPolygonName} onChange={(event) => onNewPolygonNameChange(event.target.value)} placeholder="Polygon name" className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
        <div className="flex items-center justify-between text-xs text-slate-400"><span>{drawing.length} vertices</span><span>Minimum 3</span></div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onUndoDrawing} disabled={!drawing.length} className="flex items-center justify-center gap-1 rounded-md border border-slate-700 py-2 text-xs font-bold disabled:opacity-40"><Undo2 size={13} /> Undo</button>
          <button type="button" onClick={onClearDrawing} disabled={!drawing.length} className="flex items-center justify-center gap-1 rounded-md border border-slate-700 py-2 text-xs font-bold disabled:opacity-40"><Trash2 size={13} /> Clear</button>
          <button type="button" onClick={onFinishDrawing} disabled={drawing.length < 3 || !newPolygonName.trim()} className="flex items-center justify-center gap-1 rounded-md bg-pink-600 py-2 text-xs font-bold text-white disabled:opacity-40"><Check size={13} /> Finish</button>
        </div>
      </section>
    )}

    {mode === 'edit-single' && <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs leading-5 text-slate-300">{selectedFeatureId ? `Editing feature ${selectedFeatureId}.` : 'Click a polygon on the map first.'} {snappingEnabled ? 'Select a blue vertex, then an orange target vertex.' : 'Drag vertices freely.'} Right-click removes a vertex; purple points insert one.</div>}
    {mode === 'edit-shared' && <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs leading-5 text-slate-300">Dragging a shared vertex updates every polygon that uses exactly that coordinate. Right-click removes it; purple points insert a vertex.</div>}

    {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-200">{error}</div>}
    <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-300">Pending geometry changes</span><span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-black text-blue-300">{pendingChanges}</span></div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onReset} disabled={!pendingChanges || isSaving} className="flex items-center justify-center gap-2 rounded-md border border-slate-700 py-2 text-xs font-bold text-slate-300 disabled:opacity-40"><RotateCcw size={14} /> Reset</button>
        <button type="button" onClick={() => void onSave()} disabled={!pendingChanges || isSaving} className="flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-xs font-bold text-white disabled:opacity-40"><Save size={14} /> {isSaving ? 'Saving…' : 'Save'}</button>
      </div>
    </section>
  </div>
);
