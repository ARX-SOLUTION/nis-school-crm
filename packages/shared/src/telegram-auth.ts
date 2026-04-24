/**
 * Wire-shape interfaces for the Telegram Login + Parent Portal endpoints.
 *
 * These are pure TypeScript — no class-validator, no runtime code.
 * The backend's NestJS DTOs (apps/api/src/modules/auth/dto/) remain the
 * canonical source of truth for validation rules.
 */

/** Relationship values a parent can have with a student. */
export type ParentRelationship = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

/**
 * Mirrors the payload emitted by the Telegram Login Widget.
 * Field names are snake_case because the HMAC hash was computed over those
 * exact key names — renaming them would break hash verification.
 *
 * Corresponds to backend: TelegramAuthDto
 */
export interface TelegramAuthRequestDto {
  /** Telegram user ID */
  id: number;
  /** Telegram first name (1–64 chars) */
  first_name: string;
  /** Telegram last name (1–64 chars, optional) */
  last_name?: string;
  /** Telegram username (5–32 alphanumeric chars or underscores, optional) */
  username?: string;
  /** URL of the Telegram profile photo (optional) */
  photo_url?: string;
  /** Unix timestamp when the Telegram widget auth was completed */
  auth_date: number;
  /** HMAC-SHA-256 hash — 64 lowercase hex chars */
  hash: string;
}

/**
 * Request body for POST /api/v1/auth/parent/invite.
 * Staff-only (SUPER_ADMIN, ADMIN, MANAGER).
 *
 * Corresponds to backend: CreateParentInviteDto
 */
export interface CreateParentInviteRequestDto {
  /** UUID v4 of the student the parent will be linked to */
  studentId: string;
  /** Human-readable name of the parent being invited (optional, 1–200 chars) */
  parentName?: string;
  /** Relationship of the invited guardian to the student (optional) */
  relationship?: ParentRelationship;
}

/**
 * Request body for POST /api/v1/auth/parent/accept-invite.
 * Public — no JWT required.
 *
 * Corresponds to backend: AcceptParentInviteDto
 */
export interface AcceptParentInviteRequestDto {
  /** Single-use invite token — 64 lowercase hex chars */
  inviteToken: string;
  /** Telegram Login Widget payload for the parent accepting the invite */
  telegramAuthData: TelegramAuthRequestDto;
}

/**
 * Response body for POST /api/v1/auth/parent/invite.
 *
 * Corresponds to backend: ParentInviteResponseDto
 */
export interface ParentInviteResponseDto {
  /** Invite UUID */
  id: string;
  /** Raw invite token — 64 lowercase hex chars. Staff shares this with the parent. */
  token: string;
  /** Full URL the parent should open to accept the invite */
  inviteUrl: string;
  /** UUID of the student this invite links to */
  studentId: string;
  /** Human-readable name of the parent being invited, or null */
  parentName: string | null;
  /** Relationship of the parent to the student, or null */
  relationship: ParentRelationship | null;
  /** When the invite expires (ISO 8601) */
  expiresAt: string;
  /** When the invite was created (ISO 8601) */
  createdAt: string;
}
