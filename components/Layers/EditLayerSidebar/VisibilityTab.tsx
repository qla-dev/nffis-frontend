import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Search, X } from 'lucide-react';
import type {
  DatasetFilterOption,
  DatasetLayer,
  DatasetLayerFilterState,
} from '../../../services/datasetService';
import { fetchDatasetLayerFilterOptions } from '../../../services/datasetService';

interface VisibilityTabProps {
  layer: DatasetLayer;
  active: boolean;
  filter?: DatasetLayerFilterState;
  onToggleLayer: (layerId: number) => void;
  onUpdateFilter: (layerId: number, filter: DatasetLayerFilterState) => void;
  onClearFilter: (layerId: number) => void;
}

function filterCount(filter?: DatasetLayerFilterState): number {
  if (!filter) return 0;

  return Object.values(filter.values || {}).reduce((total, values) => total + values.length, 0)
    + Object.values(filter.min || {}).filter(Boolean).length
    + Object.values(filter.max || {}).filter(Boolean).length
    + (filter.q?.trim() ? 1 : 0);
}

export const VisibilityTab: React.FC<VisibilityTabProps> = ({
  layer,
  active,
  filter,
  onToggleLayer,
  onUpdateFilter,
  onClearFilter,
}) => {
  const [options, setOptions] = useState<DatasetFilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchDatasetLayerFilterOptions(layer.id)
      .then((fields) => {
        if (isMounted) setOptions(fields);
      })
      .catch(() => {
        if (isMounted) setOptions([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [layer.id]);

  const currentFilter = filter || {};
  const count = filterCount(currentFilter);

  const updateFilter = (next: DatasetLayerFilterState) => {
    onUpdateFilter(layer.id, next);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border text-xs font-black uppercase tracking-[0.16em] transition-colors ${
          active
            ? 'border-blue-500/40 bg-blue-600/15 text-blue-100'
            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
        }`}
        onClick={() => onToggleLayer(layer.id)}
      >
        {active ? <Eye size={16} /> : <EyeOff size={16} />}
        {active ? 'Visible' : 'Hidden'}
      </button>

      <div className="space-y-3">
        <div className="flex h-10 items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 text-slate-400 focus-within:border-blue-500/70">
          <Search size={16} />
          <input
            value={currentFilter.q || ''}
            onChange={(event) => updateFilter({ ...currentFilter, q: event.target.value })}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            placeholder="Search attributes"
          />
        </div>

        {isLoading ? (
          <div className="p-3 text-sm font-bold text-slate-500">Loading filters...</div>
        ) : options.length === 0 ? (
          <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm font-bold text-slate-500">
            No indexed filters
          </div>
        ) : (
          <div className="space-y-4">
            {options.map((option) => (
              <FilterField
                key={option.name}
                option={option}
                filter={currentFilter}
                onChange={updateFilter}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={count === 0}
        onClick={() => onClearFilter(layer.id)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-950 text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X size={15} />
        Clear {count > 0 ? count : ''} Filters
      </button>
    </div>
  );
};

interface FilterFieldProps {
  option: DatasetFilterOption;
  filter: DatasetLayerFilterState;
  onChange: (filter: DatasetLayerFilterState) => void;
}

const FilterField: React.FC<FilterFieldProps> = ({ option, filter, onChange }) => {
  const selectedValues = filter.values?.[option.name] || [];

  if (option.kind === 'range') {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            {option.name}
          </h4>
          <span className="text-[10px] font-bold text-slate-600">Range</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={filter.min?.[option.name] || ''}
            onChange={(event) => onChange({
              ...filter,
              min: { ...(filter.min || {}), [option.name]: event.target.value },
            })}
            className="h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/70"
            placeholder={option.min !== null && option.min !== undefined ? String(option.min) : 'Min'}
          />
          <input
            value={filter.max?.[option.name] || ''}
            onChange={(event) => onChange({
              ...filter,
              max: { ...(filter.max || {}), [option.name]: event.target.value },
            })}
            className="h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/70"
            placeholder={option.max !== null && option.max !== undefined ? String(option.max) : 'Max'}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
          {option.name}
        </h4>
        <span className="text-[10px] font-bold text-slate-600">{selectedValues.length}</span>
      </div>
      <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
        {(option.values || []).slice(0, 80).map((entry) => {
          const value = String(entry.value ?? '');
          const checked = selectedValues.includes(value);

          return (
            <button
              key={`${option.name}-${value}`}
              type="button"
              onClick={() => {
                const nextValues = checked
                  ? selectedValues.filter((item) => item !== value)
                  : [...selectedValues, value];

                onChange({
                  ...filter,
                  values: {
                    ...(filter.values || {}),
                    [option.name]: nextValues,
                  },
                });
              }}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                checked
                  ? 'border-blue-500/50 bg-blue-600/10'
                  : 'border-transparent bg-slate-950/70 hover:border-slate-800'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700'}`}>
                {checked && <Check size={11} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-300">{value || 'Blank'}</span>
              <span className="text-[10px] font-bold text-slate-600">{entry.count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
