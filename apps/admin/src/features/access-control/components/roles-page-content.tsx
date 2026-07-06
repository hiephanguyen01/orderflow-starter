'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { useRole, useRoles } from '../hooks/use-roles';
import { RoleListItem } from '../types/role.types';
import { Can } from './can';
import { DeleteRoleModal } from './delete-role-modal';
import { RoleFormModal } from './role-form-modal';
import { RolesFilters, RoleStatusFilter } from './roles-filters';
import { RolesPagination } from './roles-pagination';
import { RolesTable } from './roles-table';

export function RolesPageContent() {
  const t = useTranslations('AccessControl.roles');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RoleStatusFilter>('ALL');

  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: debouncedSearch || undefined,
      isActive: status === 'ALL' ? undefined : status === 'ACTIVE',
    }),
    [page, debouncedSearch, status],
  );

  const { data, isLoading } = useRoles(filters);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const { data: editingRole } = useRole(editingRoleId);

  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | null>(null);

  const handleCreate = (): void => {
    setEditingRoleId(null);
    setFormModalOpen(true);
  };

  const handleEdit = (role: RoleListItem): void => {
    setEditingRoleId(role.id);
    setFormModalOpen(true);
  };

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (nextStatus: RoleStatusFilter): void => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-default-500">{t('description')}</p>
        </div>

        <Can permissions="roles.create">
          <Button variant="primary" onPress={handleCreate}>
            {t('create')}
          </Button>
        </Can>
      </header>

      <RolesFilters
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
      />

      <RolesTable
        roles={isLoading ? [] : (data?.items ?? [])}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      {data && data.pagination.totalPages > 1 && (
        <RolesPagination pagination={data.pagination} onPageChange={setPage} />
      )}

      <RoleFormModal
        isOpen={formModalOpen}
        onOpenChange={setFormModalOpen}
        role={editingRoleId ? (editingRole ?? null) : null}
      />

      <DeleteRoleModal
        isOpen={deleteTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null);
          }
        }}
        role={deleteTarget}
      />
    </section>
  );
}
