import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatasetLayerOverlay } from '../components/Layers/DatasetLayerOverlay';
import type { DatasetLayer } from '../services/datasetService';

const makeLayer = (
  id: number,
  displayName: string,
  jurisdiction: DatasetLayer['jurisdiction']
): DatasetLayer => ({
  id,
  table_schema: 'public',
  table_name: `layer_${id}`,
  display_name: displayName,
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
});
