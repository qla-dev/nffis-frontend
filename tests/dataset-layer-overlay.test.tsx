import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatasetLayerOverlay } from '../components/Layers/DatasetLayerOverlay';
import type { DatasetLayer } from '../services/datasetService';

const makeLayer = (
  id: number,
  displayName: string,
  jurisdiction: DatasetLayer['jurisdiction'],
  sourcePath?: string
): DatasetLayer => ({
  id,
  table_schema: 'public',
  table_name: `layer_${id}`,
  display_name: displayName,
  source_path: sourcePath,
  jurisdiction,
  category: 'administrative',
  geometry_family: 'polygon',
  srid: 4326,
  feature_count: 1,
  style: {},
  filter_fields: [],
  visible_by_default: false,
});

describe('DatasetLayerOverlay source filters', () => {
  it('filters layers by one or more jurisdictions and resets the selection', async () => {
    const interaction = userEvent.setup();
    const layers = [
      makeLayer(1, 'Federation roads', 'fbih'),
      makeLayer(2, 'RS roads', 'rs'),
      makeLayer(3, 'Brcko parcels', 'shared'),
    ];

    render(
      <DatasetLayerOverlay
        isOpen
        layers={layers}
        activeLayerIds={new Set()}
        loadingLayerIds={new Set()}
        selectedLayerId={null}
        filters={{}}
        isFilterPanelOpen={false}
        editorInitialTab="filters"
        isSavingFeature={false}
        isLoading={false}
        canUpdateLayer={false}
        canCreateLayer={false}
        canManageRoleAccess={false}
        geoEditorMode="view"
        geoEditorDrawing={[]}
        geoEditorSnappingEnabled
        geoEditorNewPolygonName=""
        geoEditorPendingChanges={0}
        geoEditorSelectedFeatureId={null}
        isSavingGeometry={false}
        onClose={vi.fn()}
        onToggleLayer={vi.fn()}
        onSetCategoryLayersActive={vi.fn()}
        onSelectLayer={vi.fn()}
        onFilterPanelOpenChange={vi.fn()}
        onUpdateLayerStyle={vi.fn()}
        onSaveLayerStyle={vi.fn()}
        onSaveFeatureAttributes={vi.fn()}
        onUpdateFilter={vi.fn()}
        onClearFilter={vi.fn()}
        onGeoEditorModeChange={vi.fn()}
        onGeoEditorSnappingChange={vi.fn()}
        onGeoEditorNewPolygonNameChange={vi.fn()}
        onGeoEditorUndoDrawing={vi.fn()}
        onGeoEditorClearDrawing={vi.fn()}
        onGeoEditorFinishDrawing={vi.fn()}
        onGeoEditorSave={vi.fn()}
        onGeoEditorReset={vi.fn()}
      />
    );

    const filterDisclosure = screen.getByRole('button', { name: 'Layer filters' });
    expect(filterDisclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByPlaceholderText('Search layers')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Federacija/ })).not.toBeInTheDocument();

    await interaction.click(filterDisclosure);
    expect(filterDisclosure).toHaveAttribute('aria-expanded', 'true');

    await interaction.click(screen.getByRole('button', { name: /Federacija/ }));
    expect(screen.getByText('Federation roads')).toBeInTheDocument();
    expect(screen.queryByText('RS roads')).not.toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: /Shared/ }));
    expect(screen.getByText('Federation roads')).toBeInTheDocument();
    expect(screen.getByText('Brcko parcels')).toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('RS roads')).toBeInTheDocument();
    expect(screen.getByText('Brcko parcels')).toBeInTheDocument();

    await interaction.click(filterDisclosure);
    expect(filterDisclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByPlaceholderText('Search layers')).toBeInTheDocument();
  });

  it('groups numbered canton source folders under Cantons', async () => {
    const interaction = userEvent.setup();
    const layers = [
      makeLayer(1, 'Sarajevo forest', 'fbih', '10_FBiH data/Cantons/09_KantonSarajevo/forest.shp'),
      makeLayer(2, 'Federation roads', 'fbih', '10_FBiH data/roads.shp'),
      makeLayer(3, 'RS roads', 'rs', '20_RS data/roads.shp'),
    ];

    render(
      <DatasetLayerOverlay
        isOpen layers={layers} activeLayerIds={new Set()} loadingLayerIds={new Set()} selectedLayerId={null}
        filters={{}} isFilterPanelOpen={false} editorInitialTab="filters" isSavingFeature={false}
        isLoading={false} canUpdateLayer={false} canCreateLayer={false} canManageRoleAccess={false}
        isSuperAdmin={false} geoEditorMode="view" geoEditorDrawing={[]} geoEditorSnappingEnabled
        geoEditorNewPolygonName="" geoEditorPendingChanges={0} geoEditorSelectedFeatureId={null}
        isSavingGeometry={false} onClose={vi.fn()} onToggleLayer={vi.fn()} onSetCategoryLayersActive={vi.fn()}
        onSelectLayer={vi.fn()} onFilterPanelOpenChange={vi.fn()} onUpdateLayerStyle={vi.fn()}
        onSaveLayerStyle={vi.fn()} onSaveFeatureAttributes={vi.fn()} onUpdateFilter={vi.fn()}
        onClearFilter={vi.fn()} onGeoEditorModeChange={vi.fn()} onGeoEditorSnappingChange={vi.fn()}
        onGeoEditorNewPolygonNameChange={vi.fn()} onGeoEditorUndoDrawing={vi.fn()}
        onGeoEditorClearDrawing={vi.fn()} onGeoEditorFinishDrawing={vi.fn()} onGeoEditorSave={vi.fn()}
        onGeoEditorReset={vi.fn()}
      />
    );

    await interaction.click(screen.getByRole('button', { name: 'Layer filters' }));
    await interaction.click(screen.getByRole('button', { name: /Cantons/ }));

    expect(screen.getByText('Sarajevo forest')).toBeInTheDocument();
    expect(screen.queryByText('Federation roads')).not.toBeInTheDocument();
    expect(screen.queryByText('RS roads')).not.toBeInTheDocument();
  });

  it('keeps a cross-entity municipality layer visible for both entity source filters', async () => {
    const interaction = userEvent.setup();
    const layers = [
      makeLayer(
        1,
        'Fire stations by municipality',
        'shared',
        'Federation of BiH and Republic of Srpska; derived from mapped firefighter stations'
      ),
      makeLayer(2, 'Federation roads', 'fbih', '10_FBiH data/roads.shp'),
      makeLayer(3, 'RS roads', 'rs', '20_RS data/roads.shp'),
    ];

    render(
      <DatasetLayerOverlay
        isOpen layers={layers} activeLayerIds={new Set()} loadingLayerIds={new Set()} selectedLayerId={null}
        filters={{}} isFilterPanelOpen={false} editorInitialTab="filters" isSavingFeature={false}
        isLoading={false} canUpdateLayer={false} canCreateLayer={false} canManageRoleAccess={false}
        isSuperAdmin={false} geoEditorMode="view" geoEditorDrawing={[]} geoEditorSnappingEnabled
        geoEditorNewPolygonName="" geoEditorPendingChanges={0} geoEditorSelectedFeatureId={null}
        isSavingGeometry={false} onClose={vi.fn()} onToggleLayer={vi.fn()} onSetCategoryLayersActive={vi.fn()}
        onSelectLayer={vi.fn()} onFilterPanelOpenChange={vi.fn()} onUpdateLayerStyle={vi.fn()}
        onSaveLayerStyle={vi.fn()} onSaveFeatureAttributes={vi.fn()} onUpdateFilter={vi.fn()}
        onClearFilter={vi.fn()} onGeoEditorModeChange={vi.fn()} onGeoEditorSnappingChange={vi.fn()}
        onGeoEditorNewPolygonNameChange={vi.fn()} onGeoEditorUndoDrawing={vi.fn()}
        onGeoEditorClearDrawing={vi.fn()} onGeoEditorFinishDrawing={vi.fn()} onGeoEditorSave={vi.fn()}
        onGeoEditorReset={vi.fn()}
      />
    );

    await interaction.click(screen.getByRole('button', { name: 'Layer filters' }));
    await interaction.click(screen.getByRole('button', { name: /Federacija/ }));
    expect(screen.getByText('Fire stations by municipality')).toBeInTheDocument();
    expect(screen.getByText('Federation roads')).toBeInTheDocument();
    expect(screen.queryByText('RS roads')).not.toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: /Federacija/ }));
    await interaction.click(screen.getByRole('button', { name: 'RS2' }));
    expect(screen.getByText('Fire stations by municipality')).toBeInTheDocument();
    expect(screen.getByText('RS roads')).toBeInTheDocument();
    expect(screen.queryByText('Federation roads')).not.toBeInTheDocument();
  });

  it('renders database subcategories as collapsible layer groups', async () => {
    const interaction = userEvent.setup();
    const setLayersActive = vi.fn();
    const layers = [
      makeLayer(1, 'All administrative boundaries', 'shared'),
      { ...makeLayer(2, 'Kanton Sarajevo', 'fbih'), subcategory: 'Cantons' },
      { ...makeLayer(3, 'Tuzlanski kanton', 'fbih'), subcategory: 'Cantons' },
      { ...makeLayer(4, 'Banja Luka Region', 'rs'), subcategory: 'RS Regions' },
    ];

    render(
      <DatasetLayerOverlay
        isOpen layers={layers} activeLayerIds={new Set()} loadingLayerIds={new Set()} selectedLayerId={null}
        filters={{}} isFilterPanelOpen={false} editorInitialTab="filters" isSavingFeature={false}
        isLoading={false} canUpdateLayer={false} canCreateLayer={false} canManageRoleAccess={false}
        isSuperAdmin={false} geoEditorMode="view" geoEditorDrawing={[]} geoEditorSnappingEnabled
        geoEditorNewPolygonName="" geoEditorPendingChanges={0} geoEditorSelectedFeatureId={null}
        isSavingGeometry={false} onClose={vi.fn()} onToggleLayer={vi.fn()} onSetCategoryLayersActive={setLayersActive}
        onSelectLayer={vi.fn()} onFilterPanelOpenChange={vi.fn()} onUpdateLayerStyle={vi.fn()}
        onSaveLayerStyle={vi.fn()} onSaveFeatureAttributes={vi.fn()} onUpdateFilter={vi.fn()}
        onClearFilter={vi.fn()} onGeoEditorModeChange={vi.fn()} onGeoEditorSnappingChange={vi.fn()}
        onGeoEditorNewPolygonNameChange={vi.fn()} onGeoEditorUndoDrawing={vi.fn()}
        onGeoEditorClearDrawing={vi.fn()} onGeoEditorFinishDrawing={vi.fn()} onGeoEditorSave={vi.fn()}
        onGeoEditorReset={vi.fn()}
      />
    );

    const cantonsDisclosure = screen.getByRole('button', { name: 'Cantons (2 layers)' });
    expect(screen.getByText('Kanton Sarajevo')).toBeInTheDocument();
    expect(screen.getByText('Banja Luka Region')).toBeInTheDocument();

    await interaction.click(cantonsDisclosure);
    expect(screen.queryByText('Kanton Sarajevo')).not.toBeInTheDocument();
    expect(screen.getByText('Banja Luka Region')).toBeInTheDocument();

    const allOnButtons = screen.getAllByRole('button', { name: 'All on' });
    await interaction.click(allOnButtons[1]);
    expect(setLayersActive).toHaveBeenCalledWith([2, 3], true);
  });
});
