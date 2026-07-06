import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { AccessControlService } from '../../../application/access-control.service.js';
import { ACCESS_CONTROL_PERMISSIONS } from '../../../domain/permission.constants.js';
import { RequirePermissions } from '../decorators/require-permissions.decorator.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('assignable')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  listAssignablePermissions(@CurrentUser() user: AuthPrincipal) {
    return this.accessControlService.listAssignablePermissions(user.userId);
  }

  @Get()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  listPermissions() {
    return this.accessControlService.listPermissions();
  }

  @Post()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_CREATE])
  createPermission(@CurrentUser() user: AuthPrincipal, @Body() dto: CreatePermissionDto) {
    return this.accessControlService.createPermission(user.userId, dto);
  }
}
