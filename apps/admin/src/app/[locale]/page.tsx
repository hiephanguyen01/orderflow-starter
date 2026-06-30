import { Button, Card } from '@heroui/react';
import { OrderFlowBrand } from '@orderflow/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <OrderFlowBrand subtitle={t('application')} />
        <div className="flex gap-2 text-sm">
          <Link href="/vi">VI</Link>
          <Link href="/en">EN</Link>
        </div>
      </div>

      <Card className="p-8">
        <Card.Header>
          <Card.Title className="text-3xl">{t('title')}</Card.Title>
          <Card.Description>{t('description')}</Card.Description>
        </Card.Header>
        <Card.Content className="mt-6 space-y-4">
          <p className="text-foreground-600">{t('sprint')}</p>
          <Button>{t('action')}</Button>
        </Card.Content>
      </Card>
    </main>
  );
}
