import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthService } from '../../application/auth.service.js';
import { RefreshCookieService } from '../../application/refresh-cookie.service.js';
import type { AuthPrincipal, ClientContext } from '../../domain/auth.types.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,

    private readonly refreshCookie: RefreshCookieService,
  ) {}

  @Post('register')
  async register(
    @Body()
    dto: RegisterDto,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result = await this.authService.register(dto, this.getClientContext(request));

    this.refreshCookie.write(response, result.refreshToken, result.refreshTokenExpiresAt);

    return {
      accessToken: result.accessToken,

      accessTokenExpiresInSeconds: result.accessTokenExpiresInSeconds,

      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    dto: LoginDto,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result = await this.authService.login(dto, this.getClientContext(request));

    this.refreshCookie.write(response, result.refreshToken, result.refreshTokenExpiresAt);

    return {
      accessToken: result.accessToken,

      accessTokenExpiresInSeconds: result.accessTokenExpiresInSeconds,

      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const refreshToken = this.refreshCookie.read(request);

    if (!refreshToken) {
      this.refreshCookie.clear(response);

      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REQUIRED',

        message: 'Refresh token is required',
      });
    }

    try {
      const result = await this.authService.refresh(refreshToken);

      this.refreshCookie.write(response, result.refreshToken, result.refreshTokenExpiresAt);

      return {
        accessToken: result.accessToken,

        accessTokenExpiresInSeconds: result.accessTokenExpiresInSeconds,
      };
    } catch (error: unknown) {
      this.refreshCookie.clear(response);

      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(
    @CurrentUser()
    principal: AuthPrincipal,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    await this.authService.logout(principal, this.getClientContext(request));

    this.refreshCookie.clear(response);

    return {
      success: true,
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logoutAll(
    @CurrentUser()
    principal: AuthPrincipal,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const revokedSessionCount = await this.authService.logoutAll(
      principal,
      this.getClientContext(request),
    );

    this.refreshCookie.clear(response);

    return {
      success: true,
      revokedSessionCount,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCurrentUser(
    @CurrentUser()
    principal: AuthPrincipal,
  ) {
    return this.authService.getCurrentUser(principal.userId);
  }

  private getClientContext(request: Request): ClientContext {
    const userAgent = request.get('user-agent');

    return {
      ipAddress: request.ip || null,

      userAgent: userAgent ? userAgent.slice(0, 500) : null,
    };
  }
}
