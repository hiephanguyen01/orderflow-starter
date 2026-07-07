import { UserListFilters } from '../types/user-access.types';

export const userAccessQueryKeys = {
  all: ['access-control', 'user-access'] as const,

  users: () => [...userAccessQueryKeys.all, 'users'] as const,

  userList: (filters: UserListFilters) => [...userAccessQueryKeys.users(), filters] as const,

  detail: (userId: string) => [...userAccessQueryKeys.all, 'detail', userId] as const,

  assignableRoles: ['access-control', 'user-access', 'assignable-roles'] as const,

  assignablePermissions: ['access-control', 'user-access', 'assignable-permissions'] as const,
};
