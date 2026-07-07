import React from 'react';
import type { DatasetLayer } from '../../../services/datasetService';

interface SourceTabProps {
  layer: DatasetLayer;
}

export const SourceTab: React.FC<SourceTabProps> = ({ layer }) => {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Provider</h3>
        <div className="space-y-2">
          <SourceRow label="Storage" value="PostGIS" />
          <SourceRow label="Driver" value={layer.source_driver || 'Unknown'} />
          <SourceRow label="Schema" value={layer.table_schema} />
          <SourceRow label="Table" value={layer.table_name} />
        </div>
      </section>

      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Source Path</h3>
        <div className="break-words rounded border border-slate-800 bg-slate-950 p-3 text-xs font-semibold leading-relaxed text-slate-300">
          {layer.source_path || 'Unknown'}
        </div>
      </section>

      <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">Coordinate Reference</h3>
        <div className="space-y-2">
          <SourceRow label="SRID" value={String(layer.srid)} />
          <SourceRow label="Geometry" value={layer.geometry_type || layer.geometry_family} />
        </div>
      </section>
    </div>
  );
};

function SourceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 text-xs">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="min-w-0 break-words font-semibold text-slate-200">{value}</span>
    </div>
  );
}
