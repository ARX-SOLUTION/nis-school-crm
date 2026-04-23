import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { BruteForceService } from './services/brute-force.service';
import { FeatureFlagsService, FeatureFlagGuard } from './services/feature-flags.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TelegramAuthService } from './services/telegram-auth.service';
import { TelegramLoginRateLimitService } from './services/telegram-login-rate-limit.service';
import { TelegramLoginService } from './services/telegram-login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ParentsModule } from '../parents/parents.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    ParentsModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_ACCESS_EXPIRES'),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenService,
    BruteForceService,
    TelegramAuthService,
    TelegramLoginRateLimitService,
    TelegramLoginService,
    FeatureFlagsService,
    FeatureFlagGuard,
  ],
  exports: [AuthService, TelegramLoginService, FeatureFlagsService, FeatureFlagGuard],
})
export class AuthModule {}
