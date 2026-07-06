import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthPrincipal } from '../../../domain/auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal => {
    const request = context.switchToHttp().getRequest<{
      user: AuthPrincipal | undefined;
    }>();

    if (!request.user) {
      throw new Error('CurrentUser used without JwtAuthGuard');
    }

    return request.user;
  },
);
