import { PaginatedResult } from './role.types';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type UserRoleSummary = {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
};

export type UserListItem = {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  authorizationVersion: number;
  roles: UserRoleSummary[];
  activeSessionCount: number;
  directPermissionCount: number;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserListFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
};

export type AssignableRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
};

export type AssignableUserPermission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
};

export type DirectPermissionEffect = 'ALLOW' | 'DENY';

type AssignedByUser = {
  id: string;
  email: string;
  displayName: string | null;
} | null;

export type UserAccessDetail = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: UserStatus;
    authorizationVersion: number;
    createdAt: string;
    isSuperAdmin: boolean;
  };

  roles: {
    role: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      isSystem: boolean;
      isActive: boolean;
    };
    assignedAt: string;
    assignedBy: AssignedByUser;
  }[];

  directPermissions: {
    permission: {
      id: string;
      code: string;
      name: string;
      module: string;
      description: string | null;
      isSystem: boolean;
      isActive: boolean;
    };
    effect: DirectPermissionEffect;
    assignedAt: string;
    assignedBy: AssignedByUser;
  }[];

  permissionBreakdown: {
    permission: {
      id: string;
      code: string;
      name: string;
      module: string;
      description: string | null;
      isActive: boolean;
    };
    roleSources: {
      roleId: string;
      roleCode: string;
      roleName: string;
    }[];
    directEffect: DirectPermissionEffect | null;
    isEffective: boolean;
  }[];

  effectivePermissionCodes: string[];
};

export type UserListResponse = PaginatedResult<UserListItem>;

export type ReplaceUserRolesInput = {
  userId: string;
  roleIds: string[];
};

export type ReplaceUserPermissionsInput = {
  userId: string;
  permissions: {
    permissionId: string;
    effect: DirectPermissionEffect;
  }[];
};
