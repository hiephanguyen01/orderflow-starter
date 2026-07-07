'use client';

import { Card, Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { UserAccessDetail } from '../types/user-access.types';

type UserAccessSummaryProps = {
  user: UserAccessDetail['user'];
};

export function UserAccessSummary({ user }: UserAccessSummaryProps) {
  const t = useTranslations('AccessControl.users.summary');

  return (
    <Card>
      <Card.Header>
        <Card.Title>{user.displayName ?? user.email}</Card.Title>
        <Card.Description>{user.email}</Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={user.status === 'ACTIVE' ? 'success' : 'default'} variant="soft">
            {t(`status.${user.status}`)}
          </Chip>

          {user.isSuperAdmin && (
            <Chip color="warning" variant="soft">
              {t('superAdmin')}
            </Chip>
          )}

          <span className="text-xs text-default-400">
            {t('authorizationVersion', { version: user.authorizationVersion })}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}
