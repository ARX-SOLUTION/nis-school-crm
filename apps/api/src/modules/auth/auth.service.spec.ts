import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { BruteForceService } from './services/brute-force.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { UsersService } from '../users/users.service';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

const ctx = { ipAddress: '1.2.3.4', userAgent: 'jest' };

const buildAuth = (overrides?: {
  user?: User | null;
  passwordValid?: boolean;
  locked?: boolean;
}): {
  service: AuthService;
  bruteForce: { isLocked: jest.Mock; recordFailure: jest.Mock; clear: jest.Mock };
  refreshTokens: {
    issue: jest.Mock;
    consume: jest.Mock;
    rotate: jest.Mock;
    revoke: jest.Mock;
    revokeFamily: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  users: {
    findByEmail: jest.Mock;
    getById: jest.Mock;
    findById: jest.Mock;
    updatePassword: jest.Mock;
    touchLastLogin: jest.Mock;
  };
} => {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(overrides?.user ?? null),
    getById: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
    touchLastLogin: jest.fn(),
  };
  const bruteForce = {
    isLocked: jest.fn().mockResolvedValue(overrides?.locked ?? false),
    recordFailure: jest.fn(),
    clear: jest.fn(),
  };
  const refreshTokens = {
    issue: jest
      .fn()
      .mockResolvedValue({ raw: 'new-refresh', entity: { id: 'rt' } as RefreshToken }),
    consume: jest.fn(),
    rotate: jest
      .fn()
      .mockResolvedValue({ raw: 'rotated-refresh', entity: { id: 'rt2' } as RefreshToken }),
    revoke: jest.fn(),
    revokeFamily: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const jwt = { sign: jest.fn().mockReturnValue('access-token') } as unknown as JwtService;
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'secret';
      if (key === 'JWT_ACCESS_EXPIRES') return '15m';
      if (key === 'BCRYPT_COST') return 12;
      return undefined;
    }),
  } as unknown as ConfigService;

  (bcrypt.compare as jest.Mock).mockResolvedValue(Boolean(overrides?.passwordValid));

  const service = new AuthService(
    users as unknown as UsersService,
    jwt,
    refreshTokens as unknown as RefreshTokenService,
    bruteForce as unknown as BruteForceService,
    config,
  );

  return { service, bruteForce, refreshTokens, users };
};

const baseUser = (over: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'admin@nis.uz',
    passwordHash: 'hashed',
    fullName: 'Admin',
    phone: null,
    role: RoleName.SUPER_ADMIN,
    telegramChatId: null,
    telegramUsername: null,
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as unknown as User;

afterEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.login', () => {
  it('should_return_tokens_on_valid_credentials', async () => {
    const { service, bruteForce, refreshTokens } = buildAuth({
      user: baseUser(),
      passwordValid: true,
    });
    const result = await service.login('admin@nis.uz', 'goodpass', ctx);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('new-refresh');
    expect(result.user.email).toBe('admin@nis.uz');
    expect(bruteForce.clear).toHaveBeenCalledWith('admin@nis.uz', '1.2.3.4');
    expect(refreshTokens.issue).toHaveBeenCalled();
  });

  it('should_block_when_brute_force_locked', async () => {
    const { service, users } = buildAuth({ locked: true });
    await expect(service.login('a@x.com', 'pw', ctx)).rejects.toThrow(HttpException);
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it('should_record_failure_on_unknown_email', async () => {
    const { service, bruteForce } = buildAuth({ user: null, passwordValid: false });
    await expect(service.login('ghost@x.com', 'pw', ctx)).rejects.toThrow(UnauthorizedException);
    expect(bruteForce.recordFailure).toHaveBeenCalledWith('ghost@x.com', '1.2.3.4');
  });

  it('should_record_failure_on_wrong_password', async () => {
    const { service, bruteForce } = buildAuth({ user: baseUser(), passwordValid: false });
    await expect(service.login('admin@nis.uz', 'wrong', ctx)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(bruteForce.recordFailure).toHaveBeenCalled();
  });

  it('should_block_disabled_user', async () => {
    const { service } = buildAuth({ user: baseUser({ isActive: false }), passwordValid: true });
    await expect(service.login('admin@nis.uz', 'pw', ctx)).rejects.toThrow(ForbiddenException);
  });
});

describe('AuthService.refresh', () => {
  it('should_rotate_and_return_new_pair', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockResolvedValue({
      familyId: 'fam',
      user: baseUser(),
    } as unknown as RefreshToken);
    const result = await service.refresh('opaque', ctx);
    expect(result.refreshToken).toBe('rotated-refresh');
    expect(refreshTokens.rotate).toHaveBeenCalled();
  });

  it('should_revoke_family_when_user_disabled', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockResolvedValue({
      familyId: 'fam-2',
      user: baseUser({ isActive: false }),
    } as unknown as RefreshToken);
    await expect(service.refresh('opaque', ctx)).rejects.toThrow(UnauthorizedException);
    expect(refreshTokens.revokeFamily).toHaveBeenCalledWith('fam-2');
  });
});

describe('AuthService.logout', () => {
  it('should_revoke_when_token_valid_and_owned_by_caller', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockResolvedValue({
      id: 'rt',
      userId: 'user-1',
    } as unknown as RefreshToken);
    await service.logout('user-1', 'opaque');
    expect(refreshTokens.revoke).toHaveBeenCalled();
  });

  it('should_be_idempotent_when_token_invalid', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockRejectedValue(new UnauthorizedException());
    await expect(service.logout('user-1', 'opaque')).resolves.toBeUndefined();
    expect(refreshTokens.revoke).not.toHaveBeenCalled();
  });

  it('should_rethrow_non_auth_errors', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockRejectedValue(new Error('redis down'));
    await expect(service.logout('user-1', 'opaque')).rejects.toThrow('redis down');
  });

  it('should_reject_when_token_not_owned_by_caller', async () => {
    const { service, refreshTokens } = buildAuth();
    refreshTokens.consume.mockResolvedValue({
      id: 'rt',
      userId: 'other-user',
    } as unknown as RefreshToken);
    await expect(service.logout('user-1', 'opaque')).rejects.toThrow(ForbiddenException);
    expect(refreshTokens.revoke).not.toHaveBeenCalled();
  });
});

describe('AuthService.changePassword', () => {
  it('should_reject_same_password', async () => {
    const { service } = buildAuth();
    await expect(
      service.changePassword('user-1', 'samepw123456', 'samepw123456', ctx),
    ).rejects.toThrow(BadRequestException);
  });

  it('should_update_and_revoke_all_tokens', async () => {
    const { service, users, refreshTokens } = buildAuth({ passwordValid: true });
    users.getById.mockResolvedValue(baseUser());
    await service.changePassword('user-1', 'oldOldOld!', 'newNewNew!!!', ctx);
    expect(users.updatePassword).toHaveBeenCalled();
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalled();
  });

  it('should_reject_wrong_old_password', async () => {
    const { service, users } = buildAuth({ passwordValid: false });
    users.getById.mockResolvedValue(baseUser());
    await expect(
      service.changePassword('user-1', 'wrongold!!', 'newNewNew!!!', ctx),
    ).rejects.toThrow(UnauthorizedException);
  });
});
