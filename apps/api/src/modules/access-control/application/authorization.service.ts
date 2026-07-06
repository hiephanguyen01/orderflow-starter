import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  private readonly cacheTtlSeconds = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getEffectivePermissionCodes(userId: string): Promise<string[]> {
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

    if (!user) {
      return [];
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

    const effectivePermissions = [...allowed].sort();

    await this.writeCache(cacheKey, effectivePermissions);

    return effectivePermissions;
  }

  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const effective = await this.getEffectivePermissionCodes(userId);

    const permissionSet = new Set(effective);

    return requiredPermissions.every((permission) => permissionSet.has(permission));
  }

  async invalidateUser(userId: string): Promise<void> {
    try {
      await this.redis.client.del(this.getUserCacheKey(userId));
    } catch {
      this.logger.warn(`Unable to invalidate authorization cache for user ${userId}`);
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

    if (assignments.length === 0) {
      return;
    }

    const keys = assignments.map(({ userId }) => this.getUserCacheKey(userId));

    try {
      await this.redis.client.del(...keys);
    } catch {
      this.logger.warn(`Unable to invalidate caches for role ${roleId}`);
    }
  }

  private getUserCacheKey(userId: string): string {
    return `authorization:user:${userId}:permissions`;
  }

  private async readCache(key: string): Promise<string[] | null> {
    try {
      const value = await this.redis.client.get(key);

      if (!value) {
        return null;
      }

      const parsed: unknown = JSON.parse(value);

      return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, permissions: string[]): Promise<void> {
    try {
      await this.redis.client.set(key, JSON.stringify(permissions), 'EX', this.cacheTtlSeconds);
    } catch {
      this.logger.warn('Unable to cache effective permissions');
    }
  }
}
