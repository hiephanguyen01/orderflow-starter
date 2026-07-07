'use client';

import { Button, SearchField } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { UserStatus } from '../types/user-access.types';

export type UserStatusFilter = 'ALL' | UserStatus;

type UsersFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: UserStatusFilter;
  onStatusChange: (status: UserStatusFilter) => void;
};

export function UsersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: UsersFiltersProps) {
  const t = useTranslations('AccessControl.users.filters');

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
        {(['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? 'primary' : 'ghost'}
            onPress={() => {
              onStatusChange(value);
            }}
          >
            {t(`statusValues.${value}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
