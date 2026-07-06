import { RoleListFilters } from '../types/role.types';

export const roleQueryKeys = {
  all: ['access-control', 'roles'] as const,

  lists: () => [...roleQueryKeys.all, 'list'] as const,

  list: (filters: RoleListFilters) => [...roleQueryKeys.lists(), filters] as const,

  details: () => [...roleQueryKeys.all, 'detail'] as const,

  detail: (roleId: string) => [...roleQueryKeys.details(), roleId] as const,

  assignablePermissions: ['access-control', 'permissions', 'assignable'] as const,
};
