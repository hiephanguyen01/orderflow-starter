import { apiClient } from '@/lib/api/api-client';

import {
  AssignablePermission,
  CreateRoleInput,
  PaginatedResult,
  RoleDetail,
  RoleListFilters,
  RoleListItem,
  UpdateRoleConfigurationInput,
} from '../types/role.types';

export const rolesApi = {
  async list(filters: RoleListFilters): Promise<PaginatedResult<RoleListItem>> {
    const { data } = await apiClient.get<PaginatedResult<RoleListItem>>('/admin/roles', {
      params: {
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search || undefined,
        isActive: filters.isActive,
      },
    });

    return data;
  },

  async getById(roleId: string): Promise<RoleDetail> {
    const { data } = await apiClient.get<RoleDetail>(`/admin/roles/${roleId}`);

    return data;
  },

  async listAssignablePermissions(): Promise<AssignablePermission[]> {
    const { data } = await apiClient.get<AssignablePermission[]>('/admin/permissions/assignable');

    return data;
  },

  async create(input: CreateRoleInput): Promise<RoleListItem> {
    const { data } = await apiClient.post<RoleListItem>('/admin/roles', input);

    return data;
  },

  async updateConfiguration(input: UpdateRoleConfigurationInput): Promise<RoleListItem> {
    const { data } = await apiClient.put<RoleListItem>(
      `/admin/roles/${input.roleId}/configuration`,
      input.data,
    );

    return data;
  },

  async delete(roleId: string): Promise<void> {
    await apiClient.delete(`/admin/roles/${roleId}`);
  },
};
