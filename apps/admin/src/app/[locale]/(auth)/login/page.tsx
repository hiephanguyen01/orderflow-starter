'use client';

import { useEffect } from 'react';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import { LoginForm } from '@/features/auth/components/login-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin');
    }
  }, [router, status]);

  if (status === 'initializing' || status === 'authenticated') {
    return <AuthLoadingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </main>
  );
}
