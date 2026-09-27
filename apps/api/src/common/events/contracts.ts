import { RoleName } from '../enums/role.enum';

export const EVENT_USER_CREATED = 'user.created';
export const EVENT_USER_PASSWORD_RESET = 'user.password_reset';
export const EVENT_AUDIT_WRITE = 'audit.write';
export const EVENT_ATTENDANCE_RECORDED = 'attendance.recorded';
export const EVENT_GRADE_RECORDED = 'grade.recorded';
export const EVENT_PAYMENT_RECORDED = 'payment.recorded';
export const EVENT_BROADCAST_ANNOUNCEMENT = 'broadcast.announcement';

/**
 * Emitted by the AuditInterceptor after a mutating HTTP request. Consumed by
 * AuditConsumer which persists the row to `audit_logs`. Sensitive fields
 * (`password`, `passwordHash`, `refreshToken`, `generatedPassword`,
 * `accessToken`, `token`) are stripped at interceptor time so the event
 * payload is safe to sink anywhere.
 */
export interface AuditWriteEvent {
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  statusCode: number;
}

/**
 * Emitted when a new user is provisioned by an admin/manager. The Telegram
 * notification consumer (Stage 6) picks this up to deliver the generated
 * password to the user via bot.
 *
 * SECURITY: `generatedPassword` is in-flight ONLY - never stored in plaintext
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

export interface AttendanceRecordedEvent {
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  date: string;
  status: string;
  remarks?: string | null;
}

export interface GradeRecordedEvent {
  studentId: string;
  studentName: string;
  subjectName: string;
  score: number;
  maxScore: number;
  gradeType: string;
  date: string;
  comment?: string | null;
}

export interface PaymentRecordedEvent {
  studentId: string;
  studentName: string;
  amount: number;
  method: string;
  receiptNumber: string;
  month: string;
  paidAt: string | Date;
}

export interface BroadcastAnnouncementEvent {
  title: string;
  message: string;
  target: string;
  classId?: string;
  sentByUserId?: string;
}
