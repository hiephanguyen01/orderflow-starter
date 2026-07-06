import { PermissionListFilters } from '../types/permission.types';

export const permissionQueryKeys = {
  all: ['access-control', 'permissions'] as const,

  lists: () => [...permissionQueryKeys.all, 'list'] as const,

  list: (filters: PermissionListFilters) => [...permissionQueryKeys.lists(), filters] as const,

  details: () => [...permissionQueryKeys.all, 'detail'] as const,

  detail: (permissionId: string) => [...permissionQueryKeys.details(), permissionId] as const,

  modules: ['access-control', 'permissions', 'modules'] as const,

  assignable: ['access-control', 'permissions', 'assignable'] as const,
};
