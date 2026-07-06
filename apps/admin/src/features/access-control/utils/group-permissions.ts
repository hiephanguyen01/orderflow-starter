import { AssignablePermission } from '../types/role.types';

export type PermissionGroup = {
  module: string;
  permissions: AssignablePermission[];
};

export function groupPermissions(permissions: AssignablePermission[]): PermissionGroup[] {
  const groups = new Map<string, AssignablePermission[]>();

  for (const permission of permissions) {
    const current = groups.get(permission.module) ?? [];

    current.push(permission);
    groups.set(permission.module, current);
  }

  return [...groups.entries()]
    .sort(([leftModule], [rightModule]) => leftModule.localeCompare(rightModule))
    .map(([module, modulePermissions]) => ({
      module,
      permissions: modulePermissions.sort((left, right) => left.code.localeCompare(right.code)),
    }));
}
