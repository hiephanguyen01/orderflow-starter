'use client';

import { Button, Card } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function AdminPage() {
  const t = useTranslations('AdminDashboard');
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-background p-6">
      <Card className="mx-auto max-w-3xl">
        <Card.Header>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Description>{t('welcome', { name: user?.displayName ?? user?.email ?? '' })}</Card.Description>
        </Card.Header>

        <Card.Content>
          <div className="flex flex-col gap-3">
            <p>
              <strong>{t('email')}:</strong> {user?.email}
            </p>

            <p>
              <strong>{t('status')}:</strong> {user?.status}
            </p>
          </div>
        </Card.Content>

        <Card.Footer>
          <Button
            variant="danger"
            onPress={() => {
              void logout();
            }}
          >
            {t('logout')}
          </Button>
        </Card.Footer>
      </Card>
    </main>
  );
}
