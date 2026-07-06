import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { RedisService } from '../../../infrastructure/redis/redis.service.js';
import { SYSTEM_PERMISSIONS } from '../domain/permission.constants.js';

export type EffectiveAuthorization = {
  permissionCodes: string[];
  isSuperAdmin: boolean;
};

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.cacheTtlSeconds = configService.get<number>('AUTHORIZATION_CACHE_TTL_SECONDS') ?? 300;
  }

  async getEffectiveAuthorization(userId: string): Promise<EffectiveAuthorization> {
    const cacheKey = this.getUserCacheKey(userId);

    const cached = await this.readCache(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        status: true,
        userRoles: {
          where: {
            role: {
              isActive: true,
            },
          },
          select: {
            role: {
              select: {
                permissions: {
                  where: {
                    permission: {
                      isActive: true,
                    },
                  },
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        directPermissions: {
          where: {
            permission: {
              isActive: true,
            },
          },
          select: {
            effect: true,
            permission: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return {
        permissionCodes: [],
        isSuperAdmin: false,
      };
    }

    const allowed = new Set<string>();
    const denied = new Set<string>();

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        allowed.add(rolePermission.permission.code);
      }
    }

    for (const directPermission of user.directPermissions) {
      const code = directPermission.permission.code;

      if (directPermission.effect === 'DENY') {
        denied.add(code);
      } else {
        allowed.add(code);
      }
    }

    for (const code of denied) {
      allowed.delete(code);
    }

    const permissionCodes = [...allowed].sort();

    const result: EffectiveAuthorization = {
      permissionCodes,
      isSuperAdmin: allowed.has(SYSTEM_PERMISSIONS.SUPER_ADMIN),
    };

    await this.writeCache(cacheKey, result);

    return result;
  }

  async getEffectivePermissionCodes(userId: string): Promise<string[]> {
    const authorization = await this.getEffectiveAuthorization(userId);

    return authorization.permissionCodes;
  }

  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const authorization = await this.getEffectiveAuthorization(userId);

    if (authorization.isSuperAdmin) {
      return true;
    }

    const permissionSet = new Set(authorization.permissionCodes);

    return requiredPermissions.every((permission) => permissionSet.has(permission));
  }

  async hasAnyPermission(userId: string, requiredPermissions: string[]): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const authorization = await this.getEffectiveAuthorization(userId);

    if (authorization.isSuperAdmin) {
      return true;
    }

    const permissionSet = new Set(authorization.permissionCodes);

    return requiredPermissions.some((permission) => permissionSet.has(permission));
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.invalidateUsers([userId]);
  }

  async invalidateUsers(userIds: string[]): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return;
    }

    const keys = uniqueUserIds.map((userId) => this.getUserCacheKey(userId));

    try {
      await this.redis.client.del(...keys);
    } catch {
      this.logger.warn('Unable to invalidate authorization cache for users');
    }
  }

  async invalidateUsersByRole(roleId: string): Promise<void> {
    const assignments = await this.prisma.userRole.findMany({
      where: {
        roleId,
      },
      select: {
        userId: true,
      },
    });

    await this.invalidateUsers(assignments.map(({ userId }) => userId));
  }

  private getUserCacheKey(userId: string): string {
    return `authorization:user:${userId}:permissions`;
  }

  private async readCache(key: string): Promise<EffectiveAuthorization | null> {
    try {
      const value = await this.redis.client.get(key);

      if (!value) {
        return null;
      }

      const parsed: unknown = JSON.parse(value);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        Array.isArray((parsed as EffectiveAuthorization).permissionCodes) &&
        typeof (parsed as EffectiveAuthorization).isSuperAdmin === 'boolean'
      ) {
        return parsed as EffectiveAuthorization;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, value: EffectiveAuthorization): Promise<void> {
    try {
      await this.redis.client.set(key, JSON.stringify(value), 'EX', this.cacheTtlSeconds);
    } catch {
      this.logger.warn('Unable to cache effective authorization');
    }
  }
}
