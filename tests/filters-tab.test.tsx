import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FiltersTab } from '../components/Layers/EditLayerSidebar/FiltersTab';
import type { DatasetLayer } from '../services/datasetService';

function stubFilterOptions(fields: unknown[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ fields }), { status: 200 })
  ));
}

const layer = { id: 5, display_name: 'BiH Municipalities' } as DatasetLayer;

describe('FiltersTab', () => {
  it('renders the indexed filter fields', async () => {
    stubFilterOptions([
      { name: 'SHAPENAME', kind: 'values', values: [{ value: 'Novi Grad', count: 2 }] },
    ]);

    render(<FiltersTab layer={layer} filter={{}} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} />);

    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());
    expect(screen.getByText('SHAPENAME')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novi Grad/ })).toBeInTheDocument();
  });

  // The layer on/off switch lives in the catalog list; the tab must not duplicate it.
  it('no longer renders the visible/hidden toggle or role access section', async () => {
    stubFilterOptions([]);

    render(<FiltersTab layer={layer} filter={{}} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} />);

    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Visible' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hidden' })).not.toBeInTheDocument();
    expect(screen.queryByText('Role access')).not.toBeInTheDocument();
  });

  it('selects and clears every value of a field', async () => {
    stubFilterOptions([
      { name: 'TYPE', kind: 'values', values: [{ value: 'A', count: 2 }, { value: 'B', count: 1 }] },
    ]);
    const onUpdateFilter = vi.fn();

    render(<FiltersTab layer={layer} filter={{}} onUpdateFilter={onUpdateFilter} onClearFilter={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onUpdateFilter).toHaveBeenCalledWith(5, { values: { TYPE: ['A', 'B'] } });
  });

  it('toggles a single value on', async () => {
    stubFilterOptions([
      { name: 'TYPE', kind: 'values', values: [{ value: 'A', count: 2 }, { value: 'B', count: 1 }] },
    ]);
    const onUpdateFilter = vi.fn();

    render(<FiltersTab layer={layer} filter={{}} onUpdateFilter={onUpdateFilter} onClearFilter={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());

    fireEvent.click(screen.getByText('A').closest('button')!);
    expect(onUpdateFilter).toHaveBeenCalledWith(5, { values: { TYPE: ['A'] } });
  });

  it('disables the clear button when nothing is filtered', async () => {
    stubFilterOptions([]);

    render(<FiltersTab layer={layer} filter={{}} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());

    expect(screen.getByRole('button', { name: /Clear/ })).toBeDisabled();
  });
});
