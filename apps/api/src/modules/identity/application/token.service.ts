import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth-principal.js';

type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;
type JwtExpiresInString = Extract<JwtExpiresIn, string>;

const JWT_EXPIRES_IN_PATTERN =
  /^-?\d+(?:\.\d+)?(?:\s?(?:years?|yrs?|y|weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s|milliseconds?|msecs?|ms))?$/i;

export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  issueAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      sid: sessionId,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getAccessSecret(),
      expiresIn: this.getAccessTokenTtl(),
    });
  }

  issueRefreshToken(userId: string, sessionId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      jti: randomUUID(),
      type: 'refresh',
    };

    const refreshDays = this.configService.get<number>('AUTH_REFRESH_TOKEN_TTL_DAYS') ?? 30;

    return this.jwtService.signAsync(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshTokenTtl(refreshDays),
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.getRefreshSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private getAccessSecret(): string {
    const value = this.configService.get<string>('AUTH_ACCESS_TOKEN_SECRET');

    if (!value) {
      throw new Error('AUTH_ACCESS_TOKEN_SECRET is required');
    }

    return value;
  }

  private getRefreshSecret(): string {
    const value = this.configService.get<string>('AUTH_REFRESH_TOKEN_SECRET');

    if (!value) {
      throw new Error('AUTH_REFRESH_TOKEN_SECRET is required');
    }

    return value;
  }

  private getAccessTokenTtl(): JwtExpiresIn {
    const value = this.configService.get<string>('AUTH_ACCESS_TOKEN_TTL') ?? '15m';

    if (!this.isJwtExpiresIn(value)) {
      throw new Error('AUTH_ACCESS_TOKEN_TTL must be a valid JWT expiresIn value');
    }

    return value;
  }

  private getRefreshTokenTtl(refreshDays: number): JwtExpiresIn {
    return `${refreshDays}d` as const;
  }

  private isJwtExpiresIn(value: string): value is JwtExpiresInString {
    return JWT_EXPIRES_IN_PATTERN.test(value);
  }
}
