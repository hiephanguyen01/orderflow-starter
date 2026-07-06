import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

import { LoginDto } from '../presentation/http/dto/login.dto.js';
import { RegisterDto } from '../presentation/http/dto/register.dto.js';
import {
  AuthenticationResult,
  AuthenticatedUser,
  AuthPrincipal,
  ClientContext,
  RefreshResult,
} from '../domain/auth.types.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly passwordService: PasswordService,

    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto, context: ClientContext): Promise<AuthenticationResult> {
    const email = this.normalizeEmail(dto.email);

    const userId = randomUUID();
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();

    const refreshTokenExpiresAt = this.tokenService.createRefreshTokenExpiresAt();

    const refreshTokenExpiresInSeconds =
      this.tokenService.calculateRemainingSeconds(refreshTokenExpiresAt);

    const refreshToken = await this.tokenService.issueRefreshToken({
      userId,
      sessionId,
      refreshTokenId,
      expiresInSeconds: refreshTokenExpiresInSeconds,
    });

    const [passwordHash, refreshTokenHash] = await Promise.all([
      this.passwordService.hash(dto.password),

      this.passwordService.hash(refreshToken),
    ]);

    let user: AuthenticatedUser;

    try {
      user = await this.prisma.$transaction(async (transaction) => {
        const customerRole = await transaction.role.findUnique({
          where: {
            code: 'CUSTOMER',
          },

          select: {
            id: true,
            isActive: true,
          },
        });

        if (!customerRole || !customerRole.isActive) {
          throw new InternalServerErrorException({
            code: 'CUSTOMER_ROLE_NOT_AVAILABLE',

            message: 'Default customer role is not available',
          });
        }

        const createdUser = await transaction.user.create({
          data: {
            id: userId,
            email,
            passwordHash,

            displayName: dto.displayName?.trim() || null,

            status: 'ACTIVE',
          },

          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
          },
        });

        await transaction.userRole.create({
          data: {
            userId: createdUser.id,

            roleId: customerRole.id,

            assignedById: null,
          },
        });

        await transaction.authSession.create({
          data: {
            id: sessionId,

            userId: createdUser.id,

            currentRefreshTokenId: refreshTokenId,

            refreshTokenHash,

            expiresAt: refreshTokenExpiresAt,

            ipAddress: context.ipAddress,

            userAgent: context.userAgent,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorId: createdUser.id,

            action: 'USER_REGISTERED',

            resourceType: 'USER',

            resourceId: createdUser.id,

            afterData: {
              email: createdUser.email,

              displayName: createdUser.displayName,
            },

            ipAddress: context.ipAddress,

            userAgent: context.userAgent,
          },
        });

        return createdUser;
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',

          message: 'Email already exists',
        });
      }

      throw error;
    }

    const accessToken = await this.tokenService.issueAccessToken({
      userId: user.id,
      sessionId,
    });

    return {
      accessToken,

      accessTokenExpiresInSeconds: this.tokenService.accessTokenTtlSeconds,

      refreshToken,
      refreshTokenExpiresAt,

      user,
    };
  }

  async login(dto: LoginDto, context: ClientContext): Promise<AuthenticationResult> {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        email: true,
        passwordHash: true,
        displayName: true,
        status: true,
      },
    });

    const passwordMatches = await this.passwordService.verifyWithFallback(
      existingUser?.passwordHash ?? null,

      dto.password,
    );

    if (!existingUser || !passwordMatches) {
      throw this.invalidCredentials();
    }

    if (existingUser.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',

        message: 'Account is not active',
      });
    }

    const user: AuthenticatedUser = {
      id: existingUser.id,
      email: existingUser.email,
      displayName: existingUser.displayName,
      status: existingUser.status,
    };

    return this.createSession(user, context, 'USER_LOGGED_IN');
  }
  private async createSession(
    user: AuthenticatedUser,
    context: ClientContext,
    auditAction: string,
  ): Promise<AuthenticationResult> {
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();

    const refreshTokenExpiresAt = this.tokenService.createRefreshTokenExpiresAt();

    const expiresInSeconds = this.tokenService.calculateRemainingSeconds(refreshTokenExpiresAt);

    const refreshToken = await this.tokenService.issueRefreshToken({
      userId: user.id,
      sessionId,
      refreshTokenId,
      expiresInSeconds,
    });

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,

          currentRefreshTokenId: refreshTokenId,

          refreshTokenHash,

          expiresAt: refreshTokenExpiresAt,

          ipAddress: context.ipAddress,

          userAgent: context.userAgent,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: auditAction,

          resourceType: 'AUTH_SESSION',

          resourceId: sessionId,

          metadata: {
            expiresAt: refreshTokenExpiresAt.toISOString(),
          },

          ipAddress: context.ipAddress,

          userAgent: context.userAgent,
        },
      });
    });

    const accessToken = await this.tokenService.issueAccessToken({
      userId: user.id,
      sessionId,
    });

    return {
      accessToken,

      accessTokenExpiresInSeconds: this.tokenService.accessTokenTtlSeconds,

      refreshToken,
      refreshTokenExpiresAt,

      user,
    };
  }
  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    const payload = await this.tokenService.verifyRefreshToken(rawRefreshToken);

    const now = new Date();

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: payload.sid,
      },

      select: {
        id: true,
        userId: true,

        currentRefreshTokenId: true,

        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,

        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw this.invalidRefreshToken();
    }

    if (session.revokedAt || session.expiresAt <= now || session.user.status !== 'ACTIVE') {
      throw this.invalidRefreshToken();
    }

    if (session.currentRefreshTokenId !== payload.jti) {
      await this.revokeSessionForReuse(session.id);

      throw this.refreshTokenReused();
    }

    const tokenMatches = await this.passwordService.verify(
      session.refreshTokenHash,
      rawRefreshToken,
    );

    if (!tokenMatches) {
      await this.revokeSessionForReuse(session.id);

      throw this.refreshTokenReused();
    }

    const nextRefreshTokenId = randomUUID();

    const remainingSeconds = this.tokenService.calculateRemainingSeconds(session.expiresAt);

    const nextRefreshToken = await this.tokenService.issueRefreshToken({
      userId: session.userId,
      sessionId: session.id,

      refreshTokenId: nextRefreshTokenId,

      expiresInSeconds: remainingSeconds,
    });

    const nextRefreshTokenHash = await this.passwordService.hash(nextRefreshToken);

    const rotationResult = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,

        userId: session.userId,

        currentRefreshTokenId: payload.jti,

        refreshTokenHash: session.refreshTokenHash,

        revokedAt: null,

        expiresAt: {
          gt: now,
        },
      },

      data: {
        currentRefreshTokenId: nextRefreshTokenId,

        refreshTokenHash: nextRefreshTokenHash,

        lastUsedAt: now,
      },
    });

    if (rotationResult.count !== 1) {
      await this.revokeSessionForReuse(session.id);

      throw this.refreshTokenReused();
    }

    const accessToken = await this.tokenService.issueAccessToken({
      userId: session.userId,
      sessionId: session.id,
    });

    return {
      accessToken,

      accessTokenExpiresInSeconds: this.tokenService.accessTokenTtlSeconds,

      refreshToken: nextRefreshToken,

      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  private async revokeSessionForReuse(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),

        revokeReason: 'REFRESH_TOKEN_REUSE_DETECTED',
      },
    });
  }
  async logout(principal: AuthPrincipal, context: ClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.authSession.updateMany({
        where: {
          id: principal.sessionId,

          userId: principal.userId,

          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),

          revokeReason: 'USER_LOGOUT',
        },
      });

      if (result.count === 0) {
        return;
      }

      await transaction.auditLog.create({
        data: {
          actorId: principal.userId,

          action: 'USER_LOGGED_OUT',

          resourceType: 'AUTH_SESSION',

          resourceId: principal.sessionId,

          ipAddress: context.ipAddress,

          userAgent: context.userAgent,
        },
      });
    });
  }
  async logoutAll(principal: AuthPrincipal, context: ClientContext): Promise<number> {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.authSession.updateMany({
        where: {
          userId: principal.userId,

          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),

          revokeReason: 'USER_LOGOUT_ALL',
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: principal.userId,

          action: 'USER_LOGGED_OUT_ALL',

          resourceType: 'USER',

          resourceId: principal.userId,

          metadata: {
            revokedSessionCount: result.count,
          },

          ipAddress: context.ipAddress,

          userAgent: context.userAgent,
        },
      });

      return result.count;
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        createdAt: true,

        userRoles: {
          where: {
            role: {
              isActive: true,
            },
          },

          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User no longer exists',
      });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,

      roles: user.userRoles.map(({ role }) => role),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',

      message: 'Invalid email or password',
    });
  }

  private invalidRefreshToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_REFRESH_TOKEN',

      message: 'Refresh token is invalid or expired',
    });
  }

  private refreshTokenReused(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'REFRESH_TOKEN_REUSED',

      message: 'Refresh token reuse was detected',
    });
  }
}
