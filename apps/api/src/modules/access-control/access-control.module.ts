import { Module } from '@nestjs/common';

import { RedisModule } from '../infrastructure/redis/redis.module.js';
import { AccessControlPolicyService } from './application/access-control-policy.service.js';
import { AccessControlService } from './application/access-control.service.js';
import { AuthorizationService } from './application/authorization.service.js';
import { PermissionsController } from './presentation/permissions.controller.js';
import { PermissionsGuard } from './presentation/permissions.guard.js';
import { RolesController } from './presentation/roles.controller.js';
import { UserAccessController } from './presentation/user-access.controller.js';

@Module({
  imports: [RedisModule],
  controllers: [PermissionsController, RolesController, UserAccessController],
  providers: [
    AuthorizationService,
    AccessControlService,
    AccessControlPolicyService,
    PermissionsGuard,
  ],
  exports: [AuthorizationService, PermissionsGuard],
})
export class AccessControlModule {}
