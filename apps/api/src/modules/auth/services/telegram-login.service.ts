import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtPayload } from '../types/authenticated-user';
import { RefreshTokenService } from './refresh-token.service';
import { TelegramAuthService, TelegramAuthPayload } from './telegram-auth.service';
import { ParentInviteService } from '../../parents/services/parent-invite.service';
import { isParent } from '../../../common/enums/role.enum';

interface LoginMeta {
  userAgent?: string;
  ip: string;
}

/**
 * Orchestrates Telegram-based authentication flows.
 *
 * Security contract:
 * - Hash validation is always delegated to TelegramAuthService (crypto.timingSafeEqual).
 * - JWT issuance mirrors AuthService.signAccessToken exactly (same secret, same algorithm).
 * - RefreshTokenService.issue() is the single code path for refresh token creation.
 * - This service never logs the Telegram hash, bot token, or raw refresh token.
 */
@Injectable()
export class TelegramLoginService {
  private readonly logger = new Logger(TelegramLoginService.name);
  private readonly accessSecret: string;
  private readonly accessExpires: string;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly telegramAuth: TelegramAuthService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly parentInvites: ParentInviteService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessExpires = config.getOrThrow<string>('JWT_ACCESS_EXPIRES');
  }

  /**
   * Validates the Telegram widget payload and issues JWT + refresh tokens for
   * an existing, active user. Does NOT create a user — staff accounts are
   * admin-managed and parent accounts are invite-only.
   *
   * Error semantics: 404 on unknown Telegram ID so the client can prompt the
   * user to contact administration, distinct from 401 (bad hash).
   */
  async loginByTelegram(payload: TelegramAuthPayload, meta: LoginMeta): Promise<LoginResponseDto> {
    // Throws UnauthorizedException if hash is invalid or auth_date > 24 h old.
    this.telegramAuth.validate(payload);

    // telegramChatId is a bigint column stored as varchar — cast for comparison.
    const user = await this.users.findOne({
      where: { telegramChatId: String(payload.id) },
    });

    if (!user) {
      throw new NotFoundException('Account not found. Please contact the school administrator.');
    }

    if (!user.isActive || user.deletedAt !== null) {
      throw new ForbiddenException('Account is disabled');
    }

    this.logger.log(`Telegram login success userId=${user.id} ip=${meta.ip}`);

    return this.buildLoginResponse(user, meta);
  }

  /**
   * Links the presented Telegram identity to the currently authenticated user.
   * Idempotent when the same Telegram ID is already on the same user (re-link).
   * Throws 409 if the Telegram ID is already owned by a *different* user.
   */
  async linkToCurrentUser(
    currentUserId: string,
    payload: TelegramAuthPayload,
  ): Promise<{ linked: true; telegramId: number }> {
    // Validate hash + freshness before any DB write.
    this.telegramAuth.validate(payload);

    const telegramChatId = String(payload.id);

    const existing = await this.users.findOne({ where: { telegramChatId } });

    if (existing && existing.id !== currentUserId) {
      throw new ConflictException('This Telegram account is already linked to another user');
    }

    await this.users.update(
      { id: currentUserId },
      {
        telegramChatId,
        telegramUsername: payload.username ?? null,
        telegramFirstName: payload.first_name,
        telegramLastName: payload.last_name ?? null,
        telegramPhotoUrl: payload.photo_url ?? null,
      },
    );

    this.logger.log(`Telegram linked userId=${currentUserId}`);

    return { linked: true, telegramId: payload.id };
  }

  /**
   * Thin orchestrator for the parent invite acceptance flow:
   * 1. Delegates full transactional logic to ParentInviteService.acceptInvite
   *    (validates hash, locks invite row FOR UPDATE, creates user, upserts
   *    parent_students, burns invite — all in one DB transaction).
   * 2. Issues JWT + refresh tokens for the newly accepted parent user.
   *
   * PARENT role check after accept ensures acceptInvite only returns PARENT users.
   */
  async acceptInviteAndLogin(input: {
    token: string;
    telegramPayload: TelegramAuthPayload;
    meta: LoginMeta;
  }): Promise<LoginResponseDto> {
    // Telegram hash verification lives here rather than inside
    // ParentInviteService so that the parents module does not need to import
    // AuthModule, which would create a circular module dependency with
    // AuthModule importing ParentsModule for ParentInviteService.
    this.telegramAuth.validate(input.telegramPayload);
    const { user } = await this.parentInvites.acceptInvite({
      token: input.token,
      telegramPayload: input.telegramPayload,
    });

    // Defensive: acceptInvite guarantees PARENT role but we assert here so a
    // future refactor cannot silently issue staff-scoped tokens via this path.
    if (!isParent(user.role)) {
      throw new ForbiddenException('This login flow is restricted to parent accounts');
    }

    this.logger.log(`Invite accepted, parent logged in userId=${user.id} ip=${input.meta.ip}`);

    return this.buildLoginResponse(user, input.meta);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildLoginResponse(user: User, meta: LoginMeta): Promise<LoginResponseDto> {
    const issued = await this.refreshTokens.issue({
      userId: user.id,
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
    });

    const accessToken = this.signAccessToken(user);

    return {
      accessToken,
      refreshToken: issued.raw,
      user: UserResponseDto.fromEntity(user),
    };
  }

  /**
   * Mirrors AuthService.signAccessToken exactly — same secret, algorithm, and
   * payload shape. Kept private to this service; controllers receive only the
   * opaque token string in LoginResponseDto.
   */
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
