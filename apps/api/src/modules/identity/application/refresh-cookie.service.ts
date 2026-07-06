import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';

import authConfig from '../config/auth.config.js';

@Injectable()
export class RefreshCookieService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  read(request: Request): string | null {
    const cookies = request.cookies as Record<string, unknown> | undefined;

    const value = cookies?.[this.config.refreshCookieName];

    return typeof value === 'string' ? value : null;
  }

  write(response: Response, refreshToken: string, expiresAt: Date): void {
    response.cookie(this.config.refreshCookieName, refreshToken, {
      httpOnly: true,

      secure: this.config.refreshCookieSecure,

      sameSite: this.config.refreshCookieSameSite,

      path: '/api/v1/auth',

      expires: expiresAt,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.config.refreshCookieName, {
      httpOnly: true,

      secure: this.config.refreshCookieSecure,

      sameSite: this.config.refreshCookieSameSite,

      path: '/api/v1/auth',
    });
  }
}
