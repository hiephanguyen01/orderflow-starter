'use client';

import { ReactNode } from 'react';

import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-default-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-default-200 bg-background lg:block">
        <AdminSidebar />
      </aside>

      <div className="min-h-screen lg:pl-72">
        <AdminHeader />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
