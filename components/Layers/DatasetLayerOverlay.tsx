import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Layers,
  LineChart,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Pentagon,
  Search,
  X,
} from 'lucide-react';
import type {
  DatasetLayer,
  DatasetLayerFilterState,
  DatasetLayerStyle,
} from '../../services/datasetService';
import { EditLayerSidebar, type EditLayerSidebarTabId } from './EditLayerSidebar/EditLayerSidebar';
import type { GeoEditorMode, Position } from '../../lib/gis/geoEditor';

interface DatasetLayerOverlayProps {
  isOpen: boolean;
  layers: DatasetLayer[];
  activeLayerIds: Set<number>;
  loadingLayerIds: Set<number>;
  selectedLayerId: number | null;
  filters: Record<number, DatasetLayerFilterState>;
  isFilterPanelOpen: boolean;
  selectedFeature?: GeoJSON.Feature | null;
  editorInitialTab: EditLayerSidebarTabId;
  isSavingFeature: boolean;
  saveError?: string | null;
  isLoading: boolean;
  errorMessage?: string | null;
  canUpdateLayer: boolean;
  canCreateLayer: boolean;
  canManageRoleAccess: boolean;
  isSuperAdmin: boolean;
  geoEditorMode: GeoEditorMode;
  geoEditorDrawing: Position[];
  geoEditorSnappingEnabled: boolean;
  geoEditorNewPolygonName: string;
  geoEditorPendingChanges: number;
  geoEditorSelectedFeatureId: string | null;
  isSavingGeometry: boolean;
  geometrySaveError?: string | null;
  onClose: () => void;
  onToggleLayer: (layerId: number) => void;
  onSetCategoryLayersActive: (layerIds: number[], active: boolean) => void;
  onLayerUpdated?: (layer: DatasetLayer) => void;
  onSelectLayer: (layerId: number) => void;
  onFilterPanelOpenChange: (isOpen: boolean) => void;
  onUpdateLayerStyle: (layerId: number, style: DatasetLayerStyle) => void;
  onSaveLayerStyle: (layerId: number, style: DatasetLayerStyle) => Promise<void>;
  onSaveFeatureAttributes: (attributes: Record<string, unknown>) => Promise<void>;
  onUpdateFilter: (layerId: number, filter: DatasetLayerFilterState) => void;
  onClearFilter: (layerId: number) => void;
  onGeoEditorModeChange: (mode: GeoEditorMode) => void;
  onGeoEditorSnappingChange: (enabled: boolean) => void;
  onGeoEditorNewPolygonNameChange: (name: string) => void;
  onGeoEditorUndoDrawing: () => void;
  onGeoEditorClearDrawing: () => void;
  onGeoEditorFinishDrawing: () => void;
  onGeoEditorSave: () => Promise<void>;
  onGeoEditorReset: () => void;
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

const SHAPE_ORDER = ['point', 'line', 'polygon', 'mixed'] as const;

const SHAPE_LABELS: Record<string, string> = {
  point: 'Point',
  line: 'Line',
  polygon: 'Polygon',
  mixed: 'Mixed',
};

const SOURCE_ORDER = ['fbih', 'rs', 'shared'] as const;

const SOURCE_LABELS: Record<string, string> = {
  fbih: 'Federacija',
  rs: 'RS',
  shared: 'Shared',
};

function toggleInSet(previous: Set<string>, value: string): Set<string> {
  const next = new Set(previous);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FacetChip({
  label,
  count,
  checked,
  onClick,
}: {
  label: string;
  count: number;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
        checked
          ? 'border-blue-500/60 bg-blue-600/15 text-blue-100'
          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
      }`}
    >
      {label}
      <span className={checked ? 'text-blue-300' : 'text-slate-600'}>{count}</span>
    </button>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all ${checked ? 'border-blue-400 bg-blue-600 shadow-sm shadow-blue-500/30' : 'border-slate-600 bg-slate-800'}`}
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'translate-x-6' : 'translate-x-1'}`}
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
  loadingLayerIds,
  selectedLayerId,
  filters,
  isFilterPanelOpen,
  selectedFeature,
  editorInitialTab,
  isSavingFeature,
  saveError,
  isLoading,
  errorMessage,
  canUpdateLayer,
  canCreateLayer,
  canManageRoleAccess,
  isSuperAdmin,
  geoEditorMode,
  geoEditorDrawing,
  geoEditorSnappingEnabled,
  geoEditorNewPolygonName,
  geoEditorPendingChanges,
  geoEditorSelectedFeatureId,
  isSavingGeometry,
  geometrySaveError,
  onClose,
  onToggleLayer,
  onSetCategoryLayersActive,
  onLayerUpdated,
  onSelectLayer,
  onFilterPanelOpenChange,
  onUpdateLayerStyle,
  onSaveLayerStyle,
  onSaveFeatureAttributes,
  onUpdateFilter,
  onClearFilter,
  onGeoEditorModeChange,
  onGeoEditorSnappingChange,
  onGeoEditorNewPolygonNameChange,
  onGeoEditorUndoDrawing,
  onGeoEditorClearDrawing,
  onGeoEditorFinishDrawing,
  onGeoEditorSave,
  onGeoEditorReset,
}) => {
  const [search, setSearch] = useState('');
  const [showLayerFilters, setShowLayerFilters] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showCatalog, setShowCatalog] = useState(true);
  const [shapeTypes, setShapeTypes] = useState<Set<string>>(new Set());
  const [subcategories, setSubcategories] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<Set<string>>(new Set());
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowCatalog(true);
    }
  }, [isOpen]);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  );

  // Text search first; the facet counts below are derived from this set so they stay
  // stable while shape/subcategory chips are toggled.
  const searchedLayers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return layers.filter((layer) => {
      if (!term) return true;

      return [
        layer.display_name,
        layer.table_name,
        layer.category,
        layer.subcategory || '',
        SOURCE_LABELS[layer.jurisdiction] || layer.jurisdiction || 'shared',
        layer.geometry_type || '',
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [layers, search]);

  const shapeFacets = useMemo(() => {
    const counts = new Map<string, number>();
    searchedLayers.forEach((layer) => {
      const family = layer.geometry_family || 'mixed';
      counts.set(family, (counts.get(family) || 0) + 1);
    });

    return SHAPE_ORDER
      .filter((family) => counts.has(family))
      .map((family) => ({ value: family, count: counts.get(family) || 0 }));
  }, [searchedLayers]);

  const subcategoryFacets = useMemo(() => {
    const counts = new Map<string, number>();
    searchedLayers.forEach((layer) => {
      const name = (layer.subcategory || '').trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [searchedLayers]);

  const sourceFacets = useMemo(() => {
    const counts = new Map<string, number>();
    searchedLayers.forEach((layer) => {
      const source = layer.jurisdiction || 'shared';
      counts.set(source, (counts.get(source) || 0) + 1);
    });

    return SOURCE_ORDER
      .filter((source) => counts.has(source))
      .map((source) => ({ value: source, count: counts.get(source) || 0 }));
  }, [searchedLayers]);

  const visibleLayers = useMemo(() => searchedLayers.filter((layer) => {
    if (shapeTypes.size > 0 && !shapeTypes.has(layer.geometry_family || 'mixed')) return false;
    if (subcategories.size > 0 && !subcategories.has((layer.subcategory || '').trim())) return false;
    if (sources.size > 0 && !sources.has(layer.jurisdiction || 'shared')) return false;
    if (activeOnly && !activeLayerIds.has(layer.id)) return false;
    return true;
  }), [activeLayerIds, activeOnly, searchedLayers, shapeTypes, sources, subcategories]);

  const activeFacetCount = shapeTypes.size + subcategories.size + sources.size + Number(activeOnly);
  const activeFacet = useMemo(
    () => searchedLayers.filter((layer) => activeLayerIds.has(layer.id)).length,
    [activeLayerIds, searchedLayers]
  );

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
                    disabled={activeCount === 0 || loadingLayerIds.size > 0}
                    onClick={() => onSetCategoryLayersActive(Array.from(activeLayerIds), false)}
                    className="rounded-md border border-slate-800 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-blue-400 transition-colors hover:border-blue-500/50 hover:bg-blue-600/10 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Hide all active layers and clear the map view"
                  >
                    Clear view
                  </button>
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

                {(shapeFacets.length > 0 || subcategoryFacets.length > 0 || sourceFacets.length > 0 || searchedLayers.length > 0) && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        aria-expanded={showLayerFilters}
                        aria-controls="layer-catalog-filters"
                        onClick={() => setShowLayerFilters((previous) => !previous)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-slate-300"
                        title={showLayerFilters ? 'Hide layer filters' : 'Show layer filters'}
                      >
                        {showLayerFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>Layer filters</span>
                        {activeFacetCount > 0 && (
                          <span className="rounded-full bg-blue-600/15 px-1.5 py-0.5 text-[9px] text-blue-400">
                            {activeFacetCount}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600">
                          {visibleLayers.length} {visibleLayers.length === 1 ? 'match' : 'matches'}
                        </span>
                        {activeFacetCount > 0 && (
                          <button
                            type="button"
                            onClick={() => { setShapeTypes(new Set()); setSubcategories(new Set()); setSources(new Set()); setActiveOnly(false); }}
                            className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-400 transition-colors hover:text-blue-300"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {showLayerFilters && (
                      <div id="layer-catalog-filters" className="mt-3 space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                            Visibility
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <FacetChip
                              label="Active"
                              count={activeFacet}
                              checked={activeOnly}
                              onClick={() => setActiveOnly((previous) => !previous)}
                            />
                          </div>
                        </div>

                        {sourceFacets.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                              Source
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {sourceFacets.map((facet) => (
                                <FacetChip
                                  key={facet.value}
                                  label={SOURCE_LABELS[facet.value] || facet.value}
                                  count={facet.count}
                                  checked={sources.has(facet.value)}
                                  onClick={() => setSources((prev) => toggleInSet(prev, facet.value))}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {shapeFacets.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                              Shape type
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {shapeFacets.map((facet) => (
                                <FacetChip
                                  key={facet.value}
                                  label={SHAPE_LABELS[facet.value] || facet.value}
                                  count={facet.count}
                                  checked={shapeTypes.has(facet.value)}
                                  onClick={() => setShapeTypes((prev) => toggleInSet(prev, facet.value))}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {subcategoryFacets.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                              Subcategory
                            </span>
                            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">
                              {subcategoryFacets.map((facet) => (
                                <FacetChip
                                  key={facet.value}
                                  label={facet.value}
                                  count={facet.count}
                                  checked={subcategories.has(facet.value)}
                                  onClick={() => setSubcategories((prev) => toggleInSet(prev, facet.value))}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                      const allCategoryLayersActive = categoryLayers.every((layer) => activeLayerIds.has(layer.id));
                      const categoryHasLoadingLayer = categoryLayers.some((layer) => loadingLayerIds.has(layer.id));

                      return (
                        <section key={category} className="border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-1 px-2 py-2">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left transition-colors hover:bg-slate-900"
                              onClick={() => {
                                setCollapsedCategories((previous) => {
                                  const next = new Set(previous);
                                  if (next.has(category)) next.delete(category);
                                  else next.add(category);
                                  return next;
                                });
                              }}
                            >
                              <span className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                <span className="truncate">{CATEGORY_LABELS[category] || category}</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">{categoryLayers.length}</span>
                            </button>
                            <button
                              type="button"
                              disabled={categoryHasLoadingLayer}
                              onClick={() => onSetCategoryLayersActive(categoryLayers.map((layer) => layer.id), !allCategoryLayersActive)}
                              className="shrink-0 rounded-md border border-slate-800 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-blue-400 transition-colors hover:border-blue-500/50 hover:bg-blue-600/10 disabled:cursor-wait disabled:opacity-50"
                              title={allCategoryLayersActive ? `Hide all ${CATEGORY_LABELS[category] || category} layers` : `Show all ${CATEGORY_LABELS[category] || category} layers`}
                            >
                              {allCategoryLayersActive ? 'All off' : 'All on'}
                            </button>
                          </div>

                          {!isCollapsed && (
                            <div className="space-y-1">
                              {categoryLayers.map((layer) => {
                                const isActive = activeLayerIds.has(layer.id);
                                const isLayerLoading = loadingLayerIds.has(layer.id);
                                const isSelected = selectedLayerId === layer.id;
                                const color = layer.style.markerColor || layer.style.color || layer.style.fillColor || '#60a5fa';
                                const count = filterCount(filters[layer.id]);

                                return (
                                  <div
                                    key={layer.id}
                                    className={`group flex w-full items-center gap-3 rounded-md border px-2 py-2 text-left transition-all ${
                                      isSelected
                                        ? 'border-blue-500/60 bg-blue-600/10'
                                        : isActive
                                          ? 'border-slate-700 bg-slate-900/80'
                                          : 'border-transparent bg-transparent hover:border-slate-800 hover:bg-slate-900/70'
                                    }`}
                                  >
                                    <GeometryIcon family={layer.geometry_family} color={color} />
                                    <button type="button" onClick={() => onSelectLayer(layer.id)} className="min-w-0 flex-1 text-left">
                                      <div className={`truncate text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {layer.display_name}
                                      </div>
                                      <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                        <span>{layer.geometry_family}</span>
                                        <span>{layer.feature_count.toLocaleString()}</span>
                                        {count > 0 && <span className="text-blue-400">{count} filters</span>}
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (!isLayerLoading) onToggleLayer(layer.id);
                                      }}
                                      disabled={isLayerLoading}
                                      aria-pressed={isActive}
                                      aria-label={isLayerLoading ? `Loading ${layer.display_name}` : undefined}
                                      className={`shrink-0 ${isLayerLoading ? 'cursor-wait' : ''}`}
                                      title={isLayerLoading ? 'Loading layer data...' : isActive ? 'Hide layer' : 'Show layer'}
                                    >
                                      {isLayerLoading
                                        ? <Loader2 size={18} className="animate-spin text-blue-400" />
                                        : <Toggle checked={isActive} />}
                                    </button>
                                  </div>
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
            <EditLayerSidebar
              layer={selectedLayer}
              filter={selectedLayer ? filters[selectedLayer.id] : undefined}
              selectedFeature={selectedFeature}
              initialTab={editorInitialTab}
              isSavingFeature={isSavingFeature}
              saveError={saveError}
              onCollapse={() => onFilterPanelOpenChange(false)}
              onLayerUpdated={onLayerUpdated}
              onUpdateLayerStyle={onUpdateLayerStyle}
              onSaveLayerStyle={onSaveLayerStyle}
              onSaveFeatureAttributes={onSaveFeatureAttributes}
              onUpdateFilter={onUpdateFilter}
              onClearFilter={onClearFilter}
              canUpdateLayer={canUpdateLayer}
              canCreateLayer={canCreateLayer}
              canManageRoleAccess={canManageRoleAccess}
              isSuperAdmin={isSuperAdmin}
              geoEditorMode={geoEditorMode}
              geoEditorDrawing={geoEditorDrawing}
              geoEditorSnappingEnabled={geoEditorSnappingEnabled}
              geoEditorNewPolygonName={geoEditorNewPolygonName}
              geoEditorPendingChanges={geoEditorPendingChanges}
              geoEditorSelectedFeatureId={geoEditorSelectedFeatureId}
              isSavingGeometry={isSavingGeometry}
              geometrySaveError={geometrySaveError}
              onGeoEditorModeChange={onGeoEditorModeChange}
              onGeoEditorSnappingChange={onGeoEditorSnappingChange}
              onGeoEditorNewPolygonNameChange={onGeoEditorNewPolygonNameChange}
              onGeoEditorUndoDrawing={onGeoEditorUndoDrawing}
              onGeoEditorClearDrawing={onGeoEditorClearDrawing}
              onGeoEditorFinishDrawing={onGeoEditorFinishDrawing}
              onGeoEditorSave={onGeoEditorSave}
              onGeoEditorReset={onGeoEditorReset}
            />
          </div>
        )}
      </div>
    </div>
  );
};
