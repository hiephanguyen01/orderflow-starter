import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type PermissionEffect } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { PaginatedResult } from '../../../shared/types/paginated-result.js';
import { SYSTEM_PERMISSIONS } from '../domain/permission.constants.js';
import { CreatePermissionDto } from '../presentation/http/dto/create-permission.dto.js';
import { CreateRoleDto } from '../presentation/http/dto/create-role.dto.js';
import { ListPermissionsQueryDto } from '../presentation/http/dto/list-permissions-query.dto.js';
import { ListRolesQueryDto } from '../presentation/http/dto/list-roles-query.dto.js';
import { DirectPermissionItemDto } from '../presentation/http/dto/replace-user-permissions.dto.js';
import { UpdatePermissionDto } from '../presentation/http/dto/update-permission.dto.js';
import { UpdateRoleConfigurationDto } from '../presentation/http/dto/update-role-configuration.dto.js';
import { AuthorizationPolicyService } from './authorization-policy.service.js';
import { AuthorizationService } from './authorization.service.js';

type PermissionListItem = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  roleCount: number;
  directUserCount: number;
  createdAt: Date;
  updatedAt: Date;
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

type RoleListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly policy: AuthorizationPolicyService,
  ) {}

  async listRoles(query: ListRolesQueryDto): Promise<PaginatedResult<RoleListItem>> {
    const page = query.page;
    const pageSize = query.pageSize;

    const search = query.search?.trim() || undefined;

    const where: Prisma.RoleWhereInput = {
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(typeof query.isSystem === 'boolean' ? { isSystem: query.isSystem } : {}),
      ...(search
        ? {
            OR: [
              {
                code: {
                  contains: search.toUpperCase(),
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * pageSize;

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
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
      }),
      this.prisma.role.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        isActive: role.isActive,
        userCount: role._count.users,
        permissionCount: role._count.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getRoleById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          orderBy: {
            permission: {
              code: 'asc',
            },
          },
          select: {
            assignedAt: true,
            permission: {
              select: {
                id: true,
                code: true,
                name: true,
                module: true,
                description: true,
                isSystem: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      userCount: role._count.users,
      permissions: role.permissions.map(({ permission, assignedAt }) => ({
        ...permission,
        assignedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async listAssignablePermissions(actorId: string) {
    const authorization = await this.authorizationService.getEffectiveAuthorization(actorId);

    const codeFilter: Prisma.StringFilter = authorization.isSuperAdmin
      ? {
          not: SYSTEM_PERMISSIONS.SUPER_ADMIN,
        }
      : {
          in: authorization.permissionCodes.filter(
            (code) => code !== SYSTEM_PERMISSIONS.SUPER_ADMIN,
          ),
        };

    return this.prisma.permission.findMany({
      where: {
        isActive: true,
        code: codeFilter,
      },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        module: true,
        description: true,
        isSystem: true,
      },
    });
  }

  async listPermissions(
    query: ListPermissionsQueryDto,
  ): Promise<PaginatedResult<PermissionListItem>> {
    const page = query.page;
    const pageSize = query.pageSize;

    const search = query.search?.trim() || undefined;
    const module = query.module?.trim().toLowerCase() || undefined;

    const where: Prisma.PermissionWhereInput = {
      ...(module ? { module } : {}),
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(typeof query.isSystem === 'boolean' ? { isSystem: query.isSystem } : {}),
      ...(search
        ? {
            OR: [
              {
                code: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                module: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * pageSize;

    const [permissions, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        skip,
        take: pageSize,
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
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      items: permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description,
        isSystem: permission.isSystem,
        isActive: permission.isActive,
        roleCount: permission._count.roles,
        directUserCount: permission._count.users,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async listPermissionModules(): Promise<string[]> {
    const modules = await this.prisma.permission.findMany({
      distinct: ['module'],
      orderBy: {
        module: 'asc',
      },
      select: {
        module: true,
      },
    });

    return modules.map(({ module }) => module);
  }

  async getPermissionById(permissionId: string) {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id: permissionId,
      },
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
        roles: {
          orderBy: {
            role: {
              name: 'asc',
            },
          },
          select: {
            assignedAt: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                isSystem: true,
                isActive: true,
              },
            },
          },
        },
        users: {
          orderBy: {
            assignedAt: 'desc',
          },
          select: {
            effect: true,
            assignedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    return {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      module: permission.module,
      description: permission.description,
      isSystem: permission.isSystem,
      isActive: permission.isActive,
      roles: permission.roles.map(({ role, assignedAt }) => ({
        ...role,
        assignedAt,
      })),
      directUsers: permission.users.map(({ user, effect, assignedAt }) => ({
        user,
        effect,
        assignedAt,
      })),
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
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

  async createPermission(actorId: string, dto: CreatePermissionDto): Promise<PermissionListItem> {
    const code = dto.code.trim().toLowerCase();
    const module = dto.module.trim().toLowerCase();

    this.assertRuntimePermissionNamespace(code, module);

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
            module,
            name: dto.name.trim(),
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
            createdAt: true,
            updatedAt: true,
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

    return {
      ...created.permission,
      roleCount: 1,
      directUserCount: 0,
    };
  }

  async updatePermission(actorId: string, permissionId: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id: permissionId,
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

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    if (permission.isSystem) {
      throw new BadRequestException({
        code: 'SYSTEM_PERMISSION_CANNOT_BE_MODIFIED',
        message: 'System permissions cannot be modified',
      });
    }

    const activeStateChanged = permission.isActive !== dto.isActive;

    const affectedUserIds = activeStateChanged
      ? await this.findAffectedUserIdsByPermission(permissionId)
      : [];

    const updatedPermission = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.permission.update({
        where: {
          id: permissionId,
        },
        data: {
          name: dto.name.trim(),
          description: this.normalizeOptionalText(dto.description ?? undefined),
          isActive: dto.isActive,
        },
      });

      if (activeStateChanged && affectedUserIds.length > 0) {
        await transaction.user.updateMany({
          where: {
            id: {
              in: affectedUserIds,
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
          action: 'PERMISSION_UPDATED',
          resourceType: 'PERMISSION',
          resourceId: permission.id,
          beforeData: {
            name: permission.name,
            description: permission.description,
            isActive: permission.isActive,
          },
          afterData: {
            name: updated.name,
            description: updated.description,
            isActive: updated.isActive,
          },
        },
      });

      return updated;
    });

    if (activeStateChanged) {
      await this.authorizationService.invalidateUsers(affectedUserIds);
    }

    return updatedPermission;
  }

  async deletePermission(actorId: string, permissionId: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id: permissionId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        module: true,
        description: true,
        isSystem: true,
        _count: {
          select: {
            roles: true,
            users: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    if (permission.isSystem) {
      throw new BadRequestException({
        code: 'SYSTEM_PERMISSION_CANNOT_BE_DELETED',
        message: 'System permissions cannot be deleted',
      });
    }

    if (permission._count.roles > 0 || permission._count.users > 0) {
      throw new ConflictException({
        code: 'PERMISSION_IS_ASSIGNED',
        message: 'Permission is assigned to roles or users',
        roleCount: permission._count.roles,
        directUserCount: permission._count.users,
      });
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'PERMISSION_DELETED',
          resourceType: 'PERMISSION',
          resourceId: permission.id,
          beforeData: {
            code: permission.code,
            name: permission.name,
            module: permission.module,
            description: permission.description,
          },
        },
      });

      await transaction.permission.delete({
        where: {
          id: permissionId,
        },
      });
    });
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

  async updateRoleConfiguration(actorId: string, roleId: string, dto: UpdateRoleConfigurationDto) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        permissions: {
          select: {
            permissionId: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    if (role.isSystem && !dto.isActive) {
      throw new BadRequestException({
        code: 'SYSTEM_ROLE_CANNOT_BE_DEACTIVATED',
        message: 'System roles cannot be deactivated',
      });
    }

    const uniquePermissionIds = [...new Set(dto.permissionIds)];

    if (
      role.code === 'SUPER_ADMIN' &&
      !this.haveSameStringValues(
        role.permissions.map(({ permissionId }) => permissionId),
        uniquePermissionIds,
      )
    ) {
      throw new BadRequestException({
        code: 'SUPER_ADMIN_PERMISSIONS_CANNOT_BE_REPLACED',
        message: 'SUPER_ADMIN permissions are managed automatically',
      });
    }

    await this.assertActivePermissionsExist(uniquePermissionIds);

    if (role.code !== 'SUPER_ADMIN') {
      await this.policy.assertProtectedPermissionNotAssigned(uniquePermissionIds);
      await this.policy.assertCanGrantPermissionIds(actorId, uniquePermissionIds);
    }

    const affectedUsers = await this.prisma.userRole.findMany({
      where: {
        roleId,
      },
      select: {
        userId: true,
      },
    });

    const previousPermissionIds = role.permissions.map(({ permissionId }) => permissionId);

    const permissionsChanged = !this.haveSameStringValues(
      previousPermissionIds,
      uniquePermissionIds,
    );

    const activeStateChanged = role.isActive !== dto.isActive;

    const updatedRole = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.role.update({
        where: {
          id: roleId,
        },
        data: {
          name: dto.name.trim(),
          description: this.normalizeOptionalText(dto.description ?? undefined),
          isActive: dto.isActive,
        },
      });

      if (permissionsChanged && role.code !== 'SUPER_ADMIN') {
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
      }

      if (permissionsChanged || activeStateChanged) {
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
      }

      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'ROLE_CONFIGURATION_UPDATED',
          resourceType: 'ROLE',
          resourceId: roleId,
          beforeData: {
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            permissionIds: previousPermissionIds,
          },
          afterData: {
            name: result.name,
            description: result.description,
            isActive: result.isActive,
            permissionIds:
              role.code === 'SUPER_ADMIN' ? previousPermissionIds : uniquePermissionIds,
          },
        },
      });

      return result;
    });

    if (permissionsChanged || activeStateChanged) {
      await this.authorizationService.invalidateUsers(affectedUsers.map(({ userId }) => userId));
    }

    return updatedRole;
  }

  async deleteRole(actorId: string, roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    if (role.isSystem) {
      throw new BadRequestException({
        code: 'SYSTEM_ROLE_CANNOT_BE_DELETED',
        message: 'System roles cannot be deleted',
      });
    }

    if (role._count.users > 0) {
      throw new ConflictException({
        code: 'ROLE_IS_ASSIGNED_TO_USERS',
        message: 'The role is assigned to one or more users',
      });
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          actorId,
          action: 'ROLE_DELETED',
          resourceType: 'ROLE',
          resourceId: role.id,
          beforeData: {
            code: role.code,
            name: role.name,
            description: role.description,
          },
        },
      });

      await transaction.role.delete({
        where: {
          id: roleId,
        },
      });
    });
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

  private haveSameStringValues(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const leftSet = new Set(left);

    return right.every((value) => leftSet.has(value));
  }

  private assertRuntimePermissionNamespace(code: string, module: string): void {
    if (
      code === SYSTEM_PERMISSIONS.SUPER_ADMIN ||
      code.startsWith('system.') ||
      module === 'system'
    ) {
      throw new BadRequestException({
        code: 'RESERVED_PERMISSION_NAMESPACE',
        message: 'The system permission namespace is reserved',
      });
    }
  }

  private async findAffectedUserIdsByPermission(permissionId: string): Promise<string[]> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        id: permissionId,
      },
      select: {
        users: {
          select: {
            userId: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                users: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return [];
    }

    return [
      ...new Set([
        ...permission.users.map(({ userId }) => userId),
        ...permission.roles.flatMap(({ role }) => role.users.map(({ userId }) => userId)),
      ]),
    ];
  }
}
