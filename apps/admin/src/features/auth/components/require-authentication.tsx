'use client';

import { useEffect, type ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';

import { useAuth } from '../hooks/use-auth';
import { AuthLoadingScreen } from './auth-loading-screen';

type RequireAuthenticationProps = {
  children: ReactNode;
};

export function RequireAuthentication({ children }: RequireAuthenticationProps) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  if (status !== 'authenticated') {
    return <AuthLoadingScreen />;
  }

  return children;
}
