import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type PermissionEffect } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { DirectPermissionItemDto } from '../dto/replace-user-permissions.dto.js';
import { AccessControlPolicyService } from './access-control-policy.service.js';
import { AuthorizationService } from './authorization.service.js';

const SUPER_ADMIN_PERMISSION = 'system.super-admin';

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
    private readonly policyService: AccessControlPolicyService,
  ) {}

  async createPermission(actorId: string, dto: CreatePermissionDto): Promise<PermissionResponse> {
    const code = dto.code.trim();

    try {
      return await this.prisma.$transaction(async (transaction) => {
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

        await transaction.auditLog.create({
          data: {
            actorId,
            action: 'PERMISSION_CREATED',
            resourceType: 'PERMISSION',
            resourceId: permission.id,
            after: {
              code: permission.code,
              name: permission.name,
              module: permission.module,
              description: permission.description,
            },
          },
        });

        return permission;
      });
    } catch (error) {
      this.throwConflictForUniqueCode(error, 'PERMISSION_CODE_ALREADY_EXISTS');
      throw error;
    }
  }

  async createRole(actorId: string, dto: CreateRoleDto): Promise<RoleResponse> {
    const code = dto.code.trim().toUpperCase();
    const permissionIds = dto.permissionIds;

    await this.assertActivePermissionsExist(permissionIds);
    await this.policyService.assertCanGrantPermissionIds(actorId, permissionIds);

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
            after: {
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

  async replaceUserRoles(
    actorId: string,
    targetUserId: string,
    roleIds: string[],
  ): Promise<{ userId: string; roleIds: string[] }> {
    await this.assertUserExists(targetUserId);
    await this.assertCanChangeTargetAccess(actorId, targetUserId);

    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException({
        code: 'INVALID_ROLES',
        message: 'One or more roles are invalid',
      });
    }

    await this.policyService.assertCanAssignRoles(actorId, roleIds);
    await this.assertDoesNotRemoveFinalSuperAdmin(targetUserId, roleIds);

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

      if (roleIds.length > 0) {
        await transaction.userRole.createMany({
          data: roleIds.map((roleId) => ({
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
          before: {
            roleIds: before.map(({ roleId }) => roleId),
          },
          after: {
            roleIds,
          },
        },
      });
    });

    await this.authorizationService.invalidateUser(targetUserId);

    return {
      userId: targetUserId,
      roleIds,
    };
  }

  async replaceUserPermissions(
    actorId: string,
    targetUserId: string,
    permissions: DirectPermissionItemDto[],
  ): Promise<{ userId: string; permissions: DirectPermissionItemDto[] }> {
    await this.assertUserExists(targetUserId);
    await this.assertCanChangeTargetAccess(actorId, targetUserId);

    const permissionIds = permissions.map(({ permissionId }) => permissionId);
    const dbPermissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (dbPermissions.length !== permissionIds.length) {
      throw new BadRequestException({
        code: 'INVALID_PERMISSIONS',
        message: 'One or more permissions are invalid',
      });
    }

    const directSuperAdmin = dbPermissions.some(({ code }) => code === SUPER_ADMIN_PERMISSION);

    if (directSuperAdmin) {
      throw new ForbiddenException({
        code: 'DIRECT_SUPER_ADMIN_FORBIDDEN',
        message: 'Super administrator permission must be granted through a protected system role',
      });
    }

    await this.policyService.assertCanGrantPermissionIds(actorId, permissionIds);

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
          before: {
            permissions: before.map(({ permissionId, effect }) => ({
              permissionId,
              effect,
            })),
          },
          after: {
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

  private async assertCanChangeTargetAccess(actorId: string, targetUserId: string): Promise<void> {
    if (actorId !== targetUserId || (await this.policyService.isSuperAdmin(actorId))) {
      return;
    }

    throw new ForbiddenException({
      code: 'SELF_ACCESS_CHANGE_FORBIDDEN',
      message: 'You cannot change your own access',
    });
  }

  private async assertDoesNotRemoveFinalSuperAdmin(
    targetUserId: string,
    nextRoleIds: string[],
  ): Promise<void> {
    const superAdminRole = await this.prisma.role.findUnique({
      where: {
        code: 'SUPER_ADMIN',
      },
      select: {
        id: true,
      },
    });

    if (!superAdminRole || nextRoleIds.includes(superAdminRole.id)) {
      return;
    }

    const targetHasSuperAdminRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: targetUserId,
          roleId: superAdminRole.id,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!targetHasSuperAdminRole) {
      return;
    }

    const activeSuperAdminCount = await this.prisma.userRole.count({
      where: {
        roleId: superAdminRole.id,
        user: {
          status: 'ACTIVE',
        },
      },
    });

    if (activeSuperAdminCount <= 1) {
      throw new ForbiddenException({
        code: 'LAST_SUPER_ADMIN_PROTECTED',
        message: 'The final super administrator cannot be removed',
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
