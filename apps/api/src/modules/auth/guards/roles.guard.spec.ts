import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

const makeContext = (user: { role: RoleName } | undefined): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

const makeReflector = (roles: RoleName[] | undefined): Reflector =>
  ({ getAllAndOverride: jest.fn().mockReturnValue(roles) }) as unknown as Reflector;

describe('RolesGuard', () => {
  it('should_allow_when_no_roles_required', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeContext({ role: RoleName.TEACHER }))).toBe(true);
  });

  it('should_allow_when_user_meets_role', () => {
    const guard = new RolesGuard(makeReflector([RoleName.MANAGER]));
    expect(guard.canActivate(makeContext({ role: RoleName.ADMIN }))).toBe(true);
  });

  it('should_throw_forbidden_when_user_role_too_low', () => {
    const guard = new RolesGuard(makeReflector([RoleName.ADMIN]));
    expect(() => guard.canActivate(makeContext({ role: RoleName.TEACHER }))).toThrow(
      ForbiddenException,
    );
  });

  it('should_throw_forbidden_when_no_user', () => {
    const guard = new RolesGuard(makeReflector([RoleName.TEACHER]));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });

  it('should_use_metadata_key_for_lookup', () => {
    const reflector = makeReflector([RoleName.ADMIN]);
    const guard = new RolesGuard(reflector);
    guard.canActivate(makeContext({ role: RoleName.SUPER_ADMIN }));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [undefined, undefined]);
  });
});
