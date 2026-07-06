'use client';

import { Button, Chip, Table } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { PermissionListItem } from '../types/permission.types';
import { Can } from './can';

type PermissionsTableProps = {
  permissions: PermissionListItem[];
  isLoading: boolean;
  onEdit: (permission: PermissionListItem) => void;
  onDelete: (permission: PermissionListItem) => void;
};

export function PermissionsTable({
  permissions,
  isLoading,
  onEdit,
  onDelete,
}: PermissionsTableProps) {
  const t = useTranslations('AccessControl.permissions');

  return (
    <div className="overflow-hidden rounded-2xl bg-background">
      <Table>
        <Table.Content aria-label={t('tableLabel')}>
          <Table.Header>
            <Table.Column isRowHeader>{t('columns.permission')}</Table.Column>
            <Table.Column>{t('columns.module')}</Table.Column>
            <Table.Column>{t('columns.roles')}</Table.Column>
            <Table.Column>{t('columns.directUsers')}</Table.Column>
            <Table.Column>{t('columns.type')}</Table.Column>
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
            {permissions.map((permission) => (
              <Table.Row key={permission.id} id={permission.id}>
                <Table.Cell>
                  <div className="min-w-64">
                    <p className="font-medium">{permission.name}</p>
                    <code className="mt-1 block text-xs text-default-500">{permission.code}</code>
                    {permission.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-default-400">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <Chip variant="secondary">{permission.module}</Chip>
                </Table.Cell>

                <Table.Cell>{permission.roleCount}</Table.Cell>
                <Table.Cell>{permission.directUserCount}</Table.Cell>

                <Table.Cell>
                  <Chip color={permission.isSystem ? 'warning' : 'default'} variant="soft">
                    {permission.isSystem ? t('type.system') : t('type.custom')}
                  </Chip>
                </Table.Cell>

                <Table.Cell>
                  <Chip color={permission.isActive ? 'success' : 'default'} variant="soft">
                    {permission.isActive ? t('status.active') : t('status.inactive')}
                  </Chip>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Can permissions="permissions.update">
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={permission.isSystem}
                        onPress={() => {
                          onEdit(permission);
                        }}
                      >
                        {t('actions.edit')}
                      </Button>
                    </Can>

                    <Can permissions="permissions.delete">
                      <Button
                        size="sm"
                        variant="danger"
                        isDisabled={permission.isSystem}
                        onPress={() => {
                          onDelete(permission);
                        }}
                      >
                        {t('actions.delete')}
                      </Button>
                    </Can>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
}
