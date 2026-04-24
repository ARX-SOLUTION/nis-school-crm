export const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER', 'PARENT'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

/**
 * Staff roles that participate in the linear hierarchy.
 * PARENT is intentionally excluded — it is orthogonal to the staff chain.
 */
export const STAFF_ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] as const;
export type StaffRoleName = (typeof STAFF_ROLE_NAMES)[number];

/**
 * Rank map covers only staff roles. PARENT has no rank in the staff hierarchy
 * and therefore cannot satisfy any staff-level permission requirement through
 * hasRoleAtLeast().
 */
const HIERARCHY: Record<StaffRoleName, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  TEACHER: 1,
};

/**
 * Returns true if `userRole` is at or above ANY of the `requiredRoles`.
 * Used as an OR check — when a guard says `@Roles(ADMIN, MANAGER)` it grants
 * access to anyone whose role is >= ADMIN OR >= MANAGER.
 *
 * PARENT always returns false because it sits outside the staff hierarchy
 * (rank 0 satisfies no staff-level requirement).  An empty `requiredRoles`
 * is treated as "no requirement" (returns true).
 */
export function hasRoleAtLeast(userRole: RoleName, requiredRoles: RoleName[]): boolean {
  if (requiredRoles.length === 0) return true;
  if (userRole === 'PARENT') return false;
  const userLevel = HIERARCHY[userRole as StaffRoleName];
  return requiredRoles.some((r) => {
    if (r === 'PARENT') return false;
    return userLevel >= HIERARCHY[r as StaffRoleName];
  });
}

/**
 * Narrows a role value to the PARENT role. Use this in guards and services
 * instead of a raw equality check so that refactors (e.g. splitting PARENT
 * into sub-roles) only need to touch this one predicate.
 */
export function isParent(role: RoleName): boolean {
  return role === 'PARENT';
}
