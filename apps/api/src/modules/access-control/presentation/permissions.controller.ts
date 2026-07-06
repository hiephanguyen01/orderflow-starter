import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../identity/presentation/current-user.decorator.js';
import { JwtAuthGuard } from '../../identity/presentation/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../identity/types/auth-principal.js';
import { AccessControlService } from '../application/access-control.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePermissions } from './require-permissions.decorator.js';

@Controller('access-control/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Post()
  @RequirePermissions('permissions.create')
  createPermission(@CurrentUser() user: AuthPrincipal, @Body() dto: CreatePermissionDto) {
    return this.accessControlService.createPermission(user.userId, dto);
  }
}
