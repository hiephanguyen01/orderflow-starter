import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { AccessControlService } from '../../../application/access-control.service.js';
import { ACCESS_CONTROL_PERMISSIONS } from '../../../domain/permission.constants.js';
import { RequirePermissions } from '../decorators/require-permissions.decorator.js';
import { ReplaceUserPermissionsDto } from '../dto/replace-user-permissions.dto.js';
import { ReplaceUserRolesDto } from '../dto/replace-user-roles.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserAccessController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get(':userId/access')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.USERS_READ])
  getUserAccess(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.accessControlService.getUserAccess(userId);
  }

  @Put(':userId/roles')
  @RequirePermissions(
    [ACCESS_CONTROL_PERMISSIONS.USERS_MANAGE_ACCESS, ACCESS_CONTROL_PERMISSIONS.ROLES_ASSIGN],
    'ALL',
  )
  replaceUserRoles(
    @CurrentUser() user: AuthPrincipal,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: ReplaceUserRolesDto,
  ) {
    return this.accessControlService.replaceUserRoles(user.userId, userId, dto.roleIds);
  }

  @Put(':userId/permissions')
  @RequirePermissions(
    [ACCESS_CONTROL_PERMISSIONS.USERS_MANAGE_ACCESS, ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_ASSIGN],
    'ALL',
  )
  replaceUserPermissions(
    @CurrentUser() user: AuthPrincipal,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: ReplaceUserPermissionsDto,
  ) {
    return this.accessControlService.replaceUserPermissions(user.userId, userId, dto.permissions);
  }
}
