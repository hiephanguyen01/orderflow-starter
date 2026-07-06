'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { rolesApi } from '../api/roles.api';
import { roleQueryKeys } from './role-query-keys';

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.create,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: roleQueryKeys.lists(),
      });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { refreshAuthorization } = useAuth();

  return useMutation({
    mutationFn: rolesApi.updateConfiguration,

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: roleQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: roleQueryKeys.detail(variables.roleId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['access-control', 'user-access'],
        }),
      ]);

      await refreshAuthorization();
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.delete,

    onSuccess: async (_data, roleId) => {
      queryClient.removeQueries({
        queryKey: roleQueryKeys.detail(roleId),
      });

      await queryClient.invalidateQueries({
        queryKey: roleQueryKeys.lists(),
      });
    },
  });
}
