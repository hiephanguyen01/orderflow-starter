'use client';

import { ReactNode } from 'react';

import { usePermissions } from '../hooks/use-permissions';
import { PermissionMatchMode } from '../utils/permission';

type CanProps = {
  permissions: string | string[];
  mode?: PermissionMatchMode;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ permissions, mode = 'ALL', children, fallback = null }: CanProps) {
  const { can } = usePermissions();

  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  const allowed = can(requiredPermissions, mode);

  return allowed ? children : fallback;
}
