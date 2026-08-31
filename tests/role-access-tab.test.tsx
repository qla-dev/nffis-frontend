import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RoleAccessTab } from '../components/Layers/EditLayerSidebar/RoleAccessTab';
import type { DatasetLayer } from '../services/datasetService';

const ROLES = [
  { id: 1, name: 'Super Admin', slug: 'super-admin', level: 1 },
  { id: 2, name: 'JICA', slug: 'jica', level: 2 },
  { id: 3, name: 'Editor', slug: 'editor', level: 6 },
];

const layer = { id: 4, display_name: 'Restricted layer' } as DatasetLayer;

function stubRoleAccess(
  accessibility: Record<string, boolean>,
  visibility: Record<string, boolean>
) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ roles: ROLES, accessibility, visibility }), { status: 200 })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function renderLoaded(fetchMock = stubRoleAccess({ '1': true, '2': true, '3': false }, { '2': true })) {
  render(<RoleAccessTab layer={layer} />);
  await waitFor(() => expect(screen.queryByText('Loading role access...')).not.toBeInTheDocument());
  return fetchMock;
}

describe('RoleAccessTab', () => {
  it('shows a loader while the role maps are pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => undefined)));

    render(<RoleAccessTab layer={layer} />);

    expect(screen.getByText('Loading role access...')).toBeInTheDocument();
  });

  it('reads the per-layer role-access endpoint', async () => {
    const fetchMock = await renderLoaded();

    expect(String(fetchMock.mock.calls[0][0])).toContain('/dataset-layers/4/role-access');
    expect(screen.getByText('JICA')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  // Accessibility gates authorization; Super Admin can never be locked out of a layer.
  it('keeps Super Admin access checked and not editable', async () => {
    await renderLoaded();

    const [superAdminAccess] = screen.getAllByRole('checkbox');
    expect(superAdminAccess).toBeDisabled();
    expect(superAdminAccess).toHaveAttribute('aria-checked', 'true');
  });

  it('clears the default-on flag when access is revoked', async () => {
    const fetchMock = await renderLoaded();

    // Row order is [SuperAdmin access, SuperAdmin default, JICA access, JICA default, ...]
    const boxes = screen.getAllByRole('checkbox');
    const jicaAccess = boxes[2];
    const jicaDefault = boxes[3];
    expect(jicaDefault).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(jicaAccess);

    expect(jicaAccess).toHaveAttribute('aria-checked', 'false');
    expect(jicaDefault).toHaveAttribute('aria-checked', 'false');
    expect(jicaDefault).toBeDisabled();

    fetchMock.mockClear();
  });

  it('sends both maps when saving', async () => {
    const fetchMock = await renderLoaded();
    fetchMock.mockClear();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ roles: ROLES, accessibility: {}, visibility: {} }), { status: 200 })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save role access' }));

    // A mutating request is preceded by a CSRF cookie fetch, so pick the PUT out.
    await waitFor(() => expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')
    ).toBe(true));
    const [url, init] = fetchMock.mock.calls.find(([, i]) => i?.method === 'PUT')!;
    expect(String(url)).toContain('/dataset-layers/4/role-access');
    const body = JSON.parse(String(init.body));
    expect(body).toHaveProperty('accessibility');
    expect(body).toHaveProperty('visibility');
  });

  it('grants and revokes every editable role at once', async () => {
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Deny all' }));
    let boxes = screen.getAllByRole('checkbox');
    expect(boxes[2]).toHaveAttribute('aria-checked', 'false');
    expect(boxes[4]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Allow all' }));
    boxes = screen.getAllByRole('checkbox');
    expect(boxes[2]).toHaveAttribute('aria-checked', 'true');
    expect(boxes[4]).toHaveAttribute('aria-checked', 'true');
  });

  it('reports a failed load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    render(<RoleAccessTab layer={layer} />);

    expect(await screen.findByText('Role access could not be loaded from the backend.')).toBeInTheDocument();
  });
});
