import type { AuthPermission, AuthUser } from '../../lib/auth/session';

export function permission(
  slug: string,
  actions: Partial<Pick<AuthPermission, 'can_view' | 'can_create' | 'can_update' | 'can_delete'>> = {},
): AuthPermission {
  return {
    id: 1,
    role_id: 1,
    module_id: 1,
    can_view: false,
    can_create: false,
    can_update: false,
    can_delete: false,
    ...actions,
    module: { id: 1, name: slug, slug, group: 'Test' },
  };
}

export function authUser(
  role: { slug: string; name?: string; level?: number; permissions?: AuthPermission[] } = { slug: 'public' },
): AuthUser {
  return {
    id: 7,
    name: 'Test User',
    username: 'tester',
    email: 'tester@nffis.local',
    role: {
      id: 2,
      name: role.name ?? role.slug,
      slug: role.slug,
      level: role.level ?? 9,
      permissions: role.permissions ?? [],
    },
  };
}
