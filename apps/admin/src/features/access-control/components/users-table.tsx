'use client';

import { Button, Chip, Table } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';

import { UserListItem } from '../types/user-access.types';

type UsersTableProps = {
  users: UserListItem[];
  isLoading: boolean;
};

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const t = useTranslations('AccessControl.users');
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl bg-background">
      <Table>
        <Table.Content aria-label={t('tableLabel')}>
          <Table.Header>
            <Table.Column isRowHeader>{t('columns.user')}</Table.Column>
            <Table.Column>{t('columns.roles')}</Table.Column>
            <Table.Column>{t('columns.directPermissions')}</Table.Column>
            <Table.Column>{t('columns.sessions')}</Table.Column>
            <Table.Column>{t('columns.status')}</Table.Column>
            <Table.Column>{t('columns.actions')}</Table.Column>
          </Table.Header>

          <Table.Body
            renderEmptyState={() => (
              <div className="py-12 text-center text-sm text-default-500">
                {isLoading ? t('loading') : t('empty')}
              </div>
            )}
          >
            {users.map((user) => (
              <Table.Row key={user.id} id={user.id}>
                <Table.Cell>
                  <div className="min-w-64">
                    <p className="font-medium">{user.displayName ?? user.email}</p>
                    <p className="text-xs text-default-500">{user.email}</p>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {user.isSuperAdmin && (
                      <Chip color="warning" variant="soft">
                        {t('superAdmin')}
                      </Chip>
                    )}

                    {user.roles
                      .filter((role) => role.code !== 'SUPER_ADMIN')
                      .map((role) => (
                        <Chip key={role.id} variant="secondary">
                          {role.name}
                        </Chip>
                      ))}

                    {user.roles.length === 0 && (
                      <span className="text-xs text-default-400">{t('noRoles')}</span>
                    )}
                  </div>
                </Table.Cell>

                <Table.Cell>{user.directPermissionCount}</Table.Cell>
                <Table.Cell>{user.activeSessionCount}</Table.Cell>

                <Table.Cell>
                  <Chip color={user.status === 'ACTIVE' ? 'success' : 'default'} variant="soft">
                    {t(`status.${user.status}`)}
                  </Chip>
                </Table.Cell>

                <Table.Cell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      router.push(`/admin/access-control/users/${user.id}`);
                    }}
                  >
                    {t('actions.manage')}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
}
