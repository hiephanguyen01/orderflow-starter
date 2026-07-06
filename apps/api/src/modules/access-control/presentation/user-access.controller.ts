import { Body, Controller, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../identity/domain/auth.types.js';
import { AccessControlService } from '../application/access-control.service.js';
import { ReplaceUserPermissionsDto } from '../dto/replace-user-permissions.dto.js';
import { ReplaceUserRolesDto } from '../dto/replace-user-roles.dto.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePermissions } from './require-permissions.decorator.js';

@Controller('access-control/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserAccessController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Put(':userId/roles')
  @RequirePermissions('users.manage-access', 'roles.assign')
  replaceUserRoles(
    @CurrentUser() user: AuthPrincipal,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: ReplaceUserRolesDto,
  ) {
    return this.accessControlService.replaceUserRoles(user.userId, userId, dto.roleIds);
  }

  @Put(':userId/permissions')
  @RequirePermissions('users.manage-access', 'permissions.assign')
  replaceUserPermissions(
    @CurrentUser() user: AuthPrincipal,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: ReplaceUserPermissionsDto,
  ) {
    return this.accessControlService.replaceUserPermissions(user.userId, userId, dto.permissions);
  }
}
