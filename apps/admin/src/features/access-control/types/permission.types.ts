import { PaginatedResult } from './role.types';

export type PermissionListItem = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  roleCount: number;
  directUserCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PermissionRoleAssignment = {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  assignedAt: string;
};

export type PermissionDirectUserAssignment = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  };
  effect: 'ALLOW' | 'DENY';
  assignedAt: string;
};

export type PermissionDetail = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  roles: PermissionRoleAssignment[];
  directUsers: PermissionDirectUserAssignment[];
  createdAt: string;
  updatedAt: string;
};

export type PermissionListFilters = {
  page: number;
  pageSize: number;
  search?: string;
  module?: string;
  isActive?: boolean;
  isSystem?: boolean;
};

export type CreatePermissionInput = {
  code: string;
  name: string;
  module: string;
  description?: string;
};

export type UpdatePermissionInput = {
  permissionId: string;
  data: {
    name: string;
    description?: string | null;
    isActive: boolean;
  };
};

export type PermissionListResponse = PaginatedResult<PermissionListItem>;
