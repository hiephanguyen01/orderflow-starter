'use client';

import { usePermissions } from './use-permissions';

export function usePermission(permission: string): boolean {
  const { hasPermission } = usePermissions();

  return hasPermission(permission);
}
