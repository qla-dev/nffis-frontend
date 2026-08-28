import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisibilityTab } from '../components/Layers/EditLayerSidebar/VisibilityTab';
import type { DatasetLayer } from '../services/datasetService';

describe('VisibilityTab', () => {
  it('shows a role loader while the visibility matrix is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input).includes('/visibility')) return new Promise(() => undefined);
      return Promise.resolve(new Response(JSON.stringify({ fields: [] }), { status: 200 }));
    }));

    render(<VisibilityTab layer={{ id: 20, display_name: 'Slow layer' } as DatasetLayer} active filter={{}} onToggleLayer={vi.fn()} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} isSuperAdmin />);
    expect(screen.getByText('Loading role permissions...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save role access' })).toBeDisabled();
  });

  it('disables an active layer without changing its filters', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ fields: [
      { name: 'SHAPENAME', kind: 'values', values: [{ value: 'Novi Grad', count: 2 }, { value: 'Banovići', count: 1 }] },
      { name: 'SHAPETYPE', kind: 'values', values: [{ value: 'ADM3', count: 142 }] },
    ] }), { status: 200 })));
    const onUpdateFilter = vi.fn();
    const onToggleLayer = vi.fn();

    render(<VisibilityTab layer={{ id: 5, display_name: 'BiH Municipalities' } as DatasetLayer} active filter={{}} onToggleLayer={onToggleLayer} onUpdateFilter={onUpdateFilter} onClearFilter={vi.fn()} isSuperAdmin={false} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Visible' }));

    expect(onUpdateFilter).not.toHaveBeenCalled();
    expect(onToggleLayer).toHaveBeenCalledWith(5);
  });

  it('selects all indexed values when enabling a hidden layer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ fields: [
      { name: 'TYPE', kind: 'values', values: [{ value: 'A', count: 2 }, { value: 'B', count: 1 }] },
    ] }), { status: 200 })));
    const onUpdateFilter = vi.fn();
    const onToggleLayer = vi.fn();

    render(<VisibilityTab layer={{ id: 9, display_name: 'Test layer' } as DatasetLayer} active={false} filter={{}} onToggleLayer={onToggleLayer} onUpdateFilter={onUpdateFilter} onClearFilter={vi.fn()} isSuperAdmin={false} />);
    await waitFor(() => expect(screen.queryByText('Loading filters...')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Hidden' }));

    expect(onUpdateFilter).toHaveBeenCalledWith(9, { values: { TYPE: ['A', 'B'] } });
    expect(onToggleLayer).toHaveBeenCalledWith(9);
  });

  it('shows role access controls only to Super Admin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(new Response(JSON.stringify(url.includes('/visibility')
        ? { roles: [{ id: 2, name: 'JICA', slug: 'jica', level: 2 }], layers: [{ id: 2, visibility: { '2': true } }] }
        : { fields: [] }), { status: 200 }));
    }));

    render(<VisibilityTab layer={{ id: 2, display_name: 'Restricted' } as DatasetLayer} active filter={{}} onToggleLayer={vi.fn()} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} isSuperAdmin />);
    expect(await screen.findByText('Role access')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /JICA/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable all' })).toBeInTheDocument();
  });

  it('can select and clear all non-admin role access', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const payload = String(input).includes('/visibility') ? {
        roles: [
          { id: 1, name: 'Super Admin', slug: 'super-admin' },
          { id: 2, name: 'JICA', slug: 'jica' },
          { id: 3, name: 'Editor', slug: 'editor' },
        ],
        layers: [{ id: 4, visibility: { '1': true, '2': false, '3': false } }],
      } : { fields: [] };
      return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }));
    }));

    render(<VisibilityTab layer={{ id: 4, display_name: 'Layer' } as DatasetLayer} active filter={{}} onToggleLayer={vi.fn()} onUpdateFilter={vi.fn()} onClearFilter={vi.fn()} isSuperAdmin />);
    const jica = await screen.findByRole('button', { name: /JICA/ });
    const editor = screen.getByRole('button', { name: /Editor/ });

    fireEvent.click(screen.getByRole('button', { name: 'Allow all' }));
    expect(jica.className).toContain('border-blue-500');
    expect(editor.className).toContain('border-blue-500');

    fireEvent.click(screen.getByRole('button', { name: 'Disable all' }));
    expect(jica.className).not.toContain('border-blue-500');
    expect(editor.className).not.toContain('border-blue-500');
  });
});
