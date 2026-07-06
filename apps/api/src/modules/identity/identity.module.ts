import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthService } from './application/auth.service.js';
import { PasswordService } from './application/password.service.js';
import { TokenService } from './application/token.service.js';
import { AuthController } from './presentation/auth.controller.js';
import { JwtAuthGuard } from './presentation/jwt-auth.guard.js';
import { JwtStrategy } from './presentation/jwt.strategy.js';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [PrismaService, AuthService, PasswordService, TokenService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PasswordService],
})
export class IdentityModule {}
