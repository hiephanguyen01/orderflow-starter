'use client';

import { Button, Card } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';

export function ForbiddenState() {
  const t = useTranslations('Forbidden');
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <Card.Header>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Description>{t('description')}</Card.Description>
        </Card.Header>

        <Card.Content>
          <p className="text-sm text-default-500">{t('help')}</p>
        </Card.Content>

        <Card.Footer>
          <Button
            variant="primary"
            onPress={() => {
              router.replace('/admin');
            }}
          >
            {t('backToDashboard')}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
