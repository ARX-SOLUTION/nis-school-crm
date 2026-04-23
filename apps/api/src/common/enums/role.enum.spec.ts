import { canCreateRole, RoleName, hasRoleAtLeast } from './role.enum';

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

describe('canCreateRole', () => {
  it('should_let_super_admin_create_any_lower_role', () => {
    expect(canCreateRole(RoleName.SUPER_ADMIN, RoleName.ADMIN)).toBe(true);
    expect(canCreateRole(RoleName.SUPER_ADMIN, RoleName.MANAGER)).toBe(true);
    expect(canCreateRole(RoleName.SUPER_ADMIN, RoleName.TEACHER)).toBe(true);
  });

  it('should_never_let_anyone_create_super_admin', () => {
    expect(canCreateRole(RoleName.SUPER_ADMIN, RoleName.SUPER_ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.ADMIN, RoleName.SUPER_ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.MANAGER, RoleName.SUPER_ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.TEACHER, RoleName.SUPER_ADMIN)).toBe(false);
  });

  it('should_let_admin_create_only_manager_or_teacher', () => {
    expect(canCreateRole(RoleName.ADMIN, RoleName.ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.ADMIN, RoleName.MANAGER)).toBe(true);
    expect(canCreateRole(RoleName.ADMIN, RoleName.TEACHER)).toBe(true);
  });

  it('should_let_manager_create_only_teacher', () => {
    expect(canCreateRole(RoleName.MANAGER, RoleName.ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.MANAGER, RoleName.MANAGER)).toBe(false);
    expect(canCreateRole(RoleName.MANAGER, RoleName.TEACHER)).toBe(true);
  });

  it('should_let_teacher_create_nothing', () => {
    expect(canCreateRole(RoleName.TEACHER, RoleName.ADMIN)).toBe(false);
    expect(canCreateRole(RoleName.TEACHER, RoleName.MANAGER)).toBe(false);
    expect(canCreateRole(RoleName.TEACHER, RoleName.TEACHER)).toBe(false);
  });
});
