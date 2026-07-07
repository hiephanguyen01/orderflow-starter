import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { AccessControlService } from '../../../application/access-control.service.js';
import { ACCESS_CONTROL_PERMISSIONS } from '../../../domain/permission.constants.js';
import { RequirePermissions } from '../decorators/require-permissions.decorator.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { ListRolesQueryDto } from '../dto/list-roles-query.dto.js';
import { UpdateRoleConfigurationDto } from '../dto/update-role-configuration.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Roles')
@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_READ])
  listRoles(@Query() query: ListRolesQueryDto) {
    return this.accessControlService.listRoles(query);
  }

  @Get('assignable')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_READ])
  listAssignableRoles(@CurrentUser() user: AuthPrincipal) {
    return this.accessControlService.listAssignableRoles(user.userId);
  }

  @Get(':roleId')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_READ])
  getRoleById(@Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string) {
    return this.accessControlService.getRoleById(roleId);
  }

  @Post()
  @RequirePermissions([
    ACCESS_CONTROL_PERMISSIONS.ROLES_CREATE,
    ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_ASSIGN,
  ])
  createRole(@CurrentUser() user: AuthPrincipal, @Body() dto: CreateRoleDto) {
    return this.accessControlService.createRole(user.userId, dto);
  }

  @Put(':roleId/configuration')
  @RequirePermissions([
    ACCESS_CONTROL_PERMISSIONS.ROLES_UPDATE,
    ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_ASSIGN,
  ])
  updateRoleConfiguration(
    @CurrentUser() user: AuthPrincipal,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
    @Body() dto: UpdateRoleConfigurationDto,
  ) {
    return this.accessControlService.updateRoleConfiguration(user.userId, roleId, dto);
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.ROLES_DELETE])
  async deleteRole(
    @CurrentUser() user: AuthPrincipal,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
  ): Promise<void> {
    await this.accessControlService.deleteRole(user.userId, roleId);
  }
}
