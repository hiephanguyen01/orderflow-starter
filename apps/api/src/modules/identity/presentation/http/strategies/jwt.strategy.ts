import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { ConfigType } from '@nestjs/config';
import { PrismaService } from '../../../../../database/prisma/prisma.service.js';
import authConfig from '../../../config/auth.config.js';
import type { AccessTokenPayload, AuthPrincipal } from '../../../domain/auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: config.accessTokenSecret,

      issuer: config.issuer,
      audience: config.audience,

      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthPrincipal> {
    if (payload.type !== 'access' || !payload.sub || !payload.sid) {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',

        message: 'Access token is invalid',
      });
    }

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: payload.sid,
      },

      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true,

        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',

        message: 'Session is invalid',
      });
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
    };
  }
}
