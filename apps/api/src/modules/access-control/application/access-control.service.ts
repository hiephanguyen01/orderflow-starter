import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type PermissionEffect } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { CreatePermissionDto } from '../presentation/http/dto/create-permission.dto.js';
import { CreateRoleDto } from '../presentation/http/dto/create-role.dto.js';
import { DirectPermissionItemDto } from '../presentation/http/dto/replace-user-permissions.dto.js';
import { AuthorizationPolicyService } from './authorization-policy.service.js';
import { AuthorizationService } from './authorization.service.js';

type PermissionResponse = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
};

type RoleResponse = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
};

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly policy: AuthorizationPolicyService,
  ) {}

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        module: true,
        description: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            roles: true,
            users: true,
          },
        },
      },
    });
  }

  async getUserAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        userRoles: {
          select: {
            assignedAt: true,
            assignedBy: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                isSystem: true,
                isActive: true,
              },
            },
          },
        },
        directPermissions: {
          select: {
            effect: true,
            assignedAt: true,
            assignedBy: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
            permission: {
              select: {
                id: true,
                code: true,
                name: true,
                module: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User was not found',
      });
    }

    const effectiveAuthorization =
      await this.authorizationService.getEffectiveAuthorization(userId);

    return {
      ...user,
      effectivePermissions: effectiveAuthorization.permissionCodes,
      isSuperAdmin: effectiveAuthorization.isSuperAdmin,
    };
  }

  async createPermission(actorId: string, dto: CreatePermissionDto): Promise<PermissionResponse> {
    const code = dto.code.trim();

    let created;

    try {
      created = await this.prisma.$transaction(async (transaction) => {
        const superAdminRole = await transaction.role.findUnique({
          where: {
            code: 'SUPER_ADMIN',
          },
          select: {
            id: true,
          },
        });

        if (!superAdminRole) {
          throw new Error('SUPER_ADMIN role is missing');
        }

        const permission = await transaction.permission.create({
          data: {
            code,
            name: dto.name.trim(),
            module: dto.module.trim(),
            description: this.normalizeOptionalText(dto.description),
          },
          select: {
            id: true,
            code: true,
            name: true,
            module: true,
            description: true,
            isSystem: true,
            isActive: true,
          },
        });

        await transaction.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
            assignedById: actorId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorId,
            action: 'PERMISSION_CREATED',
            resourceType: 'PERMISSION',
            resourceId: permission.id,
            afterData: {
              code: permission.code,
              name: permission.name,
              module: permission.module,
              description: permission.description,
            },
          },
        });

        return { permission, superAdminRoleId: superAdminRole.id };
      });
    } catch (error) {
      this.throwConflictForUniqueCode(error, 'PERMISSION_CODE_ALREADY_EXISTS');
      throw error;
    }

    await this.authorizationService.invalidateUsersByRole(created.superAdminRoleId);

    return created.permission;
  }

  async createRole(actorId: string, dto: CreateRoleDto): Promise<RoleResponse> {
    const code = dto.code.trim().toUpperCase();
    const permissionIds = [...new Set(dto.permissionIds)];

    await this.assertActivePermissionsExist(permissionIds);
    await this.policy.assertProtectedPermissionNotAssigned(permissionIds);
    await this.policy.assertCanGrantPermissionIds(actorId, permissionIds);

    try {
      const role = await this.prisma.$transaction(async (transaction) => {
        const createdRole = await transaction.role.create({
          data: {
            code,
            name: dto.name.trim(),
            description: this.normalizeOptionalText(dto.description),
          },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isSystem: true,
            isActive: true,
          },
        });

        if (permissionIds.length > 0) {
          await transaction.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: createdRole.id,
              permissionId,
              assignedById: actorId,
            })),
          });
        }

        await transaction.auditLog.create({
          data: {
            actorId,
            action: 'ROLE_CREATED',
            resourceType: 'ROLE',
            resourceId: createdRole.id,
            afterData: {
              code: createdRole.code,
              name: createdRole.name,
              permissionIds,
            },
          },
        });

        return createdRole;
      });

      return {
        ...role,
        permissionIds,
      };
    } catch (error) {
      this.throwConflictForUniqueCode(error, 'ROLE_CODE_ALREADY_EXISTS');
      throw error;
    }
  }

  async replaceRolePermissions(
    actorId: string,
    roleId: string,
    permissionIds: string[],
  ): Promise<{ roleId: string; permissionIds: string[] }> {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role was not found',
      });
    }

    if (role.code === 'SUPER_ADMIN') {
      throw new BadRequestException({
        code: 'SUPER_ADMIN_PERMISSIONS_CANNOT_BE_REPLACED',
        message: 'SUPER_ADMIN permissions are managed automatically',
      });
    }

    const uniquePermissionIds = [...new Set(permissionIds)];

    await this.assertActivePermissionsExist(uniquePermissionIds);
    await this.policy.assertProtectedPermissionNotAssigned(uniquePermissionIds);
    await this.policy.assertCanGrantPermissionIds(actorId, uniquePermissionIds);

    const affectedUsers = await this.prisma.userRole.findMany({
      where: {
        roleId,
      },
      select: {
        userId: true,
      },
    });

    await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.rolePermission.findMany({
        where: {
          roleId,
        },
        select: {
          permissionId: true,
        },
      });

      await transaction.rolePermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (uniquePermissionIds.length > 0) {
        await transaction.rolePermission.createMany({
          data: uniquePermissionIds.map((permissionId) => ({
            roleId,
            permissionId,
            assignedById: actorId,
          })),
        });
      }

      const userIds = affectedUsers.map(({ userId }) => userId);

      if (userIds.length > 0) {
        await transaction.user.updateMany({
          where: {
            id: {
              in: userIds,
            },
          },
          data: {
            authorizationVersion: {
              increment: 1,
            },
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'ROLE_PERMISSIONS_REPLACED',
          resourceType: 'ROLE',
          resourceId: roleId,
          beforeData: {
            permissionIds: before.map(({ permissionId }) => permissionId),
          },
          afterData: {
            permissionIds: uniquePermissionIds,
          },
        },
      });
    });

    await this.authorizationService.invalidateUsers(affectedUsers.map(({ userId }) => userId));

    return {
      roleId,
      permissionIds: uniquePermissionIds,
    };
  }

  async replaceUserRoles(
    actorId: string,
    targetUserId: string,
    roleIds: string[],
  ): Promise<{ userId: string; roleIds: string[] }> {
    await this.assertUserExists(targetUserId);
    await this.policy.assertCanModifyTargetUser(actorId, targetUserId);

    const uniqueRoleIds = [...new Set(roleIds)];

    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: uniqueRoleIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (roles.length !== uniqueRoleIds.length) {
      throw new BadRequestException({
        code: 'INVALID_ROLES',
        message: 'One or more roles are invalid',
      });
    }

    await this.policy.assertCanAssignRoles(actorId, uniqueRoleIds);
    await this.policy.assertNotRemovingLastSuperAdmin(targetUserId, uniqueRoleIds);

    await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.userRole.findMany({
        where: {
          userId: targetUserId,
        },
        select: {
          roleId: true,
        },
      });

      await transaction.userRole.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      if (uniqueRoleIds.length > 0) {
        await transaction.userRole.createMany({
          data: uniqueRoleIds.map((roleId) => ({
            userId: targetUserId,
            roleId,
            assignedById: actorId,
          })),
        });
      }

      await transaction.user.update({
        where: {
          id: targetUserId,
        },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'USER_ROLES_REPLACED',
          resourceType: 'USER',
          resourceId: targetUserId,
          beforeData: {
            roleIds: before.map(({ roleId }) => roleId),
          },
          afterData: {
            roleIds: uniqueRoleIds,
          },
        },
      });
    });

    await this.authorizationService.invalidateUser(targetUserId);

    return {
      userId: targetUserId,
      roleIds: uniqueRoleIds,
    };
  }

  async replaceUserPermissions(
    actorId: string,
    targetUserId: string,
    permissions: DirectPermissionItemDto[],
  ): Promise<{ userId: string; permissions: DirectPermissionItemDto[] }> {
    await this.assertUserExists(targetUserId);
    await this.policy.assertCanModifyTargetUser(actorId, targetUserId);

    const permissionIds = permissions.map(({ permissionId }) => permissionId);

    if (new Set(permissionIds).size !== permissionIds.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_USER_PERMISSIONS',
        message: 'A permission can only be configured once per user',
      });
    }

    await this.assertActivePermissionsExist(permissionIds);
    await this.policy.assertProtectedPermissionNotAssigned(permissionIds);
    await this.policy.assertCanGrantPermissionIds(actorId, permissionIds);

    await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.userPermission.findMany({
        where: {
          userId: targetUserId,
        },
        select: {
          permissionId: true,
          effect: true,
        },
      });

      await transaction.userPermission.deleteMany({
        where: {
          userId: targetUserId,
        },
      });

      if (permissions.length > 0) {
        await transaction.userPermission.createMany({
          data: permissions.map(({ permissionId, effect }) => ({
            userId: targetUserId,
            permissionId,
            effect: effect as PermissionEffect,
            assignedById: actorId,
          })),
        });
      }

      await transaction.user.update({
        where: {
          id: targetUserId,
        },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'USER_PERMISSIONS_REPLACED',
          resourceType: 'USER',
          resourceId: targetUserId,
          beforeData: {
            permissions: before.map(({ permissionId, effect }) => ({
              permissionId,
              effect,
            })),
          },
          afterData: {
            permissions: permissions.map(({ permissionId, effect }) => ({
              permissionId,
              effect,
            })),
          },
        },
      });
    });

    await this.authorizationService.invalidateUser(targetUserId);

    return {
      userId: targetUserId,
      permissions,
    };
  }

  private async assertActivePermissionsExist(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException({
        code: 'INVALID_PERMISSIONS',
        message: 'One or more permissions are invalid',
      });
    }
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User was not found',
      });
    }
  }

  private normalizeOptionalText(value: string | undefined): string | null {
    return value?.trim() || null;
  }

  private throwConflictForUniqueCode(error: unknown, code: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException({
        code,
        message: 'Code already exists',
      });
    }
  }
}
