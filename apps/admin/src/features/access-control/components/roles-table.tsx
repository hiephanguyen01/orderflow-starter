'use client';

import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useTranslations } from 'next-intl';

import { RoleListItem } from '../api/access-control.api';

type RolesTableProps = {
  roles: RoleListItem[];
  onEdit: (role: RoleListItem) => void;
};

export function RolesTable({ roles, onEdit }: RolesTableProps) {
  const t = useTranslations('AccessControl.roles');

  return (
    <Table aria-label={t('tableLabel')}>
      <TableHeader>
        <TableColumn>{t('columns.name')}</TableColumn>

        <TableColumn>{t('columns.code')}</TableColumn>

        <TableColumn>{t('columns.permissions')}</TableColumn>

        <TableColumn>{t('columns.users')}</TableColumn>

        <TableColumn>{t('columns.status')}</TableColumn>

        <TableColumn>{t('columns.actions')}</TableColumn>
      </TableHeader>

      <TableBody emptyContent={t('empty')}>
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
              <Chip color={role.isActive ? 'success' : 'default'} variant="flat">
                {role.isActive ? t('status.active') : t('status.inactive')}
              </Chip>
            </TableCell>

            <TableCell>
              <Button size="sm" variant="light" onPress={() => onEdit(role)}>
                {t('actions.edit')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
