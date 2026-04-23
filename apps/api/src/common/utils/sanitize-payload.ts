const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'refreshToken',
  'accessToken',
  'token',
  'generatedPassword',
  'authorization',
]);

/**
 * Deep-clone a payload while stripping sensitive keys at any depth. Used by
 * the AuditInterceptor before the envelope hits the queue so nothing
 * sensitive ever reaches the audit log or DLQ.
 */
export function sanitizePayload(input: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 6 || input === null || typeof input !== 'object') return null;
  if (Array.isArray(input)) {
    return { _array: input.map((v) => sanitizeValue(v, depth + 1)) };
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    out[key] = sanitizeValue(value, depth + 1);
  }
  return out;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, depth + 1));
  return sanitizePayload(value, depth);
}
