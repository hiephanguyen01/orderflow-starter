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
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { ListPermissionsQueryDto } from '../dto/list-permissions-query.dto.js';
import { UpdatePermissionDto } from '../dto/update-permission.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('modules')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  listModules() {
    return this.accessControlService.listPermissionModules();
  }

  @Get('assignable')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  listAssignablePermissions(@CurrentUser() user: AuthPrincipal) {
    return this.accessControlService.listAssignablePermissions(user.userId);
  }

  @Get()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  listPermissions(@Query() query: ListPermissionsQueryDto) {
    return this.accessControlService.listPermissions(query);
  }

  @Get(':permissionId')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_READ])
  getPermissionById(
    @Param('permissionId', new ParseUUIDPipe({ version: '4' })) permissionId: string,
  ) {
    return this.accessControlService.getPermissionById(permissionId);
  }

  @Post()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_CREATE])
  createPermission(@CurrentUser() user: AuthPrincipal, @Body() dto: CreatePermissionDto) {
    return this.accessControlService.createPermission(user.userId, dto);
  }

  @Put(':permissionId')
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_UPDATE])
  updatePermission(
    @CurrentUser() user: AuthPrincipal,
    @Param('permissionId', new ParseUUIDPipe({ version: '4' })) permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.accessControlService.updatePermission(user.userId, permissionId, dto);
  }

  @Delete(':permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.PERMISSIONS_DELETE])
  async deletePermission(
    @CurrentUser() user: AuthPrincipal,
    @Param('permissionId', new ParseUUIDPipe({ version: '4' })) permissionId: string,
  ): Promise<void> {
    await this.accessControlService.deletePermission(user.userId, permissionId);
  }
}
