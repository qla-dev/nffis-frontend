import { apiRequest } from './api';

export interface AdminRole { id: number; name: string; slug: string; level: number }
export interface AdminUser { id: number; name: string; username: string; email: string; role_id: number; role?: AdminRole; disabled_at: string | null; created_at: string }
export interface AdminUserPage { data: AdminUser[]; total: number; roles: AdminRole[] }

export function listUsers(filters: { q?: string; role_id?: string; status?: string } = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]).toString();
  return apiRequest<AdminUserPage>(`/admin/users${query ? `?${query}` : ''}`);
}

export function createUser(body: { name: string; username: string; email: string; role_id: number; password: string }) {
  return apiRequest<{ data: AdminUser }>('/admin/users', { method: 'POST', body: JSON.stringify(body) });
}

export function updateUser(id: number, body: Partial<{ name: string; email: string; role_id: number; password: string }>) {
  return apiRequest<{ data: AdminUser }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function setUserDisabled(id: number, disabled: boolean) {
  return apiRequest<{ data: AdminUser }>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ disabled }) });
}
