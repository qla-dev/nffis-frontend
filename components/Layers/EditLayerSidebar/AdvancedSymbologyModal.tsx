import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Paintbrush, Shuffle, X } from 'lucide-react';
import type {
  DatasetFilterValue,
  DatasetLayer,
  DatasetLayerCategoryStyle,
  DatasetLayerField,
  DatasetLayerRenderer,
  DatasetLayerStyle,
} from '../../../services/datasetService';
import {
  fetchDatasetLayerFields,
  fetchDatasetLayerFieldValues,
} from '../../../services/datasetService';

interface AdvancedSymbologyModalProps {
  layer: DatasetLayer;
  onClose: () => void;
  onPreviewStyle: (style: DatasetLayerStyle) => void;
  onSaveStyle: (style: DatasetLayerStyle) => Promise<void>;
}

const RENDERER_OPTIONS: Array<{ value: DatasetLayerRenderer; label: string }> = [
  { value: 'none', label: 'No Symbols' },
  { value: 'single', label: 'Single Symbol' },
  { value: 'categorized', label: 'Categorized' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'rule', label: 'Rule-based' },
  { value: 'merged', label: 'Merged Features' },
  { value: 'inverted', label: 'Inverted Polygons' },
  { value: 'embedded', label: 'Embedded Symbols' },
];

const COLOR_RAMPS: Record<string, string[]> = {
  random: [
    '#8b5cf6',
    '#ef4444',
    '#f59e0b',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#ec4899',
    '#84cc16',
  ],
  spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
  forest: ['#14532d', '#15803d', '#22c55e', '#84cc16', '#bef264', '#65a30d', '#166534', '#052e16'],
  civic: ['#2563eb', '#0891b2', '#0d9488', '#65a30d', '#ca8a04', '#ea580c', '#dc2626', '#9333ea'],
};

const FALLBACK_FIELDS: DatasetLayerField[] = [
  { name: 'id', type: 'integer', kind: 'number', editable: false },
];

