'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { PaginationMetadata } from '../types/role.types';

type RolesPaginationProps = {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
};

export function RolesPagination({ pagination, onPageChange }: RolesPaginationProps) {
  const t = useTranslations('AccessControl.roles.pagination');

  const { page, totalPages, total } = pagination;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-default-500">
        {t('summary', { page, totalPages, total })}
      </p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          isDisabled={page <= 1}
          onPress={() => {
            onPageChange(page - 1);
          }}
        >
          {t('previous')}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          isDisabled={page >= totalPages}
          onPress={() => {
            onPageChange(page + 1);
          }}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
