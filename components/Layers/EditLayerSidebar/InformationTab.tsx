import React, { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { DatasetLayer } from '../../../services/datasetService';
import { updateDatasetLayerDataDelivery, updateDatasetLayerMetadata } from '../../../services/datasetService';

interface InformationTabProps {
  layer: DatasetLayer;
  canEdit: boolean;
  canManageDataDelivery: boolean;
  onLayerUpdated?: (layer: DatasetLayer) => void;
}

export const InformationTab: React.FC<InformationTabProps> = ({ layer, canEdit, canManageDataDelivery, onLayerUpdated }) => {
  const bounds = layer.bounds;
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(layer.display_name);
  const [category, setCategory] = useState(layer.category);
  const [subcategory, setSubcategory] = useState(layer.subcategory || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Drop any half-finished edit when the sidebar switches to another layer.
  useEffect(() => {
    setIsEditing(false);
    setDisplayName(layer.display_name);
    setCategory(layer.category);
    setSubcategory(layer.subcategory || '');
    setError(null);
  }, [layer.id, layer.display_name, layer.category, layer.subcategory]);

  const canSave = displayName.trim() !== '' && category.trim() !== '' && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateDatasetLayerMetadata(layer.id, {
        display_name: displayName.trim(),
        category: category.trim(),
        subcategory: subcategory.trim() === '' ? null : subcategory.trim(),
      });
      onLayerUpdated?.(updated);
      setIsEditing(false);
    } catch {
      setError('Layer information could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(layer.display_name);
    setCategory(layer.category);
    setSubcategory(layer.subcategory || '');
    setError(null);
    setIsEditing(false);
  };

  const handleDataDeliveryChange = async (dataDelivery: NonNullable<DatasetLayer['data_delivery']>) => {
    if (dataDelivery === (layer.data_delivery || 'geojson')) return;

    setIsSavingDelivery(true);
    try {
      onLayerUpdated?.(await updateDatasetLayerDataDelivery(layer.id, dataDelivery));
    } catch {
      setError('Layer delivery mode could not be saved.');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">General</h3>
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 rounded-md border border-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <Pencil size={11} />
              Edit
            </button>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-md border border-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <X size={11} />
              Cancel
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <EditRow label="Name" value={displayName} onChange={setDisplayName} placeholder="Layer name" />
            <EditRow label="Category" value={category} onChange={setCategory} placeholder="Category" />
            <EditRow
              label="Subcategory"
              value={subcategory}
              onChange={setSubcategory}
              placeholder="Optional"
            />

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs font-bold text-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="h-9 w-full rounded-md bg-blue-600 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save information'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <InfoRow label="Name" value={layer.display_name} />
            <InfoRow label="Category" value={layer.category} />
            <InfoRow label="Subcategory" value={layer.subcategory || 'None'} />
            <InfoRow label="Layer ID" value={String(layer.id)} />
            <InfoRow label="Features" value={layer.feature_count.toLocaleString()} />
          </div>
        )}
      </section>

      <Section title="Geometry">
        <InfoRow label="Family" value={layer.geometry_family} />
        <InfoRow label="Type" value={layer.geometry_type || 'Unknown'} />
        <InfoRow label="SRID" value={String(layer.srid)} />
      </Section>

      {canManageDataDelivery && (
        <Section title="Data delivery">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-400">
            Renderer input
            <select
              value={layer.data_delivery || 'geojson'}
              disabled={isSavingDelivery}
              onChange={(event) => void handleDataDeliveryChange(event.target.value as NonNullable<DatasetLayer['data_delivery']>)}
              className="h-9 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs font-bold text-white outline-none focus:border-blue-500/70 disabled:opacity-50"
            >
              <option value="geojson">GeoJSON (standard)</option>
              <option value="vector_tile">Vector tiles (experimental)</option>
            </select>
          </label>
          <p className="text-[11px] font-medium leading-5 text-slate-500">
            Vector tiles load the visible map tiles only. Use them for large layers with id and geometry columns.
          </p>
        </Section>
      )}

      <Section title="Bounds">
        {bounds ? (
          <>
            <InfoRow label="West" value={bounds.minx.toFixed(6)} />
            <InfoRow label="South" value={bounds.miny.toFixed(6)} />
            <InfoRow label="East" value={bounds.maxx.toFixed(6)} />
            <InfoRow label="North" value={bounds.maxy.toFixed(6)} />
          </>
        ) : (
          <div className="text-xs font-bold text-slate-600">No bounds available</div>
        )}
      </Section>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 text-xs">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="min-w-0 break-words font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function EditRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid grid-cols-[96px_1fr] items-center gap-3 text-xs">
      <span className="font-bold text-slate-500">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/70"
      />
    </label>
  );
}
