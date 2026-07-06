import { registerAs } from '@nestjs/config';

export type RefreshCookieSameSite = 'lax' | 'strict' | 'none';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function parsePositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`${name} must be true or false`);
}

function parseSameSite(): RefreshCookieSameSite {
  const value = process.env['AUTH_REFRESH_COOKIE_SAME_SITE']?.trim() ?? 'lax';

  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }

  throw new Error('AUTH_REFRESH_COOKIE_SAME_SITE must be lax, strict or none');
}

export default registerAs('auth', () => {
  const refreshCookieSecure = parseBoolean('AUTH_REFRESH_COOKIE_SECURE', false);

  const refreshCookieSameSite = parseSameSite();

  if (refreshCookieSameSite === 'none' && !refreshCookieSecure) {
    throw new Error('SameSite=None requires a secure cookie');
  }

  return {
    accessTokenSecret: requireEnvironmentVariable('AUTH_ACCESS_TOKEN_SECRET'),

    refreshTokenSecret: requireEnvironmentVariable('AUTH_REFRESH_TOKEN_SECRET'),

    accessTokenTtlSeconds: parsePositiveInteger('AUTH_ACCESS_TOKEN_TTL_SECONDS', 900),

    refreshTokenTtlDays: parsePositiveInteger('AUTH_REFRESH_TOKEN_TTL_DAYS', 30),

    issuer: process.env['AUTH_JWT_ISSUER']?.trim() || 'orderflow-api',

    audience: process.env['AUTH_JWT_AUDIENCE']?.trim() || 'orderflow-web',

    refreshCookieName: process.env['AUTH_REFRESH_COOKIE_NAME']?.trim() || 'orderflow_refresh',

    refreshCookieSecure,
    refreshCookieSameSite,
  };
});
