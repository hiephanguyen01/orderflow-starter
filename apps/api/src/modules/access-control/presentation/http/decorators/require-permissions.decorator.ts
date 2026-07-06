import { SetMetadata } from '@nestjs/common';

import type {
  PermissionMatchMode,
  RequiredPermissionsMetadata,
} from '../../../domain/permission-match-mode.js';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export function RequirePermissions(permissions: string[], mode: PermissionMatchMode = 'ALL') {
  const metadata: RequiredPermissionsMetadata = {
    permissions,
    mode,
  };

  return SetMetadata(REQUIRED_PERMISSIONS_KEY, metadata);
}
