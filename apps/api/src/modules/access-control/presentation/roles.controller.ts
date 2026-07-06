import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../identity/domain/auth.types.js';
import { AccessControlService } from '../application/access-control.service.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePermissions } from './require-permissions.decorator.js';

@Controller('access-control/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Post()
  @RequirePermissions('roles.create')
  createRole(@CurrentUser() user: AuthPrincipal, @Body() dto: CreateRoleDto) {
    return this.accessControlService.createRole(user.userId, dto);
  }
}
