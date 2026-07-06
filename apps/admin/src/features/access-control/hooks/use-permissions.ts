'use client';

import { useCallback, useMemo } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { matchesPermissions, PermissionMatchMode } from '../utils/permission';

export function usePermissions() {
  const { status, authorization } = useAuth();

  const permissionSet = useMemo(
    () => new Set(authorization?.permissionCodes ?? []),
    [authorization],
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (status !== 'authenticated') {
        return false;
      }

      if (authorization?.isSuperAdmin) {
        return true;
      }

      return permissionSet.has(permission);
    },
    [authorization, permissionSet, status],
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (status !== 'authenticated') {
        return false;
      }

      return matchesPermissions(authorization, permissions, 'ALL');
    },
    [authorization, status],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (status !== 'authenticated') {
        return false;
      }

      return matchesPermissions(authorization, permissions, 'ANY');
    },
    [authorization, status],
  );

  const can = useCallback(
    (permissions: string[], mode: PermissionMatchMode = 'ALL'): boolean => {
      if (status !== 'authenticated') {
        return false;
      }

      return matchesPermissions(authorization, permissions, mode);
    },
    [authorization, status],
  );

  return {
    authorization,
    isSuperAdmin: authorization?.isSuperAdmin ?? false,
    permissionCodes: authorization?.permissionCodes ?? [],
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    can,
  };
}
