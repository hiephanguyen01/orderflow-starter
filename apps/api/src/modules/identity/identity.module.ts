import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './application/auth.service.js';
import { PasswordService } from './application/password.service.js';
import { RefreshCookieService } from './application/refresh-cookie.service.js';
import { TokenService } from './application/token.service.js';
import authConfig from './config/auth.config.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard.js';
import { JwtStrategy } from './presentation/http/strategies/jwt.strategy.js';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.register({}),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    PasswordService,
    TokenService,
    RefreshCookieService,
    JwtStrategy,
    JwtAuthGuard,
  ],

  exports: [JwtAuthGuard, PasswordService],
})
export class IdentityModule {}
