import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthPrincipal } from '../../../../identity/domain/auth.types.js';
import { CurrentUser } from '../../../../identity/presentation/http/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../identity/presentation/http/guards/jwt-auth.guard.js';
import { AuthorizationService } from '../../../application/authorization.service.js';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth/me')
@UseGuards(JwtAuthGuard)
export class CurrentAuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('authorization')
  getCurrentAuthorization(@CurrentUser() principal: AuthPrincipal) {
    return this.authorizationService.getEffectiveAuthorization(principal.userId);
  }
}
