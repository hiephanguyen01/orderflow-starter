export const SYSTEM_PERMISSIONS = {
  SUPER_ADMIN: 'system.super-admin',
} as const;

export const ACCESS_CONTROL_PERMISSIONS = {
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',

  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_CREATE: 'permissions.create',
  PERMISSIONS_UPDATE: 'permissions.update',
  PERMISSIONS_DELETE: 'permissions.delete',
  PERMISSIONS_ASSIGN: 'permissions.assign',

  USERS_READ: 'users.read',
  USERS_MANAGE_ACCESS: 'users.manage-access',
} as const;
