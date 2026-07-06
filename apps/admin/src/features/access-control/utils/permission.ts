import { CurrentAuthorization } from '@/features/auth/types/auth.types';

export type PermissionMatchMode = 'ALL' | 'ANY';

export function matchesPermissions(
  authorization: CurrentAuthorization | null,
  requiredPermissions: string[],
  mode: PermissionMatchMode = 'ALL',
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  if (!authorization) {
    return false;
  }

  if (authorization.isSuperAdmin) {
    return true;
  }

  const permissionSet = new Set(authorization.permissionCodes);

  if (mode === 'ANY') {
    return requiredPermissions.some((permission) => permissionSet.has(permission));
  }

  return requiredPermissions.every((permission) => permissionSet.has(permission));
}
