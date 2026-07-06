'use client';

import { useQuery } from '@tanstack/react-query';

import { permissionsApi } from '../api/permissions.api';
import { PermissionListFilters } from '../types/permission.types';
import { permissionQueryKeys } from './permission-query-keys';

export function usePermissionsList(filters: PermissionListFilters) {
  return useQuery({
    queryKey: permissionQueryKeys.list(filters),
    queryFn: () => permissionsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function usePermissionDetail(permissionId: string | null) {
  return useQuery({
    queryKey: permissionQueryKeys.detail(permissionId ?? ''),
    queryFn: () => permissionsApi.getById(permissionId!),
    enabled: Boolean(permissionId),
  });
}

export function usePermissionModules() {
  return useQuery({
    queryKey: permissionQueryKeys.modules,
    queryFn: permissionsApi.listModules,
    staleTime: 60_000,
  });
}
