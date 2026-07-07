import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Info,
  Paintbrush,
  PanelRightClose,
  TableProperties,
} from 'lucide-react';
import type {
  DatasetLayer,
  DatasetLayerFilterState,
  DatasetLayerStyle,
} from '../../../services/datasetService';
import { VisibilityTab } from './VisibilityTab';
import { InformationTab } from './InformationTab';
import { SourceTab } from './SourceTab';
import { SymbologyTab } from './SymbologyTab';
import { AttributesTab } from './AttributesTab';

export type EditLayerSidebarTabId =
  | 'visibility'
  | 'information'
  | 'source'
  | 'symbology'
  | 'attributes';

interface EditLayerSidebarProps {
  layer: DatasetLayer | null;
  active: boolean;
  filter?: DatasetLayerFilterState;
  selectedFeature?: GeoJSON.Feature | null;
  initialTab: EditLayerSidebarTabId;
  isSavingFeature: boolean;
  saveError?: string | null;
  onCollapse: () => void;
  onToggleLayer: (layerId: number) => void;
  onUpdateFilter: (layerId: number, filter: DatasetLayerFilterState) => void;
  onClearFilter: (layerId: number) => void;
  onUpdateLayerStyle: (layerId: number, style: DatasetLayerStyle) => void;
  onSaveLayerStyle: (layerId: number, style: DatasetLayerStyle) => Promise<void>;
  onSaveFeatureAttributes: (attributes: Record<string, unknown>) => Promise<void>;
}

const TABS = [
  { id: 'visibility', label: 'Visibility', icon: Eye },
  { id: 'information', label: 'Information', icon: Info },
  { id: 'source', label: 'Source', icon: Database },
  { id: 'symbology', label: 'Symbology', icon: Paintbrush },
  { id: 'attributes', label: 'Attributes', icon: TableProperties },
] satisfies Array<{ id: EditLayerSidebarTabId; label: string; icon: React.ElementType }>;

export const EditLayerSidebar: React.FC<EditLayerSidebarProps> = ({
  layer,
  active,
  filter,
  selectedFeature,
  initialTab,
  isSavingFeature,
  saveError,
  onCollapse,
  onToggleLayer,
  onUpdateFilter,
  onClearFilter,
  onUpdateLayerStyle,
  onSaveLayerStyle,
  onSaveFeatureAttributes,
}) => {
  const [activeTab, setActiveTab] = useState<EditLayerSidebarTabId>(initialTab);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, layer?.id, selectedFeature?.id]);

  const scrollTabs = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const renderTab = () => {
    if (!layer) {
      return (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-bold text-slate-600">
          Select a layer
        </div>
      );
    }

    if (activeTab === 'information') {
      return <InformationTab layer={layer} />;
    }

    if (activeTab === 'source') {
      return <SourceTab layer={layer} />;
    }

    if (activeTab === 'symbology') {
      return (
        <SymbologyTab
          layer={layer}
          onUpdateLayerStyle={(style) => onUpdateLayerStyle(layer.id, style)}
          onSaveLayerStyle={(style) => onSaveLayerStyle(layer.id, style)}
        />
      );
    }

    if (activeTab === 'attributes') {
      return (
        <AttributesTab
          layer={layer}
          selectedFeature={selectedFeature}
          isSaving={isSavingFeature}
          saveError={saveError}
          onSave={onSaveFeatureAttributes}
        />
      );
    }

    return (
      <VisibilityTab
        layer={layer}
        active={active}
        filter={filter}
        onToggleLayer={onToggleLayer}
        onUpdateFilter={onUpdateFilter}
        onClearFilter={onClearFilter}
      />
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <TableProperties size={17} className="shrink-0 text-blue-400" />
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">{layer?.display_name || 'Layer editor'}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {layer ? `${layer.feature_count.toLocaleString()} features` : 'No layer selected'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
          onClick={onCollapse}
          title="Collapse editor"
        >
          <PanelRightClose size={17} />
        </button>
      </header>

      <div className="border-b border-slate-800 bg-slate-950/35 px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={() => scrollTabs(-180)}
            title="Scroll tabs left"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            ref={scrollerRef}
            className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto scroll-smooth"
            onWheel={(event) => {
              if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                event.currentTarget.scrollLeft += event.deltaY;
              }
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex h-9 shrink-0 snap-start items-center gap-2 rounded-md border px-3 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={() => scrollTabs(180)}
            title="Scroll tabs right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {renderTab()}
      </div>
    </div>
  );
};
