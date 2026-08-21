const frontendHostname = typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase();
const isNffisHost = frontendHostname === 'nffis.com' || frontendHostname.endsWith('.nffis.com');
const localBackendHost = frontendHostname || '127.0.0.1';

// The frontend is a standalone client: select its public backend only from its hostname.
export const API_BASE_URL = isNffisHost
  ? 'http://77.77.236.72'
  : `http://${localBackendHost}:81/api`;

const apiOrigin = API_BASE_URL.startsWith('http')
  ? new URL(API_BASE_URL).origin
  : window.location.origin;

export const AUTH_INVALIDATED_EVENT = 'nffis:auth-invalidated';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

function cookieValue(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function ensureCsrfCookie(): Promise<void> {
  const response = await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok && response.status !== 204) {
    throw new ApiError('Unable to initialize the secure session.', response.status);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = String(init.method || 'GET').toUpperCase();
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (mutating) {
    await ensureCsrfCookie();
  }

  const csrfToken = mutating ? cookieValue('XSRF-TOKEN') : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
      ...(init.headers || {}),
    },
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {
      message?: string;
      errors?: Record<string, string[]>;
    };

    throw new ApiError(body.message || `API request failed with ${response.status}.`, response.status, body.errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
