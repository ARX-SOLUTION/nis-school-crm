import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../../common/enums/role.enum';
import { ALLOW_ANY_ROLE_KEY } from '../decorators/authenticated.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
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

const makeReflector = (
  roles: RoleName[] | undefined,
  isPublic = false,
  allowAnyRole = false,
): Reflector =>
  ({
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === ALLOW_ANY_ROLE_KEY) return allowAnyRole;
      if (key === ROLES_KEY) return roles;
      return undefined;
    }),
  }) as unknown as Reflector;

describe('RolesGuard', () => {
  it('should_allow_when_public_even_without_user', () => {
    const guard = new RolesGuard(makeReflector(undefined, true));
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('should_allow_any_authenticated_role_when_ALLOW_ANY_ROLE_is_set (DEF-09)', () => {
    const guard = new RolesGuard(makeReflector(undefined, false, true));
    expect(guard.canActivate(makeContext({ role: RoleName.PARENT }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: RoleName.TEACHER }))).toBe(true);
  });

  it('should_allow_parent_when_PARENT_role_explicitly_included_in_Roles (DEF-09)', () => {
    const guard = new RolesGuard(
      makeReflector(
        [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER, RoleName.PARENT],
        false,
        false,
      ),
    );
    expect(guard.canActivate(makeContext({ role: RoleName.PARENT }))).toBe(true);
  });

  it('should_allow_staff_when_no_roles_required', () => {
    const guard = new RolesGuard(makeReflector(undefined, false, false));
    expect(guard.canActivate(makeContext({ role: RoleName.TEACHER }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: RoleName.MANAGER }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: RoleName.ADMIN }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: RoleName.SUPER_ADMIN }))).toBe(true);
  });

  it('should_throw_forbidden_when_parent_accesses_unadorned_route', () => {
    const guard = new RolesGuard(makeReflector(undefined, false, false));
    expect(() => guard.canActivate(makeContext({ role: RoleName.PARENT }))).toThrow(
      ForbiddenException,
    );
  });

  it('should_allow_when_user_meets_role', () => {
    const guard = new RolesGuard(makeReflector([RoleName.MANAGER], false, false));
    expect(guard.canActivate(makeContext({ role: RoleName.ADMIN }))).toBe(true);
  });

  it('should_throw_forbidden_when_user_role_too_low', () => {
    const guard = new RolesGuard(makeReflector([RoleName.ADMIN], false, false));
    expect(() => guard.canActivate(makeContext({ role: RoleName.TEACHER }))).toThrow(
      ForbiddenException,
    );
  });

  it('should_throw_forbidden_when_no_user', () => {
    const guard = new RolesGuard(makeReflector([RoleName.TEACHER], false, false));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });

  it('should_use_metadata_key_for_lookup', () => {
    const reflector = makeReflector([RoleName.ADMIN], false, false);
    const guard = new RolesGuard(reflector);
    guard.canActivate(makeContext({ role: RoleName.SUPER_ADMIN }));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [undefined, undefined]);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [undefined, undefined]);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ALLOW_ANY_ROLE_KEY, [
      undefined,
      undefined,
    ]);
  });
});
