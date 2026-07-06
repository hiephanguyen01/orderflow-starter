export type PaginationMetadata = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMetadata;
};

export type RoleListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RolePermission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  assignedAt: string;
};

export type RoleDetail = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
};

export type AssignablePermission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
};

export type RoleListFilters = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
};

export type CreateRoleInput = {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
};

export type UpdateRoleConfigurationInput = {
  roleId: string;
  data: {
    name: string;
    description?: string | null;
    isActive: boolean;
    permissionIds: string[];
  };
};
