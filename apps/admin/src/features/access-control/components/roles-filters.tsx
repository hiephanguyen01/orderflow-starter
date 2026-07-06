'use client';

import { Button, SearchField } from '@heroui/react';
import { useTranslations } from 'next-intl';

export type RoleStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

type RolesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: RoleStatusFilter;
  onStatusChange: (status: RoleStatusFilter) => void;
};

export function RolesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: RolesFiltersProps) {
  const t = useTranslations('AccessControl.roles.filters');

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-background p-4 md:flex-row md:items-center md:justify-between">
      <SearchField
        value={search}
        onChange={onSearchChange}
        aria-label={t('searchLabel')}
        className="w-full md:max-w-md"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={t('searchPlaceholder')} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={status === 'ALL' ? 'primary' : 'ghost'}
          onPress={() => {
            onStatusChange('ALL');
          }}
        >
          {t('all')}
        </Button>

        <Button
          size="sm"
          variant={status === 'ACTIVE' ? 'primary' : 'ghost'}
          onPress={() => {
            onStatusChange('ACTIVE');
          }}
        >
          {t('active')}
        </Button>

        <Button
          size="sm"
          variant={status === 'INACTIVE' ? 'primary' : 'ghost'}
          onPress={() => {
            onStatusChange('INACTIVE');
          }}
        >
          {t('inactive')}
        </Button>
      </div>
    </div>
  );
}
