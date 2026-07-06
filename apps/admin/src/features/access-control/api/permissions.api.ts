import { apiClient } from '@/lib/api/api-client';

import {
  CreatePermissionInput,
  PermissionDetail,
  PermissionListFilters,
  PermissionListItem,
  PermissionListResponse,
  UpdatePermissionInput,
} from '../types/permission.types';

export const permissionsApi = {
  async list(filters: PermissionListFilters): Promise<PermissionListResponse> {
    const { data } = await apiClient.get<PermissionListResponse>('/admin/permissions', {
      params: {
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search || undefined,
        module: filters.module || undefined,
        isActive: filters.isActive,
        isSystem: filters.isSystem,
      },
    });

    return data;
  },

  async listModules(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/admin/permissions/modules');

    return data;
  },

  async getById(permissionId: string): Promise<PermissionDetail> {
    const { data } = await apiClient.get<PermissionDetail>(`/admin/permissions/${permissionId}`);

    return data;
  },

  async create(input: CreatePermissionInput): Promise<PermissionListItem> {
    const { data } = await apiClient.post<PermissionListItem>('/admin/permissions', input);

    return data;
  },

  async update(input: UpdatePermissionInput): Promise<PermissionListItem> {
    const { data } = await apiClient.put<PermissionListItem>(
      `/admin/permissions/${input.permissionId}`,
      input.data,
    );

    return data;
  },

  async delete(permissionId: string): Promise<void> {
    await apiClient.delete(`/admin/permissions/${permissionId}`);
  },
};
