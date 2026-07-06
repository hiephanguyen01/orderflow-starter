export type PermissionSeedDefinition = {
  code: string;
  name: string;
  module: string;
  description: string;
  isSystem?: boolean;
};

export const permissionDefinitions: PermissionSeedDefinition[] = [
  {
    code: 'system.super-admin',
    name: 'Super administrator',
    module: 'system',
    description: 'Grants unrestricted access to protected system operations.',
    isSystem: true,
  },

  {
    code: 'roles.read',
    name: 'View roles',
    module: 'access-control',
    description: 'View roles and their assigned permissions.',
    isSystem: true,
  },
  {
    code: 'roles.create',
    name: 'Create roles',
    module: 'access-control',
    description: 'Create new roles at runtime.',
    isSystem: true,
  },
  {
    code: 'roles.update',
    name: 'Update roles',
    module: 'access-control',
    description: 'Update role information and status.',
    isSystem: true,
  },
  {
    code: 'roles.delete',
    name: 'Delete roles',
    module: 'access-control',
    description: 'Delete non-system roles.',
    isSystem: true,
  },
  {
    code: 'roles.assign',
    name: 'Assign roles',
    module: 'access-control',
    description: 'Assign or revoke roles for users.',
    isSystem: true,
  },

  {
    code: 'permissions.read',
    name: 'View permissions',
    module: 'access-control',
    description: 'View system permissions.',
    isSystem: true,
  },
  {
    code: 'permissions.create',
    name: 'Create permissions',
    module: 'access-control',
    description: 'Create new permissions at runtime.',
    isSystem: true,
  },
  {
    code: 'permissions.update',
    name: 'Update permissions',
    module: 'access-control',
    description: 'Update permission information and status.',
    isSystem: true,
  },
  {
    code: 'permissions.delete',
    name: 'Delete permissions',
    module: 'access-control',
    description: 'Delete non-system permissions.',
    isSystem: true,
  },
  {
    code: 'permissions.assign',
    name: 'Assign permissions',
    module: 'access-control',
    description: 'Assign permissions to roles or users.',
    isSystem: true,
  },

  {
    code: 'users.read',
    name: 'View users',
    module: 'users',
    description: 'View users and basic account information.',
    isSystem: true,
  },
  {
    code: 'users.manage-access',
    name: 'Manage user access',
    module: 'users',
    description: 'Manage user roles and direct permissions.',
    isSystem: true,
  },

  {
    code: 'sessions.read',
    name: 'View sessions',
    module: 'identity',
    description: 'View active login sessions.',
    isSystem: true,
  },
  {
    code: 'sessions.revoke',
    name: 'Revoke sessions',
    module: 'identity',
    description: 'Revoke login sessions belonging to users.',
    isSystem: true,
  },

  {
    code: 'audit-logs.read',
    name: 'View audit logs',
    module: 'audit',
    description: 'View security and business audit records.',
    isSystem: true,
  },
];
