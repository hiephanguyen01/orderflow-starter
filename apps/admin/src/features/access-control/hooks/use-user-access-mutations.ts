'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { userAccessApi } from '../api/user-access.api';
import { userAccessQueryKeys } from './user-access-query-keys';

export function useReplaceUserRoles() {
  const queryClient = useQueryClient();
  const { user, refreshAuthorization } = useAuth();

  return useMutation({
    mutationFn: userAccessApi.replaceRoles,

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userAccessQueryKeys.users() }),
        queryClient.invalidateQueries({ queryKey: userAccessQueryKeys.detail(variables.userId) }),
      ]);

      if (variables.userId === user?.id) {
        await refreshAuthorization();
      }
    },
  });
}

export function useReplaceUserPermissions() {
  const queryClient = useQueryClient();
  const { user, refreshAuthorization } = useAuth();

  return useMutation({
    mutationFn: userAccessApi.replacePermissions,

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userAccessQueryKeys.users() }),
        queryClient.invalidateQueries({ queryKey: userAccessQueryKeys.detail(variables.userId) }),
      ]);

      if (variables.userId === user?.id) {
        await refreshAuthorization();
      }
    },
  });
}
