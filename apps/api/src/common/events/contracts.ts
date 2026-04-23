import { RoleName } from '../enums/role.enum';

export const EVENT_USER_CREATED = 'user.created';
export const EVENT_USER_PASSWORD_RESET = 'user.password_reset';

/**
 * Emitted when a new user is provisioned by an admin/manager. The Telegram
 * notification consumer (Stage 6) picks this up to deliver the generated
 * password to the user via bot.
 *
 * SECURITY: `generatedPassword` is in-flight ONLY — never stored in plaintext
 * anywhere in the database. The Pino redactor in `LoggerModule` masks the
 * field name out of any HTTP request/response logs. Any new log sink that
 * serializes this envelope MUST add `generatedPassword` to its redaction set.
 */
export interface UserCreatedEvent {
  userId: string;
  email: string;
  fullName: string;
  role: RoleName;
  telegramUsername: string | null;
  generatedPassword: string;
  createdByUserId: string;
}

/**
 * Emitted when an admin/manager (or the user themselves) resets a password.
 * Distinct from `user.created` so the Stage 6 Telegram consumer picks a
 * different template ("your password was reset" vs "welcome to NIS").
 */
export interface UserPasswordResetEvent {
  userId: string;
  email: string;
  fullName: string;
  role: RoleName;
  telegramUsername: string | null;
  generatedPassword: string;
  resetByUserId: string;
}
