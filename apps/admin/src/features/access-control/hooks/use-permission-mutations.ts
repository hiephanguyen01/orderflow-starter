'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { permissionsApi } from '../api/permissions.api';
import { permissionQueryKeys } from './permission-query-keys';
import { roleQueryKeys } from './role-query-keys';

export function useCreatePermission() {
  const queryClient = useQueryClient();
  const { refreshAuthorization } = useAuth();

  return useMutation({
    mutationFn: permissionsApi.create,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.modules }),
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.assignable }),
        queryClient.invalidateQueries({ queryKey: roleQueryKeys.details() }),
      ]);

      await refreshAuthorization();
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  const { refreshAuthorization } = useAuth();

  return useMutation({
    mutationFn: permissionsApi.update,

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: permissionQueryKeys.detail(variables.permissionId),
        }),
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.assignable }),
        queryClient.invalidateQueries({ queryKey: roleQueryKeys.details() }),
        queryClient.invalidateQueries({ queryKey: ['access-control', 'user-access'] }),
      ]);

      await refreshAuthorization();
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permissionsApi.delete,

    onSuccess: async (_data, permissionId) => {
      queryClient.removeQueries({ queryKey: permissionQueryKeys.detail(permissionId) });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.modules }),
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.assignable }),
      ]);
    },
  });
}
