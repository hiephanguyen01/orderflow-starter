import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { SYSTEM_PERMISSIONS } from '../domain/permission.constants.js';
import { AuthorizationService } from './authorization.service.js';

@Injectable()
export class AuthorizationPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async assertCanGrantPermissionIds(actorId: string, permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    const actorAuthorization = await this.authorizationService.getEffectiveAuthorization(actorId);

    if (actorAuthorization.isSuperAdmin) {
      return;
    }

    const requestedPermissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
      select: {
        code: true,
      },
    });

    const actorPermissionSet = new Set(actorAuthorization.permissionCodes);
    const unauthorized = requestedPermissions.filter(({ code }) => !actorPermissionSet.has(code));

    if (unauthorized.length > 0) {
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_FORBIDDEN',
        message: 'You cannot grant permissions that you do not have',
        permissions: unauthorized.map(({ code }) => code),
      });
    }
  }

  async assertCanAssignRoleIds(actorId: string, roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const actorAuthorization = await this.authorizationService.getEffectiveAuthorization(actorId);

    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
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
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException({
        code: 'INVALID_ROLES',
        message: 'One or more roles do not exist or are inactive',
      });
    }

    const assignsSuperAdmin = roles.some((role) => role.code === 'SUPER_ADMIN');

    if (assignsSuperAdmin && !actorAuthorization.isSuperAdmin) {
      throw new ForbiddenException({
        code: 'SUPER_ADMIN_ASSIGNMENT_FORBIDDEN',
        message: 'Only a super administrator can assign the SUPER_ADMIN role',
      });
    }

    if (actorAuthorization.isSuperAdmin) {
      return;
    }

    const actorPermissionSet = new Set(actorAuthorization.permissionCodes);

    const unauthorizedCodes = [
      ...new Set(
        roles.flatMap((role) =>
          role.permissions
            .map(({ permission }) => permission.code)
            .filter((code) => !actorPermissionSet.has(code)),
        ),
      ),
    ];

    if (unauthorizedCodes.length > 0) {
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_FORBIDDEN',
        message: 'You cannot assign roles containing permissions that you do not have',
        permissions: unauthorizedCodes,
      });
    }
  }

  assertCanModifyTargetUser(actorId: string, targetUserId: string): void {
    if (actorId !== targetUserId) {
      return;
    }

    throw new ForbiddenException({
      code: 'SELF_ACCESS_CHANGE_FORBIDDEN',
      message: 'You cannot change your own access',
    });
  }

  async assertProtectedPermissionNotAssigned(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    const protectedPermission = await this.prisma.permission.findFirst({
      where: {
        id: {
          in: permissionIds,
        },
        code: SYSTEM_PERMISSIONS.SUPER_ADMIN,
      },
      select: {
        id: true,
      },
    });

    if (protectedPermission) {
      throw new ForbiddenException({
        code: 'PROTECTED_PERMISSION_ASSIGNMENT_FORBIDDEN',
        message: 'The super administrator permission cannot be assigned manually',
      });
    }
  }

  async assertNotRemovingLastSuperAdmin(
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

    const currentAssignment = await this.prisma.userRole.findUnique({
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

    if (!currentAssignment) {
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
        code: 'LAST_SUPER_ADMIN_CANNOT_BE_REMOVED',
        message: 'The last active super administrator cannot be removed',
      });
    }
  }

  async isSuperAdmin(actorId: string): Promise<boolean> {
    const authorization = await this.authorizationService.getEffectiveAuthorization(actorId);

    return authorization.isSuperAdmin;
  }

  async isSuperAdminUser(userId: string): Promise<boolean> {
    const assignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          code: 'SUPER_ADMIN',
          isActive: true,
        },
        user: {
          status: 'ACTIVE',
        },
      },
      select: {
        userId: true,
      },
    });

    return Boolean(assignment);
  }
}
