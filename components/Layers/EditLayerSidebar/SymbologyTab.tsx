import React, { useEffect, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { DatasetLayer, DatasetLayerStyle } from '../../../services/datasetService';
import { AdvancedSymbologyModal } from './AdvancedSymbologyModal';

interface SymbologyTabProps {
  layer: DatasetLayer;
  onUpdateLayerStyle: (style: DatasetLayerStyle) => void;
  onSaveLayerStyle: (style: DatasetLayerStyle) => Promise<void>;
}

export const SymbologyTab: React.FC<SymbologyTabProps> = ({
  layer,
  onUpdateLayerStyle,
  onSaveLayerStyle,
}) => {
  const [style, setStyle] = useState<DatasetLayerStyle>(layer.style || {});
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setStyle(layer.style || {});
  }, [layer.id, layer.style]);

  const resolved = useMemo(() => ({
    color: style.color || style.markerColor || '#2563eb',
    fillColor: style.fillColor || style.color || '#93c5fd',
    markerColor: style.markerColor || style.color || '#2563eb',
    strokeColor: style.strokeColor || '#0f172a',
    opacity: style.opacity ?? 0.86,
    fillOpacity: style.fillOpacity ?? (layer.geometry_family === 'polygon' ? 0.22 : 0),
    weight: style.weight ?? (layer.geometry_family === 'line' ? 2 : 1.4),
    radius: style.radius ?? 5,
  }), [layer.geometry_family, style]);

  const updateStyle = (patch: DatasetLayerStyle) => {
    const next = { ...style, ...patch };
    setStyle(next);
    onUpdateLayerStyle(next);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Symbol</h3>
        <div className="space-y-3">
          <ColorControl
            label="Stroke"
            value={resolved.color}
            onChange={(value) => updateStyle({ color: value })}
          />
          <ColorControl
            label="Fill"
            value={resolved.fillColor}
            onChange={(value) => updateStyle({ fillColor: value })}
          />
          <ColorControl
            label="Marker"
            value={resolved.markerColor}
            onChange={(value) => updateStyle({ markerColor: value })}
          />
          <ColorControl
            label="Point outline"
            value={resolved.strokeColor}
            onChange={(value) => updateStyle({ strokeColor: value })}
          />
        </div>
      </section>

      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Rendering</h3>
        <div className="space-y-4">
          <RangeControl
            label="Opacity"
            value={resolved.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => updateStyle({ opacity: value })}
          />
          <RangeControl
            label="Fill opacity"
            value={resolved.fillOpacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => updateStyle({ fillOpacity: value })}
          />
          <RangeControl
            label="Weight"
            value={resolved.weight}
            min={0.5}
            max={8}
            step={0.5}
            onChange={(value) => updateStyle({ weight: value })}
          />
          <RangeControl
            label="Point radius"
            value={resolved.radius}
            min={2}
            max={16}
            step={1}
            onChange={(value) => updateStyle({ radius: value })}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => setAdvancedOpen(true)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-500/40 bg-blue-600 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-blue-500"
      >
        <Settings2 size={15} />
        Advanced Symbology
      </button>

      {advancedOpen && (
        <AdvancedSymbologyModal
          layer={{ ...layer, style }}
          onClose={() => setAdvancedOpen(false)}
          onPreviewStyle={updateStyle}
          onSaveStyle={async (nextStyle) => {
            await onSaveLayerStyle(nextStyle);
            setStyle(nextStyle);
            onUpdateLayerStyle(nextStyle);
          }}
        />
      )}
    </div>
  );
};

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[96px_1fr_40px] items-center gap-2 text-xs">
      <span className="font-bold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500/70"
      />
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-10 cursor-pointer rounded-md border border-slate-800 bg-slate-950 p-1"
      />
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-500">{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-8 w-20 rounded-md border border-slate-800 bg-slate-950 px-2 text-right font-mono text-xs text-slate-200 outline-none focus:border-blue-500/70"
        />
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-blue-500"
      />
    </label>
  );
}
