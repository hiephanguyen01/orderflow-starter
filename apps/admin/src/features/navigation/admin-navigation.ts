import { PermissionMatchMode } from '@/features/access-control/utils/permission';

export type AdminNavigationItem = {
  key: string;
  labelKey: string;
  href: string;
  requiredPermissions?: string[];
  matchMode?: PermissionMatchMode;
};

export type AdminNavigationGroup = {
  key: string;
  labelKey: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  {
    key: 'general',
    labelKey: 'groups.general',
    items: [
      {
        key: 'dashboard',
        labelKey: 'items.dashboard',
        href: '/admin',
      },
    ],
  },
  {
    key: 'access-control',
    labelKey: 'groups.accessControl',
    items: [
      {
        key: 'roles',
        labelKey: 'items.roles',
        href: '/admin/access-control/roles',
        requiredPermissions: ['roles.read'],
      },
      {
        key: 'permissions',
        labelKey: 'items.permissions',
        href: '/admin/access-control/permissions',
        requiredPermissions: ['permissions.read'],
      },
      {
        key: 'user-access',
        labelKey: 'items.userAccess',
        href: '/admin/access-control/users',
        requiredPermissions: ['users.read'],
      },
    ],
  },
  {
    key: 'security',
    labelKey: 'groups.security',
    items: [
      {
        key: 'audit-logs',
        labelKey: 'items.auditLogs',
        href: '/admin/audit-logs',
        requiredPermissions: ['audit-logs.read'],
      },
      {
        key: 'sessions',
        labelKey: 'items.sessions',
        href: '/admin/sessions',
        requiredPermissions: ['sessions.read'],
      },
    ],
  },
];
