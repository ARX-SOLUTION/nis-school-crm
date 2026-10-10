import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ALLOW_ANY_ROLE_KEY } from './decorators/authenticated.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import { ParentInviteService } from '../parents/services/parent-invite.service';
import { TelegramLoginRateLimitService } from './services/telegram-login-rate-limit.service';
import { TelegramLoginService } from './services/telegram-login.service';
import { FeatureFlagsService } from './services/feature-flags.service';
import { AuthenticatedUser } from './types/authenticated-user';

describe('AuthController (Self-Service & Parent Access - DEF-09)', () => {
  let controller: AuthController;
  let mockAuthService: {
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    changePassword: jest.Mock;
  };
  let mockUsersService: {
    getById: jest.Mock;
    update: jest.Mock;
  };
  const reflector = new Reflector();

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
    };

    mockUsersService = {
      getById: jest.fn().mockResolvedValue({
        id: 'parent-user-1',
        email: 'parent@example.com',
        fullName: 'Parent User',
        role: RoleName.PARENT,
        isActive: true,
        notificationPrefs: {},
      }),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TelegramLoginService, useValue: {} },
        { provide: TelegramLoginRateLimitService, useValue: {} },
        { provide: ParentInviteService, useValue: {} },
        {
          provide: FeatureFlagsService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true) },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('GET /auth/me for PARENT users (DEF-09)', () => {
    it('allows PARENT user to retrieve their own profile', async () => {
      const parentUser: AuthenticatedUser = {
        id: 'parent-user-1',
        email: 'parent@example.com',
        role: RoleName.PARENT,
      };

      const result = await controller.me(parentUser);
      expect(result).toBeDefined();
      expect(result.id).toBe('parent-user-1');
      expect(result.role).toBe(RoleName.PARENT);
      expect(mockUsersService.getById).toHaveBeenCalledWith('parent-user-1');
    });

    it('has @Roles containing PARENT and @Authenticated metadata on me endpoint', () => {
      const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.me);
      expect(roles).toContain(RoleName.PARENT);

      const isAuth = reflector.get<boolean>(ALLOW_ANY_ROLE_KEY, controller.me);
      expect(isAuth).toBe(true);
    });
  });

  describe('POST /auth/logout for PARENT users (DEF-09)', () => {
    it('allows PARENT user to log out', async () => {
      const parentUser: AuthenticatedUser = {
        id: 'parent-user-1',
        email: 'parent@example.com',
        role: RoleName.PARENT,
      };

      await controller.logout({ refreshToken: 'some-token' }, parentUser);
      expect(mockAuthService.logout).toHaveBeenCalledWith('parent-user-1', 'some-token');
    });

    it('has @Roles containing PARENT and @Authenticated metadata on logout endpoint', () => {
      const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.logout);
      expect(roles).toContain(RoleName.PARENT);

      const isAuth = reflector.get<boolean>(ALLOW_ANY_ROLE_KEY, controller.logout);
      expect(isAuth).toBe(true);
    });
  });

  describe('Other self-service endpoints have PARENT role included (DEF-09)', () => {
    it('has PARENT in change-password, updatePrefs, and telegramLink', () => {
      for (const handler of [
        controller.changePassword,
        controller.updatePrefs,
        controller.telegramLink,
      ]) {
        const roles = reflector.get<RoleName[]>(ROLES_KEY, handler);
        expect(roles).toContain(RoleName.PARENT);

        const isAuth = reflector.get<boolean>(ALLOW_ANY_ROLE_KEY, handler);
        expect(isAuth).toBe(true);
      }
    });
  });
});
