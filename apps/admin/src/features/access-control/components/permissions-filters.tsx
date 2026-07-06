'use client';

import { Button, SearchField } from '@heroui/react';
import { useTranslations } from 'next-intl';

export type PermissionStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type PermissionTypeFilter = 'ALL' | 'SYSTEM' | 'CUSTOM';

type PermissionsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  module: string;
  modules: string[];
  onModuleChange: (module: string) => void;
  status: PermissionStatusFilter;
  onStatusChange: (status: PermissionStatusFilter) => void;
  type: PermissionTypeFilter;
  onTypeChange: (type: PermissionTypeFilter) => void;
};

export function PermissionsFilters({
  search,
  onSearchChange,
  module,
  modules,
  onModuleChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
}: PermissionsFiltersProps) {
  const t = useTranslations('AccessControl.permissions.filters');

  return (
    <div className="space-y-4 rounded-2xl bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <SearchField value={search} onChange={onSearchChange} aria-label={t('searchLabel')}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={t('searchPlaceholder')} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{t('module')}</span>

          <select
            value={module}
            onChange={(event) => {
              onModuleChange(event.target.value);
            }}
            className="h-10 rounded-xl border border-default-200 bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">{t('allModules')}</option>

            {modules.map((moduleName) => (
              <option key={moduleName} value={moduleName}>
                {moduleName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-default-500">{t('status')}:</span>

          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((value) => (
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-default-500">{t('type')}:</span>

          {(['ALL', 'SYSTEM', 'CUSTOM'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={type === value ? 'primary' : 'ghost'}
              onPress={() => {
                onTypeChange(value);
              }}
            >
              {t(`typeValues.${value}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
