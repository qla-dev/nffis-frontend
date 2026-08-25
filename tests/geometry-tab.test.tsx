import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GeometryTab } from '../components/Layers/EditLayerSidebar/GeometryTab';

const layer = { id: 3, display_name: 'Mahale', geometry_family: 'polygon', srid: 4326 } as any;

function props(overrides: Record<string, unknown> = {}) {
  return {
    layer,
    selectedFeature: null,
    isSaving: false,
    canUpdate: true,
    canCreate: true,
    isCreatingPolygon: false,
    drawingPointCount: 0,
    drawingName: '',
    snappingEnabled: true,
    onDrawingNameChange: vi.fn(),
    onSnappingEnabledChange: vi.fn(),
    onStartPolygonDrawing: vi.fn(),
    onCancelPolygonDrawing: vi.fn(),
    onUndoDrawingPoint: vi.fn(),
    onClearDrawing: vi.fn(),
    onSaveNewPolygon: vi.fn(),
    isMapEditing: false,
    onStartMapEditing: vi.fn(),
    onStopMapEditing: vi.fn(),
    onUndoVertex: vi.fn(),
    onClearBoundary: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
}

describe('Mahala-style polygon drawing UI', () => {
  it('starts a new polygon without selecting an existing feature', () => {
    const input = props();
    render(<GeometryTab {...input} />);
    fireEvent.click(screen.getByRole('button', { name: /počni crtanje/i }));
    expect(input.onStartPolygonDrawing).toHaveBeenCalledOnce();
  });

  it('shows point count, snapping and enables finish after three points and a name', () => {
    const input = props({ isCreatingPolygon: true, drawingPointCount: 3, drawingName: 'Nova mahala' });
    render(<GeometryTab {...input} />);
    expect(screen.getByText('3 tačaka')).toBeInTheDocument();
    expect(screen.getByText(/snap na vertex i segment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /završi i spremi/i })).toBeEnabled();
  });
});
