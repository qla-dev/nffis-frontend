import { apiRequest } from '@/services/api';

export interface RolePermission {
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  module: { id: number; name: string; slug: string; group: string };
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: {
    id: number;
    name: string;
    slug: string;
    level: number;
    permissions: RolePermission[];
  } | null;
}

interface UserResponse {
  user: AuthenticatedUser;
}

export async function fetchCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    return (await apiRequest<UserResponse>('/me')).user;
  } catch (error: any) {
    if (error?.status === 401) return null;
    throw error;
  }
}

export async function login(loginValue: string, password: string): Promise<AuthenticatedUser> {
  return (await apiRequest<UserResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue.trim(), password }),
  })).user;
}

export async function logout(): Promise<void> {
  await apiRequest<{ message: string }>('/logout', { method: 'POST' });
}

export function hasPermission(
  user: AuthenticatedUser | null,
  module: string,
  action: 'view' | 'create' | 'update' | 'delete',
): boolean {
  if (user?.role?.slug === 'super-admin') return true;
  const permission = user?.role?.permissions.find((item) => item.module.slug === module);
  return Boolean(permission?.[`can_${action}`]);
}
