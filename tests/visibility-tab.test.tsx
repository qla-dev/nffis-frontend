import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisibilityTab } from '../components/Layers/EditLayerSidebar/VisibilityTab';
import type { DatasetLayer } from '../services/datasetService';

describe('VisibilityTab', () => {
  it('selects every attribute value when Visible is pressed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ fields: [
      { name: 'SHAPENAME', kind: 'values', values: [{ value: 'Novi Grad', count: 2 }, { value: 'Banovići', count: 1 }] },
      { name: 'SHAPETYPE', kind: 'values', values: [{ value: 'ADM3', count: 142 }] },
    ] }), { status: 200 })));
    const onUpdateFilter = vi.fn();
    const onToggleLayer = vi.fn();

    render(<VisibilityTab layer={{ id: 5, display_name: 'BiH Municipalities' } as DatasetLayer} active filter={{}} onToggleLayer={onToggleLayer} onUpdateFilter={onUpdateFilter} onClearFilter={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Visible' }));

    expect(onUpdateFilter).toHaveBeenCalledWith(5, { values: { SHAPENAME: ['Novi Grad', 'Banovići'], SHAPETYPE: ['ADM3'] } });
    expect(onToggleLayer).not.toHaveBeenCalled();
  });
});
