'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { useUsers } from '../hooks/use-users';
import { UsersFilters, UserStatusFilter } from './users-filters';
import { UsersPagination } from './users-pagination';
import { UsersTable } from './users-table';

export function UsersPageContent() {
  const t = useTranslations('AccessControl.users');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatusFilter>('ALL');

  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      status: status === 'ALL' ? undefined : status,
    }),
    [page, debouncedSearch, status],
  );

  const { data, isLoading } = useUsers(filters);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: UserStatusFilter): void => {
    setStatus(value);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-default-500">{t('description')}</p>
      </header>

      <UsersFilters
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
      />

      <UsersTable users={isLoading ? [] : (data?.items ?? [])} isLoading={isLoading} />

      {data && data.pagination.totalPages > 1 && (
        <UsersPagination pagination={data.pagination} onPageChange={setPage} />
      )}
    </section>
  );
}
