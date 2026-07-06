import { ForbiddenException, Injectable } from '@nestjs/common';

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

  async assertCanAssignRoles(actorId: string, roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      select: {
        permissionId: true,
      },
    });

    await this.assertCanGrantPermissionIds(
      actorId,
      rolePermissions.map(({ permissionId }) => permissionId),
    );
  }

  async assertCanModifyTargetUser(actorId: string, targetUserId: string): Promise<void> {
    if (actorId !== targetUserId) {
      return;
    }

    const actorAuthorization = await this.authorizationService.getEffectiveAuthorization(actorId);

    if (actorAuthorization.isSuperAdmin) {
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
}
