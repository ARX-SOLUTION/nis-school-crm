import { RoleName, hasRoleAtLeast } from './role.enum';

describe('hasRoleAtLeast', () => {
  it('should_grant_access_when_no_roles_required', () => {
    expect(hasRoleAtLeast(RoleName.TEACHER, [])).toBe(true);
  });

  it('should_grant_super_admin_for_every_required_role', () => {
    expect(hasRoleAtLeast(RoleName.SUPER_ADMIN, [RoleName.TEACHER])).toBe(true);
    expect(hasRoleAtLeast(RoleName.SUPER_ADMIN, [RoleName.MANAGER])).toBe(true);
    expect(hasRoleAtLeast(RoleName.SUPER_ADMIN, [RoleName.ADMIN])).toBe(true);
  });

  it('should_grant_admin_for_manager_or_teacher', () => {
    expect(hasRoleAtLeast(RoleName.ADMIN, [RoleName.MANAGER])).toBe(true);
    expect(hasRoleAtLeast(RoleName.ADMIN, [RoleName.TEACHER])).toBe(true);
  });

  it('should_deny_teacher_when_admin_required', () => {
    expect(hasRoleAtLeast(RoleName.TEACHER, [RoleName.ADMIN])).toBe(false);
  });

  it('should_deny_manager_when_admin_required', () => {
    expect(hasRoleAtLeast(RoleName.MANAGER, [RoleName.ADMIN])).toBe(false);
  });
});
