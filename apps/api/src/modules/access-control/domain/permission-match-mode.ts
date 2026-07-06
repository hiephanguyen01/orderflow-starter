export type PermissionMatchMode = 'ALL' | 'ANY';

export type RequiredPermissionsMetadata = {
  permissions: string[];
  mode: PermissionMatchMode;
};
