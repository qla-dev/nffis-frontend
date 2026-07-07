import React from 'react';
import type { DatasetLayer } from '../../../services/datasetService';

interface InformationTabProps {
  layer: DatasetLayer;
}

export const InformationTab: React.FC<InformationTabProps> = ({ layer }) => {
  const bounds = layer.bounds;

  return (
    <div className="space-y-4">
      <Section title="General">
        <InfoRow label="Name" value={layer.display_name} />
        <InfoRow label="Category" value={layer.category} />
        <InfoRow label="Subcategory" value={layer.subcategory || 'None'} />
        <InfoRow label="Layer ID" value={String(layer.id)} />
        <InfoRow label="Features" value={layer.feature_count.toLocaleString()} />
      </Section>

      <Section title="Geometry">
        <InfoRow label="Family" value={layer.geometry_family} />
        <InfoRow label="Type" value={layer.geometry_type || 'Unknown'} />
        <InfoRow label="SRID" value={String(layer.srid)} />
      </Section>

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
