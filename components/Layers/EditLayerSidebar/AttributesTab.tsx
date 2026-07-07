import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type { DatasetLayer } from '../../../services/datasetService';

interface AttributesTabProps {
  layer: DatasetLayer;
  selectedFeature?: GeoJSON.Feature | null;
  isSaving: boolean;
  saveError?: string | null;
  onSave: (attributes: Record<string, unknown>) => Promise<void>;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({
  layer,
  selectedFeature,
  isSaving,
  saveError,
  onSave,
}) => {
  const sourceProperties = useMemo(
    () => ({ ...((selectedFeature?.properties || {}) as Record<string, unknown>) }),
    [selectedFeature]
  );
  const [draft, setDraft] = useState<Record<string, unknown>>(sourceProperties);

  useEffect(() => {
    setDraft(sourceProperties);
  }, [sourceProperties]);

  const featureId = selectedFeature?.id ?? sourceProperties.id;
  const fields = Object.keys(draft).filter((field) => field !== 'id' && field !== 'geom');
  const dirty = JSON.stringify(cleanAttributes(draft)) !== JSON.stringify(cleanAttributes(sourceProperties));

  const updateField = (field: string, rawValue: string | boolean) => {
    const originalValue = sourceProperties[field];
    let nextValue: unknown = rawValue;

    if (typeof originalValue === 'number' && typeof rawValue === 'string') {
      nextValue = rawValue === '' ? '' : Number(rawValue);
    }

    setDraft((previous) => ({ ...previous, [field]: nextValue }));
  };

  if (!selectedFeature || featureId === undefined || featureId === null) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-slate-800 bg-slate-950/60 p-6 text-center">
        <div className="text-sm font-black text-slate-300">No polygon selected</div>
        <div className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
          Click a polygon on the map to edit its attributes.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Selected Polygon</h3>
        <div className="space-y-2 text-xs">
          <AttributeMeta label="Layer" value={layer.display_name} />
          <AttributeMeta label="Feature ID" value={String(featureId)} />
          <AttributeMeta label="Fields" value={String(fields.length)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-800 bg-slate-950/60">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">
          Attributes
        </div>
        <div className="divide-y divide-slate-800">
          {fields.map((field) => {
            const value = draft[field];
            const originalValue = sourceProperties[field];

            return (
              <label key={field} className="grid grid-cols-[116px_1fr] gap-2 px-3 py-2 text-xs">
                <span className="min-w-0 truncate pt-2 font-bold text-slate-500" title={field}>
                  {field}
                </span>
                {typeof originalValue === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => updateField(field, event.target.checked)}
                    className="mt-2 h-4 w-4 accent-blue-600"
                  />
                ) : isLongValue(value) ? (
                  <textarea
                    value={toInputValue(value)}
                    onChange={(event) => updateField(field, event.target.value)}
                    rows={3}
                    className="min-h-20 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/70"
                  />
                ) : (
                  <input
                    type={typeof originalValue === 'number' ? 'number' : 'text'}
                    value={toInputValue(value)}
                    onChange={(event) => updateField(field, event.target.value)}
                    className="h-9 min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/70"
                  />
                )}
              </label>
            );
          })}
        </div>
      </section>

      {saveError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-200">
          {saveError}
        </div>
      )}

      <button
        type="button"
        disabled={!dirty || isSaving}
        onClick={() => onSave(cleanAttributes(draft))}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-500/40 bg-blue-600 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950 disabled:text-slate-600"
      >
        <Save size={15} />
        {isSaving ? 'Saving...' : 'Save Attributes'}
      </button>
    </div>
  );
};

function AttributeMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="min-w-0 break-words font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function cleanAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attributes).filter(([field]) => field !== 'id' && field !== 'geom')
  );
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function isLongValue(value: unknown): boolean {
  return toInputValue(value).length > 80;
}
