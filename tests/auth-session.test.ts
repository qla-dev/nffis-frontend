import { describe, expect, it, vi } from 'vitest';
import {
  canUploadAws,
  currentUser,
  csrfHeaders,
  hasPermission,
  login,
  logout,
} from '../lib/auth/session';
import { authUser, permission } from './fixtures/auth';

describe('authentication session', () => {
  it('loads the authenticated user and maps 401 to a signed-out session', async () => {
    const user = authUser();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(currentUser()).resolves.toEqual(user);
    await expect(currentUser()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/me', expect.objectContaining({ credentials: 'include' }));
  });

  it('initializes CSRF and submits trimmed login credentials', async () => {
    const user = authUser({ slug: 'super-admin', name: 'Super Admin', level: 1 });
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => {
        document.cookie = 'XSRF-TOKEN=csrf%20value; path=/';
        return new Response(null, { status: 204 });
      })
      .mockResolvedValueOnce(new Response(JSON.stringify({ user }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(login('  qla.dev  ', 'password123')).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/sanctum/csrf-cookie', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/login', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf value' }),
      body: JSON.stringify({ login: 'qla.dev', password: 'password123' }),
    }));
  });

  it('uses validation messages and accepts an already logged-out response', async () => {
    const failedLoginFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errors: { login: ['Invalid credentials.'] } }), { status: 422 }));
    vi.stubGlobal('fetch', failedLoginFetch);
    await expect(login('bad', 'bad')).rejects.toThrow('Invalid credentials.');

    const logoutFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));
    vi.stubGlobal('fetch', logoutFetch);
    await expect(logout()).resolves.toBeUndefined();
  });

  it('reports a useful error when a successful login returns frontend HTML', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('<!DOCTYPE html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(login('qla.dev', 'password123')).rejects.toThrow(
      'Authentication service returned an invalid response',
    );
  });

  it('returns a decoded CSRF header when the cookie exists', async () => {
    document.cookie = 'XSRF-TOKEN=a%2Bb%20c; path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(csrfHeaders()).resolves.toEqual({ 'X-XSRF-TOKEN': 'a+b c' });
  });
});

describe('role permissions', () => {
  it('allows every action for Super Admin', () => {
    const user = authUser({ slug: 'super-admin', level: 1 });
    expect(hasPermission(user, 'reports', 'delete')).toBe(true);
    expect(canUploadAws(user)).toBe(true);
  });

  it('uses module actions for regular users', () => {
    const user = authUser({
      slug: 'editor',
      level: 4,
      permissions: [permission('reports', { can_view: true, can_update: true })],
    });
    expect(hasPermission(user, 'reports', 'view')).toBe(true);
    expect(hasPermission(user, 'reports', 'create')).toBe(false);
    expect(hasPermission(user, 'reports', 'update')).toBe(true);
    expect(hasPermission(user, 'dataset-layers', 'view')).toBe(false);
  });

  it('limits AWS uploads to Super Admin and Hydrometeorological Institute', () => {
    expect(canUploadAws(authUser({ slug: 'hydrometeorological-institute', level: 8 }))).toBe(true);
    expect(canUploadAws(authUser({ slug: 'jica', level: 2 }))).toBe(false);
    expect(canUploadAws(null)).toBe(false);
    expect(hasPermission(null, 'reports', 'view')).toBe(false);
  });
});
