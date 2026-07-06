'use client';

import { Button, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { RoleListItem } from '../types/role.types';
import { Can } from './can';

type RolesTableProps = {
  roles: RoleListItem[];
  onEdit: (role: RoleListItem) => void;
  onDelete: (role: RoleListItem) => void;
};

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  const t = useTranslations('AccessControl.roles');

  return (
    <Table>
      <Table.Content aria-label={t('tableLabel')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('columns.name')}</TableColumn>
          <TableColumn>{t('columns.code')}</TableColumn>
          <TableColumn>{t('columns.permissions')}</TableColumn>
          <TableColumn>{t('columns.users')}</TableColumn>
          <TableColumn>{t('columns.status')}</TableColumn>
          <TableColumn>{t('columns.actions')}</TableColumn>
        </TableHeader>

        <TableBody renderEmptyState={() => t('empty')}>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{role.name}</p>
                  {role.description && (
                    <p className="text-small text-default-500">{role.description}</p>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <code>{role.code}</code>
              </TableCell>

              <TableCell>{role.permissionCount}</TableCell>
              <TableCell>{role.userCount}</TableCell>

              <TableCell>
                <Chip color={role.isActive ? 'success' : 'default'} variant="soft">
                  {role.isActive ? t('status.active') : t('status.inactive')}
                </Chip>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Can permissions="roles.update">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        onEdit(role);
                      }}
                    >
                      {t('actions.edit')}
                    </Button>
                  </Can>

                  <Can permissions="roles.delete">
                    <Button
                      size="sm"
                      variant="danger"
                      isDisabled={role.isSystem}
                      onPress={() => {
                        onDelete(role);
                      }}
                    >
                      {t('actions.delete')}
                    </Button>
                  </Can>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table.Content>
    </Table>
  );
}
