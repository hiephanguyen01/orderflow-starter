import { apiClient } from '@/lib/api/api-client';

export type RoleListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
};

export type CreateRoleInput = {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
};

export const accessControlApi = {
  async getRoles(): Promise<RoleListItem[]> {
    const { data } = await apiClient.get<RoleListItem[]>('/admin/roles');

    return data;
  },

  async createRole(input: CreateRoleInput): Promise<RoleListItem> {
    const { data } = await apiClient.post<RoleListItem>('/admin/roles', input);

    return data;
  },

  async replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
    await apiClient.put(`/admin/users/${userId}/roles`, {
      roleIds,
    });
  },
};
