'use client';

import { ListBox } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePathname, useRouter } from '@/i18n/navigation';

import { adminNavigation } from '../admin-navigation';
import { filterNavigation } from '../filter-navigation';

type AdminSidebarProps = {
  onNavigate?: () => void;
};

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const t = useTranslations('Navigation');
  const router = useRouter();
  const pathname = usePathname();
  const { authorization } = useAuth();

  const visibleGroups = useMemo(
    () => filterNavigation(adminNavigation, authorization),
    [authorization],
  );

  const activeHref = useMemo(() => {
    const allItems = visibleGroups.flatMap((group) => group.items);

    const exactItem = allItems.find((item) => pathname === item.href);

    if (exactItem) {
      return exactItem.href;
    }

    const nestedItems = allItems
      .filter((item) => item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length);

    return nestedItems[0]?.href ?? null;
  }, [pathname, visibleGroups]);

  const handleNavigate = (href: string): void => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-default-200 px-5 py-5">
        <p className="text-xl font-semibold">OrderFlow</p>
        <p className="text-sm text-default-500">{t('adminPortal')}</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label={t('ariaLabel')}>
        {visibleGroups.map((group) => (
          <section key={group.key} className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-default-400">
              {t(group.labelKey)}
            </p>

            <ListBox
              aria-label={t(group.labelKey)}
              selectionMode="none"
              onAction={(key) => {
                handleNavigate(String(key));
              }}
              className="w-full"
            >
              {group.items.map((item) => (
                <ListBox.Item
                  key={item.key}
                  id={item.href}
                  textValue={t(item.labelKey)}
                  className={`rounded-xl px-3 py-2.5 text-sm ${
                    item.href === activeHref ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {t(item.labelKey)}
                </ListBox.Item>
              ))}
            </ListBox>
          </section>
        ))}
      </nav>
    </div>
  );
}
