'use client';

import { buttonVariants, Drawer, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { AdminSidebar } from './admin-sidebar';

export function MobileAdminNavigation() {
  const t = useTranslations('Navigation');

  const drawerState = useOverlayState({
    defaultOpen: false,
  });

  return (
    <Drawer state={drawerState}>
      {/* Drawer.Trigger renders its own <button>, so its child must be plain
          content, not another Button — nesting one caused invalid <button>
          inside <button> DOM and a hydration mismatch. */}
      <Drawer.Trigger
        aria-label={t('openMenu')}
        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} lg:hidden`}
      >
        ☰
      </Drawer.Trigger>

      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement="left" className="w-[min(20rem,90vw)]">
          <Drawer.Dialog aria-label={t('ariaLabel')}>
            <Drawer.CloseTrigger />

            <Drawer.Header>
              <Drawer.Heading>{t('menu')}</Drawer.Heading>
            </Drawer.Header>

            <Drawer.Body className="p-0">
              <AdminSidebar onNavigate={drawerState.close} />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
