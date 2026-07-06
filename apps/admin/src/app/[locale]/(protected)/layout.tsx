import type { ReactNode } from 'react';

import { RequireAuthentication } from '@/features/auth/components/require-authentication';
import { AdminShell } from '@/features/navigation/components/admin-shell';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <RequireAuthentication>
      <AdminShell>{children}</AdminShell>
    </RequireAuthentication>
  );
}
