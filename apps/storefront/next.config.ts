import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  transpilePackages: ['@orderflow/ui', '@orderflow/api-client', '@orderflow/shared-types'],
});
