export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
}

const HIERARCHY: Record<RoleName, number> = {
  [RoleName.SUPER_ADMIN]: 4,
  [RoleName.ADMIN]: 3,
  [RoleName.MANAGER]: 2,
  [RoleName.TEACHER]: 1,
};

/**
 * Returns true if `userRole` is at or above any of the `requiredRoles`.
 * Higher roles inherit the permissions of all lower roles.
 */
export function hasRoleAtLeast(userRole: RoleName, requiredRoles: RoleName[]): boolean {
  if (requiredRoles.length === 0) return true;
  const userLevel = HIERARCHY[userRole];
  return requiredRoles.some((r) => userLevel >= HIERARCHY[r]);
}
