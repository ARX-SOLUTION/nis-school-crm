export const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

const HIERARCHY: Record<RoleName, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  TEACHER: 1,
};

/**
 * Returns true if `userRole` is at or above ANY of the `requiredRoles`.
 * Used as an OR check — when a guard says `@Roles(ADMIN, MANAGER)` it grants
 * access to anyone whose role is ≥ ADMIN OR ≥ MANAGER. An empty `requiredRoles`
 * is treated as "no role requirement" (returns true). For AND semantics across
 * orthogonal permissions, use a different abstraction.
 */
export function hasRoleAtLeast(userRole: RoleName, requiredRoles: RoleName[]): boolean {
  if (requiredRoles.length === 0) return true;
  const userLevel = HIERARCHY[userRole];
  return requiredRoles.some((r) => userLevel >= HIERARCHY[r]);
}
