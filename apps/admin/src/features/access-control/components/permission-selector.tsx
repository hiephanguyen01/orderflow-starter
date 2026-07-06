'use client';

import { Button, Checkbox, Label, SearchField } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { AssignablePermission } from '../types/role.types';
import { groupPermissions } from '../utils/group-permissions';

type PermissionSelectorProps = {
  permissions: AssignablePermission[];
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  isDisabled?: boolean;
};

export function PermissionSelector({
  isDisabled = false,
  permissions,
  selectedPermissionIds,
  onChange,
}: PermissionSelectorProps) {
  const t = useTranslations('AccessControl.roles.form.permissions');

  const [search, setSearch] = useState('');

  const selectedSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return permissions;
    }

    return permissions.filter(
      (permission) =>
        permission.code.toLowerCase().includes(normalizedSearch) ||
        permission.name.toLowerCase().includes(normalizedSearch) ||
        permission.module.toLowerCase().includes(normalizedSearch),
    );
  }, [permissions, search]);

  const groups = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);

  const togglePermission = (permissionId: string, selected: boolean): void => {
    const next = new Set(selectedSet);

    if (selected) {
      next.add(permissionId);
    } else {
      next.delete(permissionId);
    }

    onChange([...next]);
  };

  const toggleModule = (modulePermissionIds: string[], selected: boolean): void => {
    const next = new Set(selectedSet);

    for (const permissionId of modulePermissionIds) {
      if (selected) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
    }

    onChange([...next]);
  };

  return (
    <div className="space-y-4">
      <SearchField
        value={search}
        onChange={setSearch}
        aria-label={t('searchLabel')}
        isDisabled={isDisabled}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={t('searchPlaceholder')} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <div className="max-h-[24rem] space-y-4 overflow-y-auto rounded-xl border border-default-200 p-4">
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-default-500">{t('empty')}</p>
        )}

        {groups.map((group) => {
          const moduleIds = group.permissions.map(({ id }) => id);
          const selectedCount = moduleIds.filter((id) => selectedSet.has(id)).length;
          const allSelected = moduleIds.length > 0 && selectedCount === moduleIds.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <section key={group.module} className="rounded-xl bg-default-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{group.module}</p>
                  <p className="text-xs text-default-500">
                    {t('selectedCount', { selected: selectedCount, total: moduleIds.length })}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  isDisabled={isDisabled}
                  onPress={() => {
                    toggleModule(moduleIds, !allSelected);
                  }}
                >
                  {allSelected ? t('clearModule') : t('selectModule')}
                </Button>
              </div>

              {someSelected && (
                <p className="mb-2 text-xs text-warning">{t('partiallySelected')}</p>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {group.permissions.map((permission) => (
                  <Checkbox
                    key={permission.id}
                    isSelected={selectedSet.has(permission.id)}
                    isDisabled={isDisabled}
                    onChange={(selected) => {
                      togglePermission(permission.id, selected);
                    }}
                  >
                    <Checkbox.Content className="items-start">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>

                      <Label>
                        <span className="block font-medium">{permission.name}</span>
                        <code className="block text-xs text-default-500">{permission.code}</code>
                        {permission.description && (
                          <span className="mt-1 block text-xs text-default-400">
                            {permission.description}
                          </span>
                        )}
                      </Label>
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
