'use client';

import { ReactNode } from 'react';

import { usePermissions } from '../hooks/use-permissions';
import { PermissionMatchMode } from '../utils/permission';
import { ForbiddenState } from './forbidden-state';

type RequirePermissionsProps = {
  permissions: string[];
  mode?: PermissionMatchMode;
  children: ReactNode;
};

export function RequirePermissions({ permissions, mode = 'ALL', children }: RequirePermissionsProps) {
  const { can } = usePermissions();

  const allowed = can(permissions, mode);

  if (!allowed) {
    return <ForbiddenState />;
  }

  return children;
}
