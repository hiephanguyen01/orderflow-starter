import { Module } from '@nestjs/common';

import { AccessControlService } from './application/access-control.service.js';
import { AuthorizationPolicyService } from './application/authorization-policy.service.js';
import { AuthorizationService } from './application/authorization.service.js';
import { PermissionsController } from './presentation/http/controllers/permissions.controller.js';
import { RolesController } from './presentation/http/controllers/roles.controller.js';
import { UserAccessController } from './presentation/http/controllers/user-access.controller.js';
import { PermissionsGuard } from './presentation/http/guards/permissions.guard.js';

@Module({
  controllers: [PermissionsController, RolesController, UserAccessController],
  providers: [
    AuthorizationService,
    AccessControlService,
    AuthorizationPolicyService,
    PermissionsGuard,
  ],
  exports: [AuthorizationService, PermissionsGuard],
})
export class AccessControlModule {}
