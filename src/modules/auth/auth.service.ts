import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginResponseDto } from './dto/login-response.dto';
import { BruteForceService } from './services/brute-force.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtPayload } from './types/authenticated-user';
import { User } from '../users/entities/user.entity';

interface LoginContext {
  ipAddress: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessExpires: string;
  private readonly accessSecret: string;
  private readonly bcryptCost: number;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly bruteForce: BruteForceService,
    config: ConfigService,
  ) {
    this.accessExpires = config.getOrThrow<string>('JWT_ACCESS_EXPIRES');
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.bcryptCost = config.getOrThrow<number>('BCRYPT_COST');
  }

  async login(email: string, password: string, ctx: LoginContext): Promise<LoginResponseDto> {
    if (await this.bruteForce.isLocked(email, ctx.ipAddress)) {
      throw new HttpException(
        'Too many failed attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users.findByEmail(email);
    // Constant-time path: always run bcrypt.compare even when the user is unknown,
    // so an attacker can't distinguish unknown emails from wrong passwords by timing.
    const passwordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(
          password,
          '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi.',
        );

    if (!user || !passwordValid) {
      await this.bruteForce.recordFailure(email, ctx.ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.deletedAt !== null) {
      await this.bruteForce.recordFailure(email, ctx.ipAddress);
      throw new ForbiddenException('Account is disabled');
    }

    await this.bruteForce.clear(email, ctx.ipAddress);
    await this.users.touchLastLogin(user.id);

    return this.buildLoginResponse(user, ctx);
  }

  async refresh(rawToken: string, ctx: LoginContext): Promise<LoginResponseDto> {
    const current = await this.refreshTokens.consume(rawToken);
    const user = current.user;
    if (!user || !user.isActive || user.deletedAt !== null) {
      await this.refreshTokens.revokeFamily(current.familyId);
      throw new UnauthorizedException('Account is disabled');
    }
    const next = await this.refreshTokens.rotate(current, ctx);
    const accessToken = this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: next.raw,
      user: UserResponseDto.fromEntity(user),
    };
  }

  /**
   * Revoke the supplied refresh token. The caller's authenticated user MUST own
   * the token — this prevents one valid bearer from revoking other users' sessions.
   */
  async logout(authUserId: string, rawToken: string): Promise<void> {
    let current;
    try {
      current = await this.refreshTokens.consume(rawToken);
    } catch (err) {
      // Idempotent for invalid / expired / already-revoked tokens.
      if (err instanceof UnauthorizedException) return;
      throw err;
    }
    if (current.userId !== authUserId) {
      throw new ForbiddenException('Refresh token does not belong to the authenticated user');
    }
    await this.refreshTokens.revoke(current);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    ctx: LoginContext,
  ): Promise<void> {
    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must differ from the old one');
    }
    const user = await this.users.getById(userId);
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid current password');
    }
    const newHash = await bcrypt.hash(newPassword, this.bcryptCost);
    await this.users.updatePassword(user.id, newHash);
    await this.refreshTokens.revokeAllForUser(user);
    this.logger.log(`Password changed for user ${user.id} from ${ctx.ipAddress}`);
  }

  private async buildLoginResponse(user: User, ctx: LoginContext): Promise<LoginResponseDto> {
    const issued = await this.refreshTokens.issue({
      userId: user.id,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });
    const accessToken = this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: issued.raw,
      user: UserResponseDto.fromEntity(user),
    };
  }

  private signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpires,
      algorithm: 'HS256',
    });
  }
}
