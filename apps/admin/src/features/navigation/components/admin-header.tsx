'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { MobileAdminNavigation } from './mobile-admin-navigation';

export function AdminHeader() {
  const t = useTranslations('AdminHeader');
  const { user, logout } = useAuth();

  const displayName = user?.displayName ?? user?.email ?? '';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-default-200 bg-background/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <MobileAdminNavigation />

        <div>
          <p className="text-sm font-medium">{t('title')}</p>
          <p className="hidden text-xs text-default-500 sm:block">{t('description')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-default-500">{user?.email}</p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => {
            void logout();
          }}
        >
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
