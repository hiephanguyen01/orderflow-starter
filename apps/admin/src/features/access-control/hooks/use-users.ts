'use client';

import { useQuery } from '@tanstack/react-query';

import { userAccessApi } from '../api/user-access.api';
import { UserListFilters } from '../types/user-access.types';
import { userAccessQueryKeys } from './user-access-query-keys';

export function useUsers(filters: UserListFilters) {
  return useQuery({
    queryKey: userAccessQueryKeys.userList(filters),
    queryFn: () => userAccessApi.listUsers(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useUserAccess(userId: string) {
  return useQuery({
    queryKey: userAccessQueryKeys.detail(userId),
    queryFn: () => userAccessApi.getUserAccess(userId),
    enabled: Boolean(userId),
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: userAccessQueryKeys.assignableRoles,
    queryFn: userAccessApi.listAssignableRoles,
    staleTime: 60_000,
  });
}

export function useAssignableUserPermissions() {
  return useQuery({
    queryKey: userAccessQueryKeys.assignablePermissions,
    queryFn: userAccessApi.listAssignablePermissions,
    staleTime: 60_000,
  });
}
