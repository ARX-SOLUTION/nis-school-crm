import { createHash, createHmac } from 'crypto';
import type { TelegramAuthPayload } from '../../src/modules/auth/services/telegram-auth.service';

/**
 * Replicates the Telegram Login Widget hash algorithm exactly as implemented
 * in TelegramAuthService.verifyHash. Tests that use this function can produce
 * payloads that will pass server-side verification.
 *
 * Algorithm (https://core.telegram.org/widgets/login):
 *   1. Build dataCheckString from all non-null/undefined fields except `hash`,
 *      sorted alphabetically, joined by '\n' as "key=value".
 *   2. secretKey = SHA-256(botToken) as raw bytes.
 *   3. hash = HMAC-SHA-256(dataCheckString, secretKey) as hex.
 *
 * IMPORTANT: If TelegramAuthService.verifyHash changes its algorithm, this
 * function must be updated in lockstep — otherwise e2e payloads become useless.
 */
export function signTelegramPayload(
  botToken: string,
  fields: Omit<TelegramAuthPayload, 'hash'>,
): TelegramAuthPayload {
  const dataCheckString = (Object.entries(fields) as [string, string | number | undefined][])
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return { ...fields, hash };
}
