import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditLayerSidebar } from '../components/Layers/EditLayerSidebar/EditLayerSidebar';
import type { DatasetLayer } from '../services/datasetService';

const layer = {
  id: 4,
  table_schema: 'public',
  table_name: 'roads',
  display_name: 'Roads',
  jurisdiction: 'shared',
  category: 'infrastructure',
  geometry_family: 'line',
  srid: 4326,
  feature_count: 10,
  style: {},
  filter_fields: [],
  visible_by_default: false,
} as DatasetLayer;

function renderSidebar(canManageRoleAccess: boolean) {
  return render(
    <EditLayerSidebar
      layer={layer}
      initialTab="filters"
      isSavingFeature={false}
      canUpdateLayer
      canCreateLayer
      canManageRoleAccess={canManageRoleAccess}
      geoEditorMode="view"
      geoEditorDrawing={[]}
      geoEditorSnappingEnabled
      geoEditorNewPolygonName=""
      geoEditorPendingChanges={0}
      geoEditorSelectedFeatureId={null}
      isSavingGeometry={false}
      onCollapse={vi.fn()}
      onUpdateFilter={vi.fn()}
      onClearFilter={vi.fn()}
      onUpdateLayerStyle={vi.fn()}
      onSaveLayerStyle={vi.fn()}
      onSaveFeatureAttributes={vi.fn()}
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
}

describe('EditLayerSidebar role access capability', () => {
  it('shows Role access when the user can update layer visibility', () => {
    renderSidebar(true);

    expect(screen.getByRole('button', { name: 'Role access' })).toBeInTheDocument();
  });

  it('hides Role access without the layer visibility permission', () => {
    renderSidebar(false);

    expect(screen.queryByRole('button', { name: 'Role access' })).not.toBeInTheDocument();
  });
});
