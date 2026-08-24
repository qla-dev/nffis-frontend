import { describe, expect, it, vi } from 'vitest';
import { AUTH_INVALIDATED_EVENT, ApiError, apiRequest, ensureCsrfCookie } from '../services/api';

describe('central API client', () => {
  it('initializes the Sanctum cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await ensureCsrfCookie();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/sanctum/csrf-cookie', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('performs GET requests without a CSRF preflight', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.objectContaining({ credentials: 'include' }));
  });

  it('adds CSRF protection to mutating requests and supports 204 responses', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => {
        document.cookie = 'XSRF-TOKEN=secure%20token; path=/';
        return new Response(null, { status: 204 });
      })
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/resource', { method: 'PATCH', body: JSON.stringify({ value: 1 }) })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/resource', expect.objectContaining({
      method: 'PATCH',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'secure token',
      }),
    }));
  });

  it('throws structured API errors and announces an invalid session', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_INVALIDATED_EVENT, listener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message: 'Unauthenticated.',
      errors: { login: ['Required'] },
    }), { status: 401 })));

    const error = await apiRequest('/me').catch((value) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: 'Unauthenticated.', errors: { login: ['Required'] } });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_INVALIDATED_EVENT, listener);
  });
});
