import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Layers,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Pentagon,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  DatasetFilterOption,
  DatasetLayer,
  DatasetLayerFilterState,
} from '../../services/datasetService';
import { fetchDatasetLayerFilterOptions } from '../../services/datasetService';

interface DatasetLayerOverlayProps {
  isOpen: boolean;
  layers: DatasetLayer[];
  activeLayerIds: Set<number>;
  selectedLayerId: number | null;
  filters: Record<number, DatasetLayerFilterState>;
  isFilterPanelOpen: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onToggleLayer: (layerId: number) => void;
  onSelectLayer: (layerId: number) => void;
  onFilterPanelOpenChange: (isOpen: boolean) => void;
  onUpdateFilter: (layerId: number, filter: DatasetLayerFilterState) => void;
  onClearFilter: (layerId: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  administrative: 'Administrative',
  natural: 'Natural',
  hydrology: 'Hydrology',
  infrastructure: 'Infrastructure',
  hazards: 'Hazards',
  cadastral: 'Cadastral',
  information: 'Information',
};

function Toggle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
    >
      <span
        className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`}
      />
    </span>
  );
}

function GeometryIcon({ family, color }: { family: DatasetLayer['geometry_family']; color: string }) {
  if (family === 'point') {
    return <Circle size={14} style={{ color }} fill={color} />;
  }

  if (family === 'line') {
    return <LineChart size={15} style={{ color }} />;
  }

  return <Pentagon size={15} style={{ color }} fill={`${color}33`} />;
}

function filterCount(filter?: DatasetLayerFilterState): number {
  if (!filter) return 0;

  return Object.values(filter.values || {}).reduce((total, values) => total + values.length, 0)
    + Object.values(filter.min || {}).filter(Boolean).length
    + Object.values(filter.max || {}).filter(Boolean).length
    + (filter.q?.trim() ? 1 : 0);
}

export const DatasetLayerOverlay: React.FC<DatasetLayerOverlayProps> = ({
  isOpen,
  layers,
  activeLayerIds,
  selectedLayerId,
  filters,
  isFilterPanelOpen,
  isLoading,
  errorMessage,
  onClose,
  onToggleLayer,
  onSelectLayer,
  onFilterPanelOpenChange,
  onUpdateFilter,
  onClearFilter,
}) => {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showCatalog, setShowCatalog] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShowCatalog(true);
    }
  }, [isOpen]);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  const visibleLayers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return layers.filter((layer) => {
      if (!term) return true;

      return [
        layer.display_name,
        layer.table_name,
        layer.category,
        layer.subcategory || '',
        layer.geometry_type || '',
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [layers, search]);

  const layersByCategory = useMemo(() => {
    return visibleLayers.reduce<Record<string, DatasetLayer[]>>((groups, layer) => {
      const key = layer.category || 'information';
      groups[key] = groups[key] || [];
      groups[key].push(layer);
      return groups;
    }, {});
  }, [visibleLayers]);

  const sortedCategories = useMemo(
    () => Object.keys(layersByCategory).sort((a, b) => {
      const order = ['administrative', 'natural', 'hydrology', 'infrastructure', 'hazards', 'cadastral', 'information'];
      return (order.indexOf(a) === -1 ? 100 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 100 : order.indexOf(b));
    }),
    [layersByCategory]
  );

  if (!isOpen) {
    return null;
  }

  const activeCount = activeLayerIds.size;

  return (
    <div className="fixed inset-y-0 left-0 right-0 z-[3600] pointer-events-none md:left-14">
      <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
        <div
          className={`h-full border-r border-slate-800 bg-slate-900 text-slate-100 shadow-2xl shadow-black/50 transition-all duration-200 pointer-events-auto ${
            showCatalog ? 'w-full max-w-[440px]' : 'w-12'
          }`}
        >
          {showCatalog ? (
            <div className="flex h-full flex-col">
              <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                    <Layers size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">GIS Layers</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {activeCount} active / {layers.length} total
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
                    onClick={() => setShowCatalog(false)}
                    title="Collapse layers"
                  >
                    <PanelLeftClose size={17} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
                    onClick={onClose}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="border-b border-slate-800 p-3">
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-slate-400 focus-within:border-blue-500/70">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    placeholder="Search layers"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="p-4 text-sm font-bold text-slate-500">Loading dataset catalog...</div>
                ) : errorMessage ? (
                  <div className="m-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                    {errorMessage}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedCategories.map((category) => {
                      const isCollapsed = collapsedCategories.has(category);
                      const categoryLayers = layersByCategory[category];

                      return (
                        <section key={category} className="border-b border-slate-900 pb-2">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-slate-900"
                            onClick={() => {
                              setCollapsedCategories((previous) => {
                                const next = new Set(previous);
                                if (next.has(category)) next.delete(category);
                                else next.add(category);
                                return next;
                              });
                            }}
                          >
                            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              {CATEGORY_LABELS[category] || category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">{categoryLayers.length}</span>
                          </button>

                          {!isCollapsed && (
                            <div className="space-y-1">
                              {categoryLayers.map((layer) => {
                                const isActive = activeLayerIds.has(layer.id);
                                const isSelected = selectedLayerId === layer.id;
                                const color = layer.style.markerColor || layer.style.color || layer.style.fillColor || '#60a5fa';
                                const count = filterCount(filters[layer.id]);

                                return (
                                  <button
                                    key={layer.id}
                                    type="button"
                                    onClick={() => onSelectLayer(layer.id)}
                                    className={`group flex w-full items-center gap-3 rounded-md border px-2 py-2 text-left transition-all ${
                                      isSelected
                                        ? 'border-blue-500/60 bg-blue-600/10'
                                        : isActive
                                          ? 'border-slate-700 bg-slate-900/80'
                                          : 'border-transparent bg-transparent hover:border-slate-800 hover:bg-slate-900/70'
                                    }`}
                                  >
                                    <GeometryIcon family={layer.geometry_family} color={color} />
                                    <div className="min-w-0 flex-1">
                                      <div className={`truncate text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {layer.display_name}
                                      </div>
                                      <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                        <span>{layer.geometry_family}</span>
                                        <span>{layer.feature_count.toLocaleString()}</span>
                                        {count > 0 && <span className="text-blue-400">{count} filters</span>}
                                      </div>
                                    </div>
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onToggleLayer(layer.id);
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          onToggleLayer(layer.id);
                                        }
                                      }}
                                      className="shrink-0"
                                      title={isActive ? 'Hide layer' : 'Show layer'}
                                    >
                                      <Toggle checked={isActive} />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center border-r border-slate-800 py-3">
              <button
                type="button"
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
                onClick={() => setShowCatalog(true)}
                title="Open layers"
              >
                <PanelLeftOpen size={18} />
              </button>
              <div className="mt-3 h-px w-6 bg-slate-800" />
              <Layers size={18} className="mt-3 text-blue-500" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1" />

        {isFilterPanelOpen && (
          <div className="hidden h-full w-[380px] border-l border-slate-800 bg-slate-900 text-slate-100 shadow-2xl shadow-black/50 transition-all duration-200 pointer-events-auto md:flex">
            <DatasetFilterPanel
              layer={selectedLayer}
              active={selectedLayer ? activeLayerIds.has(selectedLayer.id) : false}
              filter={selectedLayer ? filters[selectedLayer.id] : undefined}
              onCollapse={() => onFilterPanelOpenChange(false)}
              onToggleLayer={onToggleLayer}
              onUpdateFilter={onUpdateFilter}
              onClearFilter={onClearFilter}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface DatasetFilterPanelProps {
  layer: DatasetLayer | null;
  active: boolean;
  filter?: DatasetLayerFilterState;
  onCollapse: () => void;
  onToggleLayer: (layerId: number) => void;
  onUpdateFilter: (layerId: number, filter: DatasetLayerFilterState) => void;
  onClearFilter: (layerId: number) => void;
}

const DatasetFilterPanel: React.FC<DatasetFilterPanelProps> = ({
  layer,
  active,
  filter,
  onCollapse,
  onToggleLayer,
  onUpdateFilter,
  onClearFilter,
}) => {
  const [options, setOptions] = useState<DatasetFilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!layer) {
      setOptions([]);
      return;
    }

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
  }, [layer?.id]);

  if (!layer) {
    return (
      <div className="flex h-full w-full flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <SlidersHorizontal size={17} className="text-blue-400" />
            Filters
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
            onClick={onCollapse}
            title="Collapse filters"
          >
            <PanelRightClose size={17} />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-bold text-slate-600">
          Select a layer
        </div>
      </div>
    );
  }

  const currentFilter = filter || {};
  const count = filterCount(currentFilter);

  const updateFilter = (next: DatasetLayerFilterState) => {
    onUpdateFilter(layer.id, next);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal size={17} className="shrink-0 text-blue-400" />
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">{layer.display_name}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {layer.feature_count.toLocaleString()} features
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
          onClick={onCollapse}
          title="Collapse filters"
        >
          <PanelRightClose size={17} />
        </button>
      </header>

      <div className="border-b border-slate-800 p-3">
        <button
          type="button"
          className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border text-xs font-black uppercase tracking-[0.16em] transition-colors ${
            active
              ? 'border-blue-500/40 bg-blue-600/15 text-blue-100'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
          onClick={() => onToggleLayer(layer.id)}
        >
          {active ? <Eye size={16} /> : <EyeOff size={16} />}
          {active ? 'Visible' : 'Hidden'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-3 flex h-10 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-slate-400 focus-within:border-blue-500/70">
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
          <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-sm font-bold text-slate-500">
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

      <footer className="border-t border-slate-800 p-3">
        <button
          type="button"
          disabled={count === 0}
          onClick={() => onClearFilter(layer.id)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-900 text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={15} />
          Clear {count > 0 ? count : ''} Filters
        </button>
      </footer>
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
            className="h-9 rounded-md border border-slate-800 bg-slate-900 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/70"
            placeholder={option.min !== null && option.min !== undefined ? String(option.min) : 'Min'}
          />
          <input
            value={filter.max?.[option.name] || ''}
            onChange={(event) => onChange({
              ...filter,
              max: { ...(filter.max || {}), [option.name]: event.target.value },
            })}
            className="h-9 rounded-md border border-slate-800 bg-slate-900 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/70"
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
                  : 'border-transparent bg-slate-900/50 hover:border-slate-800'
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
