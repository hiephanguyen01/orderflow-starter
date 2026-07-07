import { apiClient } from '@/lib/api/api-client';

import {
  AssignableRole,
  AssignableUserPermission,
  ReplaceUserPermissionsInput,
  ReplaceUserRolesInput,
  UserAccessDetail,
  UserListFilters,
  UserListResponse,
} from '../types/user-access.types';

export const userAccessApi = {
  async listUsers(filters: UserListFilters): Promise<UserListResponse> {
    const { data } = await apiClient.get<UserListResponse>('/admin/users', {
      params: {
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search || undefined,
        status: filters.status,
      },
    });

    return data;
  },

  async getUserAccess(userId: string): Promise<UserAccessDetail> {
    const { data } = await apiClient.get<UserAccessDetail>(`/admin/users/${userId}/access`);

    return data;
  },

  async listAssignableRoles(): Promise<AssignableRole[]> {
    const { data } = await apiClient.get<AssignableRole[]>('/admin/roles/assignable');

    return data;
  },

  async listAssignablePermissions(): Promise<AssignableUserPermission[]> {
    const { data } = await apiClient.get<AssignableUserPermission[]>(
      '/admin/permissions/assignable',
    );

    return data;
  },

  async replaceRoles(input: ReplaceUserRolesInput): Promise<void> {
    await apiClient.put(`/admin/users/${input.userId}/roles`, {
      roleIds: input.roleIds,
    });
  },

  async replacePermissions(input: ReplaceUserPermissionsInput): Promise<void> {
    await apiClient.put(`/admin/users/${input.userId}/permissions`, {
      permissions: input.permissions,
    });
  },
};
