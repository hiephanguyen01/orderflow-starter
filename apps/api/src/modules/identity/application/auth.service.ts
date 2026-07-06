import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../../database/prisma.service.js';

import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

type ClientContext = {
  ipAddress?: string;
  userAgent?: string;
};

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: ClientContext): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
      });
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          email,
          passwordHash,
          displayName: dto.displayName?.trim() || null,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });

      const customerRole = await transaction.role.findUnique({
        where: {
          code: 'CUSTOMER',
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (customerRole?.isActive) {
        await transaction.userRole.create({
          data: {
            userId: createdUser.id,
            roleId: customerRole.id,
          },
        });
      }

      return createdUser;
    });

    return this.createSession(user, context);
  }

  async login(dto: LoginDto, context: ClientContext): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!user) {
      throw this.invalidCredentials();
    }

    const passwordMatches = await this.passwordService.verify(user.passwordHash, dto.password);

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    }

    return this.createSession(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      context,
    );
  }

  async refresh(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = await this.tokenService.verifyRefreshToken(rawRefreshToken);

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        user: {
          select: {
            id: true,
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

    const tokenMatches = await this.passwordService.verify(
      session.refreshTokenHash,
      rawRefreshToken,
    );

    if (!tokenMatches) {
      await this.prisma.authSession.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse was detected',
      });
    }

    const nextRefreshToken = await this.tokenService.issueRefreshToken(session.userId, session.id);

    const nextRefreshTokenHash = await this.passwordService.hash(nextRefreshToken);

    await this.prisma.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: nextRefreshTokenHash,
        lastUsedAt: new Date(),
      },
    });

    const accessToken = await this.tokenService.issueAccessToken(session.userId, session.id);

    return {
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async createSession(
    user: {
      id: string;
      email: string;
      displayName: string | null;
    },
    context: ClientContext,
  ): Promise<AuthResult> {
    const sessionId = randomUUID();

    const refreshToken = await this.tokenService.issueRefreshToken(user.id, sessionId);

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    const refreshDays = this.configService.get<number>('AUTH_REFRESH_TOKEN_TTL_DAYS') ?? 30;

    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        expiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    const accessToken = await this.tokenService.issueAccessToken(user.id, sessionId);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  }
}
