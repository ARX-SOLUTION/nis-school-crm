export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  /**
   * PARENT is orthogonal to the SUPER_ADMIN > ADMIN > MANAGER > TEACHER
   * hierarchy. Parents access only their own children's data via the parent
   * portal. hasRoleAtLeast() treats PARENT as rank 0 — it satisfies no
   * staff-level permission requirement.
   */
  PARENT = 'PARENT',
}

const HIERARCHY: Record<RoleName, number> = {
  [RoleName.SUPER_ADMIN]: 4,
  [RoleName.ADMIN]: 3,
  [RoleName.MANAGER]: 2,
  [RoleName.TEACHER]: 1,
  // PARENT is outside the staff hierarchy; rank 0 means it cannot satisfy
  // any staff-level role requirement via hasRoleAtLeast().
  [RoleName.PARENT]: 0,
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

/**
 * Which roles can a given role provision via the API?
 * SUPER_ADMIN exists only via seed and is intentionally excluded from every
 * row — it must never be created over the network.
 */
const CREATABLE_BY: Record<RoleName, ReadonlyArray<RoleName>> = {
  [RoleName.SUPER_ADMIN]: [RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER],
  [RoleName.ADMIN]: [RoleName.MANAGER, RoleName.TEACHER],
  [RoleName.MANAGER]: [RoleName.TEACHER],
  [RoleName.TEACHER]: [],
  // PARENT accounts are created via the invite flow, not directly by any role.
  [RoleName.PARENT]: [],
};

export function canCreateRole(actor: RoleName, target: RoleName): boolean {
  return CREATABLE_BY[actor].includes(target);
}

/**
 * Whether `actor` is allowed to manage (edit / soft-delete / reset password)
 * a user with `target` role. Currently identical to `canCreateRole` so the
 * provisioning hierarchy doubles as the management hierarchy. Kept as a
 * separate function so the two policies can diverge later.
 */
export function canManageRole(actor: RoleName, target: RoleName): boolean {
  return canCreateRole(actor, target);
}

/**
 * Narrows a role value to the PARENT role. Use this in guards and services
 * instead of a raw equality check so that refactors (e.g. splitting PARENT
 * into FATHER / MOTHER) only need to touch this one predicate.
 */
export function isParent(role: RoleName): boolean {
  return role === RoleName.PARENT;
}
