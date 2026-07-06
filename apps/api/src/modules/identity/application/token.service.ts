import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import authConfig from '../config/auth.config.js';
import type { AccessTokenPayload, RefreshTokenPayload } from '../domain/auth.types.js';

type IssueAccessTokenInput = {
  userId: string;
  sessionId: string;
};

type IssueRefreshTokenInput = {
  userId: string;
  sessionId: string;
  refreshTokenId: string;
  expiresInSeconds: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.accessTokenTtlSeconds;
  }

  createRefreshTokenExpiresAt(): Date {
    const milliseconds = this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + milliseconds);
  }

  calculateRemainingSeconds(expiresAt: Date): number {
    return Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  }

  issueAccessToken(input: IssueAccessTokenInput): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: input.userId,
      sid: input.sessionId,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.config.accessTokenSecret,

      expiresIn: this.config.accessTokenTtlSeconds,

      issuer: this.config.issuer,
      audience: this.config.audience,

      algorithm: 'HS256',
    });
  }

  issueRefreshToken(input: IssueRefreshTokenInput): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: input.userId,
      sid: input.sessionId,
      jti: input.refreshTokenId,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.config.refreshTokenSecret,

      expiresIn: input.expiresInSeconds,

      issuer: this.config.issuer,
      audience: this.config.audience,

      algorithm: 'HS256',
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.refreshTokenSecret,

        issuer: this.config.issuer,

        audience: this.config.audience,

        algorithms: ['HS256'],
      });

      if (payload.type !== 'refresh' || !payload.sub || !payload.sid || !payload.jti) {
        throw new Error('Invalid refresh token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }
  }
}
