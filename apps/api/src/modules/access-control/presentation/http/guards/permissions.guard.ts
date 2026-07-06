import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { AuthorizationService } from '../../../application/authorization.service.js';
import type { RequiredPermissionsMetadata } from '../../../domain/permission-match-mode.js';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';

type AuthenticatedRequest = Request & {
  user?: AuthPrincipal;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<RequiredPermissionsMetadata>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata || metadata.permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException({
        code: 'AUTHENTICATED_USER_REQUIRED',
        message: 'Authenticated user is required',
      });
    }

    const allowed =
      metadata.mode === 'ALL'
        ? await this.authorizationService.hasAllPermissions(userId, metadata.permissions)
        : await this.authorizationService.hasAnyPermission(userId, metadata.permissions);

    if (!allowed) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
        requiredPermissions: metadata.permissions,
        matchMode: metadata.mode,
      });
    }

    return true;
  }
}
