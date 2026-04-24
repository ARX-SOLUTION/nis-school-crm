import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramLinkDto } from './dto/telegram-link.dto';
import { CreateParentInviteDto } from './dto/create-parent-invite.dto';
import { AcceptParentInviteDto } from './dto/accept-parent-invite.dto';
import { ParentInviteResponseDto } from './dto/parent-invite-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature } from './services/feature-flags.service';
import { TelegramLoginService } from './services/telegram-login.service';
import { TelegramLoginRateLimitService } from './services/telegram-login-rate-limit.service';
import { AuthenticatedUser } from './types/authenticated-user';
import { RoleName } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ParentInviteService } from '../parents/services/parent-invite.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller({ path: 'auth', version: ['1'] })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly telegramLogin: TelegramLoginService,
    private readonly telegramLoginRateLimit: TelegramLoginRateLimitService,
    private readonly parentInvites: ParentInviteService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // v1 endpoints (unchanged)
  // ---------------------------------------------------------------------------

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    return this.auth.login(dto.email, dto.password, {
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh pair' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<LoginResponseDto> {
    return this.auth.refresh(dto.refreshToken, {
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the supplied refresh token (must belong to caller)' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.auth.logout(user.id, dto.refreshToken);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the current user password' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto.oldPassword, dto.newPassword, {
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user profile' })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.users.getById(current.id);
    return UserResponseDto.fromEntity(user);
  }

  // ---------------------------------------------------------------------------
  // Telegram login (v2 / feature-flagged)
  // ---------------------------------------------------------------------------

  @Public()
  @RequireFeature('TELEGRAM_LOGIN')
  @UseGuards(FeatureFlagGuard)
  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate via Telegram Login Widget' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Telegram hash or expired auth_date' })
  @ApiResponse({ status: 403, description: 'Account is disabled' })
  @ApiResponse({ status: 404, description: 'Telegram ID not linked to any account' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiResponse({ status: 503, description: 'Feature disabled' })
  async loginViaTelegram(
    @Body() dto: TelegramAuthDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    await this.telegramLoginRateLimit.registerAttempt(ip);
    return this.telegramLogin.loginByTelegram(dto, {
      ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @RequireFeature('TELEGRAM_LOGIN')
  @UseGuards(FeatureFlagGuard)
  @Post('telegram/link')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link the authenticated user account to a Telegram identity' })
  @ApiResponse({
    status: 200,
    description: 'Telegram account linked successfully',
    schema: {
      type: 'object',
      properties: {
        linked: { type: 'boolean', example: true },
        telegramId: { type: 'number', example: 123456789 },
      },
      required: ['linked', 'telegramId'],
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid Telegram hash or missing JWT' })
  @ApiResponse({ status: 409, description: 'Telegram ID already bound to another user' })
  @ApiResponse({ status: 503, description: 'Feature disabled' })
  telegramLink(
    @Body() dto: TelegramLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ linked: true; telegramId: number }> {
    return this.telegramLogin.linkToCurrentUser(user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // Parent portal — invite + accept (v2 / feature-flagged)
  // ---------------------------------------------------------------------------

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.MANAGER)
  @RequireFeature('PARENT_PORTAL')
  @UseGuards(FeatureFlagGuard)
  @Post('parent/invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a parent invite link for a student (staff only)' })
  @ApiResponse({ status: 201, type: ParentInviteResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 503, description: 'Feature disabled' })
  async createParentInvite(
    @Body() dto: CreateParentInviteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ParentInviteResponseDto> {
    const invite = await this.parentInvites.createInvite({
      studentId: dto.studentId,
      parentName: dto.parentName ?? null,
      relationship: dto.relationship ?? null,
      createdById: user.id,
    });
    return ParentInviteResponseDto.fromEntity(invite, this.config);
  }

  @Public()
  @RequireFeature('PARENT_PORTAL')
  @UseGuards(FeatureFlagGuard)
  @Post('parent/accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a parent invite via Telegram and receive a JWT session' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invite expired or already used' })
  @ApiResponse({ status: 401, description: 'Invalid Telegram hash' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 409, description: 'Telegram ID already bound to a staff account' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiResponse({ status: 503, description: 'Feature disabled' })
  async acceptParentInvite(
    @Body() dto: AcceptParentInviteDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    await this.telegramLoginRateLimit.registerAttempt(ip);
    return this.telegramLogin.acceptInviteAndLogin({
      token: dto.inviteToken,
      telegramPayload: dto.telegramAuthData,
      meta: { ip, userAgent: req.headers['user-agent'] },
    });
  }
}

// Express resolves `req.ip` against the `trust proxy` setting configured in
// main.ts, so we don't parse `X-Forwarded-For` ourselves — that would let an
// attacker spoof the source IP and bypass per-IP brute-force lockout when the
// app is reachable directly.
function clientIp(req: Request): string {
  return req.ip ?? 'unknown';
}