export const AdvancedSymbologyModal: React.FC<AdvancedSymbologyModalProps> = ({
  layer,
  onClose,
  onPreviewStyle,
  onSaveStyle,
}) => {
  const initialStyle = layer.style || {};
  const initialCategories = initialStyle.categorized?.categories || [];
  const [renderer, setRenderer] = useState<DatasetLayerRenderer>(initialStyle.renderer || 'single');
  const [fields, setFields] = useState<DatasetLayerField[]>(FALLBACK_FIELDS);
  const [field, setField] = useState(initialStyle.categorized?.field || '');
  const [symbolColor, setSymbolColor] = useState(initialStyle.fillColor || initialStyle.color || '#8b5cf6');
  const [strokeColor, setStrokeColor] = useState(initialStyle.color || '#334155');
  const [fillOpacity, setFillOpacity] = useState(initialStyle.fillOpacity ?? 0.5);
  const [weight, setWeight] = useState(initialStyle.weight ?? 1.2);
  const [colorRamp, setColorRamp] = useState(initialStyle.categorized?.colorRamp || 'random');
  const [categories, setCategories] = useState<DatasetLayerCategoryStyle[]>(initialCategories);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingFields(true);

    fetchDatasetLayerFields(layer.id)
      .then((items) => {
        if (!isMounted) return;
        setFields(items.length > 0 ? items : FALLBACK_FIELDS);

        if (items.length > 0) {
          const preferred = items.find((item) => item.name !== 'id' && item.kind === 'text') || items.find((item) => item.name !== 'id') || items[0];
          setField((previous) => previous || preferred.name);
        }
      })
      .catch(() => {
        if (isMounted) setFields(FALLBACK_FIELDS);
      })
      .finally(() => {
        if (isMounted) setIsLoadingFields(false);
      });

    return () => {
      isMounted = false;
    };
  }, [layer.id]);

  const draftStyle = useMemo<DatasetLayerStyle>(() => {
    const next: DatasetLayerStyle = {
      ...initialStyle,
      renderer,
      color: strokeColor,
      fillColor: symbolColor,
      markerColor: symbolColor,
      fillOpacity,
      weight,
    };

    if (renderer === 'categorized') {
      next.categorized = {
        field,
        colorRamp,
        categories,
      };
    } else {
      delete next.categorized;
    }

    return next;
  }, [categories, colorRamp, field, fillOpacity, initialStyle, renderer, strokeColor, symbolColor, weight]);

  const classify = async () => {
    if (!field) {
      setError('Choose a value field first.');
      return;
    }

    setRenderer('categorized');
    setIsClassifying(true);
    setError(null);

    try {
      const values = await fetchDatasetLayerFieldValues(layer.id, field, 500);
      setCategories(buildCategories(values, colorRamp, {
        fillOpacity,
        weight,
      }));
    } catch {
      setError('Unable to classify this field.');
    } finally {
      setIsClassifying(false);
    }
  };

  const randomize = () => {
    setCategories((previous) => previous.map((category, index) => {
      const color = colorForIndex(index, colorRamp, true);

      return {
        ...category,
        color,
        fillColor: color,
      };
    }));
  };

  const updateCategory = (index: number, patch: Partial<DatasetLayerCategoryStyle>) => {
    setCategories((previous) => previous.map((category, categoryIndex) => (
      categoryIndex === index ? { ...category, ...patch } : category
    )));
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSaveStyle(draftStyle);
      onClose();
    } catch {
      setError('Unable to save symbology.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-slate-950/70 p-6">
      <div className="flex h-[min(760px,calc(100vh-48px))] w-[min(980px,calc(100vw-48px))] flex-col overflow-hidden rounded-md border border-slate-700 bg-slate-100 text-slate-950 shadow-2xl">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Paintbrush size={18} className="text-emerald-600" />
            <div className="min-w-0 truncate text-sm font-bold">
              Layer Properties - {layer.display_name} - Symbology
            </div>
          </div>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_280px] overflow-hidden">
          <main className="min-h-0 overflow-y-auto border-r border-slate-300 bg-white p-3">
            <div className="space-y-2">
              <FormRow label="Renderer">
                <select
                  value={renderer}
                  onChange={(event) => setRenderer(event.target.value as DatasetLayerRenderer)}
                  className="h-8 w-full border border-slate-400 bg-white px-2 text-xs outline-none focus:border-blue-500"
                >
                  {RENDERER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </FormRow>

              <FormRow label="Value">
                <select
                  value={field}
                  onChange={(event) => setField(event.target.value)}
                  disabled={isLoadingFields}
                  className="h-8 w-full border border-slate-400 bg-white px-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  {fields.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.kind === 'number' ? '123' : 'abc'}&nbsp;&nbsp;{item.name}
                    </option>
                  ))}
                </select>
              </FormRow>

              <FormRow label="Symbol">
                <div className="grid grid-cols-[1fr_34px] gap-1">
                  <input
                    value={symbolColor}
                    onChange={(event) => setSymbolColor(event.target.value)}
                    className="h-8 border border-slate-400 px-2 font-mono text-xs outline-none focus:border-blue-500"
                  />
                  <input
                    type="color"
                    value={symbolColor}
                    onChange={(event) => setSymbolColor(event.target.value)}
                    className="h-8 w-8 border border-slate-400 bg-white p-0.5"
                  />
                </div>
              </FormRow>

              <FormRow label="Color ramp">
                <select
                  value={colorRamp}
                  onChange={(event) => setColorRamp(event.target.value)}
                  className="h-8 w-full border border-slate-400 bg-white px-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="random">Random colors</option>
                  <option value="spectral">Spectral</option>
                  <option value="forest">Forest</option>
                  <option value="civic">Civic</option>
                </select>
              </FormRow>
            </div>

            <div className="mt-3 flex items-center gap-2 border-y border-slate-300 bg-slate-50 px-2 py-2">
              <button
                type="button"
                onClick={classify}
                disabled={isClassifying}
                className="h-8 rounded border border-slate-400 bg-white px-3 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
              >
                {isClassifying ? 'Classifying...' : 'Classify'}
              </button>
              <button
                type="button"
                onClick={randomize}
                disabled={categories.length === 0}
                className="flex h-8 items-center gap-1 rounded border border-slate-400 bg-white px-3 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
              >
                <Shuffle size={13} />
                Randomize
              </button>
              <span className="ml-auto text-xs text-slate-500">{categories.length} categories</span>
            </div>

            <div className="min-h-[360px] overflow-auto border-b border-slate-300">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100">
                  <tr className="border-b border-slate-300 text-left">
                    <th className="w-10 px-2 py-1 font-semibold">Symbol</th>
                    <th className="w-44 px-2 py-1 font-semibold">Value</th>
                    <th className="px-2 py-1 font-semibold">Legend</th>
                    <th className="w-20 px-2 py-1 font-semibold">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={`${category.value}-${index}`} className="border-b border-slate-200 hover:bg-blue-50">
                      <td className="px-2 py-1">
                        <input
                          type="color"
                          value={category.fillColor || category.color}
                          onChange={(event) => {
                            const color = event.target.value;
                            updateCategory(index, { color, fillColor: color });
                          }}
                          className="h-6 w-8 border border-slate-400 bg-white p-0.5"
                        />
                      </td>
                      <td className="max-w-[180px] truncate px-2 py-1" title={category.value}>
                        {category.value || 'Blank'}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={category.label}
                          onChange={(event) => updateCategory(index, { label: event.target.value })}
                          className="h-7 w-full border border-transparent bg-transparent px-2 outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={category.enabled !== false}
                          onChange={(event) => updateCategory(index, { enabled: event.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-12 text-center text-sm font-semibold text-slate-500">
                        Choose a value field and classify to create categories.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>

          <aside className="bg-slate-50 p-3">
            <div className="rounded border border-slate-300 bg-white p-3">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Layer Rendering</div>
              <RangeRow label="Fill opacity" value={fillOpacity} min={0} max={1} step={0.05} onChange={setFillOpacity} />
              <RangeRow label="Line weight" value={weight} min={0.5} max={8} step={0.5} onChange={setWeight} />
              <ColorRow label="Stroke" value={strokeColor} onChange={setStrokeColor} />
            </div>

            <div className="mt-3 rounded border border-slate-300 bg-white p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Preview</div>
              <div className="flex h-28 items-center justify-center rounded border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                <div
                  className="h-16 w-28 border"
                  style={{
                    borderColor: strokeColor,
                    borderWidth: weight,
                    backgroundColor: hexToRgba(symbolColor, fillOpacity),
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}
          </aside>
        </div>

        <footer className="flex h-12 shrink-0 items-center justify-end gap-2 border-t border-slate-300 bg-slate-100 px-4">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded border border-slate-400 bg-white px-4 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onPreviewStyle(draftStyle)}
            className="h-8 rounded border border-slate-400 bg-white px-4 text-xs font-semibold hover:bg-slate-50"
          >
            Apply Preview
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className="flex h-8 items-center gap-2 rounded border border-blue-700 bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

function buildCategories(
  values: DatasetFilterValue[],
  ramp: string,
  defaults: Pick<DatasetLayerCategoryStyle, 'fillOpacity' | 'weight'>
): DatasetLayerCategoryStyle[] {
  return values.map((entry, index) => {
    const value = String(entry.value ?? '');
    const color = colorForIndex(index, ramp);

    return {
      value,
      label: value || 'Blank',
      color,
      fillColor: color,
      fillOpacity: defaults.fillOpacity,
      weight: defaults.weight,
      enabled: true,
      count: entry.count,
    };
  });
}

function colorForIndex(index: number, ramp: string, randomize = false): string {
  if (randomize) {
    const hue = (index * 137.508 + Date.now() / 97) % 360;
    return hslToHex(hue, 74, 56);
  }

  const colors = COLOR_RAMPS[ramp] || COLOR_RAMPS.random;
  if (ramp === 'random') {
    return hslToHex((index * 137.508) % 360, 74, 56);
  }

  return colors[index % colors.length];
}

function hslToHex(h: number, s: number, l: number): string {
  const lightness = l / 100;
  const saturation = s / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((item) => item + item).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
      <span className="font-semibold text-slate-900">{label}</span>
      {children}
    </label>
  );
}

function RangeRow({
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
    <label className="mb-3 block text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[1fr_40px] items-center gap-2 text-xs">
      <span className="font-semibold text-slate-700">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-10 border border-slate-300 bg-white p-1"
      />
    </label>
  );
}
