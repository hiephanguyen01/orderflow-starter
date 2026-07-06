'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { usePermissionModules, usePermissionsList } from '../hooks/use-permissions-list';
import { PermissionListItem } from '../types/permission.types';
import { Can } from './can';
import { DeletePermissionModal } from './delete-permission-modal';
import { PermissionFormModal } from './permission-form-modal';
import {
  PermissionsFilters,
  PermissionStatusFilter,
  PermissionTypeFilter,
} from './permissions-filters';
import { PermissionsPagination } from './permissions-pagination';
import { PermissionsTable } from './permissions-table';

export function PermissionsPageContent() {
  const t = useTranslations('AccessControl.permissions');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState<PermissionStatusFilter>('ALL');
  const [type, setType] = useState<PermissionTypeFilter>('ALL');

  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      module: module || undefined,
      isActive: status === 'ALL' ? undefined : status === 'ACTIVE',
      isSystem: type === 'ALL' ? undefined : type === 'SYSTEM',
    }),
    [page, debouncedSearch, module, status, type],
  );

  const { data, isLoading } = usePermissionsList(filters);
  const { data: modules = [] } = usePermissionModules();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PermissionListItem | null>(null);

  const handleCreate = (): void => {
    setEditingPermission(null);
    setFormModalOpen(true);
  };

  const handleEdit = (permission: PermissionListItem): void => {
    setEditingPermission(permission);
    setFormModalOpen(true);
  };

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    setPage(1);
  };

  const handleModuleChange = (value: string): void => {
    setModule(value);
    setPage(1);
  };

  const handleStatusChange = (value: PermissionStatusFilter): void => {
    setStatus(value);
    setPage(1);
  };

  const handleTypeChange = (value: PermissionTypeFilter): void => {
    setType(value);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-default-500">{t('description')}</p>
        </div>

        <Can permissions="permissions.create">
          <Button variant="primary" onPress={handleCreate}>
            {t('create')}
          </Button>
        </Can>
      </header>

      <PermissionsFilters
        search={search}
        onSearchChange={handleSearchChange}
        module={module}
        modules={modules}
        onModuleChange={handleModuleChange}
        status={status}
        onStatusChange={handleStatusChange}
        type={type}
        onTypeChange={handleTypeChange}
      />

      <PermissionsTable
        permissions={isLoading ? [] : (data?.items ?? [])}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      {data && data.pagination.totalPages > 1 && (
        <PermissionsPagination pagination={data.pagination} onPageChange={setPage} />
      )}

      <PermissionFormModal
        isOpen={formModalOpen}
        onOpenChange={setFormModalOpen}
        permission={editingPermission}
      />

      <DeletePermissionModal
        isOpen={deleteTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTarget(null);
          }
        }}
        permission={deleteTarget}
      />
    </section>
  );
}
