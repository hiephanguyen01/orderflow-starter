import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { AccessControlService } from '../../../application/access-control.service.js';
import { ACCESS_CONTROL_PERMISSIONS } from '../../../domain/permission.constants.js';
import { RequirePermissions } from '../decorators/require-permissions.decorator.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Roles')
@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_READ])
  listRoles() {
    return this.accessControlService.listRoles();
  }

  @Post()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_CREATE])
  createRole(@CurrentUser() user: AuthPrincipal, @Body() dto: CreateRoleDto) {
    return this.accessControlService.createRole(user.userId, dto);
  }

  @Put(':roleId/permissions')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_ASSIGN])
  replacePermissions(
    @CurrentUser() user: AuthPrincipal,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ) {
    return this.accessControlService.replaceRolePermissions(user.userId, roleId, dto.permissionIds);
  }
}
