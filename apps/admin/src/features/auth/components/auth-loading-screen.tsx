'use client';

import { useTranslations } from 'next-intl';

export function AuthLoadingScreen() {
  const t = useTranslations('Common');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-default-200 border-t-primary" />

        <p className="text-sm text-default-500">{t('loading')}</p>
      </div>
    </div>
  );
}
