'use client';

import { useQuery } from '@tanstack/react-query';

import { rolesApi } from '../api/roles.api';
import { RoleListFilters } from '../types/role.types';
import { roleQueryKeys } from './role-query-keys';

export function useRoles(filters: RoleListFilters) {
  return useQuery({
    queryKey: roleQueryKeys.list(filters),
    queryFn: () => rolesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useRole(roleId: string | null) {
  return useQuery({
    queryKey: roleQueryKeys.detail(roleId ?? ''),
    queryFn: () => rolesApi.getById(roleId!),
    enabled: Boolean(roleId),
  });
}

export function useAssignablePermissions(enabled: boolean) {
  return useQuery({
    queryKey: roleQueryKeys.assignablePermissions,
    queryFn: rolesApi.listAssignablePermissions,
    enabled,
    staleTime: 60_000,
  });
}
