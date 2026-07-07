'use client';

import { useTranslations } from 'next-intl';

import { useUserAccess } from '../hooks/use-users';
import { DirectPermissionsPanel } from './direct-permissions-panel';
import { EffectivePermissionsPanel } from './effective-permissions-panel';
import { RoleAssignmentsPanel } from './role-assignments-panel';
import { UserAccessSummary } from './user-access-summary';

type UserAccessPageContentProps = {
  userId: string;
};

export function UserAccessPageContent({ userId }: UserAccessPageContentProps) {
  const t = useTranslations('AccessControl.users');
  
  const { data, isLoading } = useUserAccess(userId);

  if (isLoading || !data) {
    return <p className="text-sm text-default-500">{t('loading')}</p>;
  }

  return (
    <section className="space-y-6">
      <UserAccessSummary user={data.user} />
      <RoleAssignmentsPanel userId={userId} roles={data.roles} />
      <DirectPermissionsPanel
        userId={userId}
        directPermissions={data.directPermissions}
        isSuperAdminTarget={data.user.isSuperAdmin}
      />
      <EffectivePermissionsPanel permissionBreakdown={data.permissionBreakdown} />
    </section>
  );
}
