import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import { AccessControlService } from '../../../application/access-control.service.js';
import { ACCESS_CONTROL_PERMISSIONS } from '../../../domain/permission.constants.js';
import { RequirePermissions } from '../decorators/require-permissions.decorator.js';
import { ListUsersQueryDto } from '../dto/list-users-query.dto.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @RequirePermissions([ACCESS_CONTROL_PERMISSIONS.USERS_READ])
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.accessControlService.listUsers(query);
  }
}
