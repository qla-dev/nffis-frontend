import { API_BASE_URL } from '../../services/api';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

export interface AuthModule {
  id: number;
  name: string;
  slug: string;
  group: string;
}

export interface AuthPermission {
  id: number;
  role_id: number;
  module_id: number;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  module: AuthModule;
}

export interface AuthRole {
  id: number;
  name: string;
  slug: string;
  level: number;
  permissions: AuthPermission[];
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: AuthRole | null;
}

interface UserResponse {
  user: AuthUser;
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function backendUrl(path: string): string {
  const apiSuffix = /\/api$/i;
  const base = apiSuffix.test(API_BASE_URL)
    ? API_BASE_URL.replace(apiSuffix, '')
    : API_BASE_URL;

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function cookie(name: string): string | null {
  const prefix = `${name}=`;
  const item = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') return payload.message;

    const firstValidationError = Object.values(payload?.errors || {})
      .flat()
      .find((value) => typeof value === 'string');

    if (typeof firstValidationError === 'string') return firstValidationError;
  } catch {
    // Use the HTTP fallback below when the body is not JSON.
  }

  return `Request failed with status ${response.status}.`;
}

async function authenticatedUser(response: Response): Promise<AuthUser> {
  let payload: Partial<UserResponse>;
  try {
    payload = await response.json() as Partial<UserResponse>;
  } catch {
    throw new Error('Authentication service returned an invalid response. Please redeploy the frontend or check the API configuration.');
  }

  if (!payload.user) {
    throw new Error('Authentication service response does not contain a user.');
  }

  return payload.user;
}

export async function csrfHeaders(): Promise<Record<string, string>> {
  const response = await fetch(backendUrl('/sanctum/csrf-cookie'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(await responseMessage(response));

  const token = cookie('XSRF-TOKEN');
  return token ? { 'X-XSRF-TOKEN': token } : {};
}

export async function currentUser(): Promise<AuthUser | null> {
  const response = await fetch(apiUrl('/me'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await responseMessage(response));

  return authenticatedUser(response);
}

export async function login(loginValue: string, password: string): Promise<AuthUser> {
  const headers = await csrfHeaders();
  const response = await fetch(apiUrl('/login'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ login: loginValue.trim(), password }),
  });

  if (!response.ok) throw new Error(await responseMessage(response));
  return authenticatedUser(response);
}

export async function logout(): Promise<void> {
  const headers = await csrfHeaders();
  const response = await fetch(apiUrl('/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', ...headers },
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(await responseMessage(response));
  }
}

export function hasPermission(
  user: AuthUser | null,
  moduleSlug: string,
  action: PermissionAction
): boolean {
  if (!user?.role) return false;
  if (user.role.slug === 'super-admin') return true;

  const permission = user.role.permissions?.find((item) => item.module?.slug === moduleSlug);
  return Boolean(permission?.[`can_${action}` as keyof AuthPermission]);
}

export function canUploadAws(user: AuthUser | null): boolean {
  return user?.role?.slug === 'super-admin' || user?.role?.level === 6;
}
