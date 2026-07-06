import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';
import { AuthorizationService } from './authorization.service.js';

const SUPER_ADMIN_PERMISSION = 'system.super-admin';

@Injectable()
export class AccessControlPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async assertCanGrantPermissionIds(actorId: string, permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0 || (await this.isSuperAdmin(actorId))) {
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

    const actorPermissions = await this.authorizationService.getEffectivePermissionCodes(actorId);
    const actorPermissionSet = new Set(actorPermissions);
    const unauthorized = requestedPermissions.filter(({ code }) => !actorPermissionSet.has(code));

    if (unauthorized.length > 0) {
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_FORBIDDEN',
        message: 'You cannot grant permissions that you do not own',
        permissions: unauthorized.map(({ code }) => code),
      });
    }
  }

  async assertCanAssignRoles(actorId: string, roleIds: string[]): Promise<void> {
    if (roleIds.length === 0 || (await this.isSuperAdmin(actorId))) {
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

  async isSuperAdmin(actorId: string): Promise<boolean> {
    const actorPermissions = await this.authorizationService.getEffectivePermissionCodes(actorId);

    return actorPermissions.includes(SUPER_ADMIN_PERMISSION);
  }
}
