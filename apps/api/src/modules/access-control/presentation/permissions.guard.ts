import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthPrincipal } from '../../identity/types/auth-principal.js';
import { AuthorizationService } from '../application/authorization.service.js';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator.js';

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
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
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

    const allowed = await this.authorizationService.hasAllPermissions(userId, requiredPermissions);

    if (!allowed) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
        requiredPermissions,
      });
    }

    return true;
  }
}
