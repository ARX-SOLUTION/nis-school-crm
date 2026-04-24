import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramAuthPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class TelegramAuthService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Implements the Telegram Login Widget hash verification algorithm exactly
   * as specified in https://core.telegram.org/widgets/login:
   *
   * 1. Build dataCheckString from all payload fields except `hash`, filtering
   *    undefined/null values, sorted alphabetically, joined by '\n' as "key=value".
   * 2. secretKey = SHA-256(botToken) — raw bytes.
   * 3. expectedHash = HMAC-SHA-256(dataCheckString, secretKey) as hex.
   * 4. Constant-time compare against payload.hash via crypto.timingSafeEqual.
   */
  verifyHash(payload: TelegramAuthPayload): boolean {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new ServiceUnavailableException('Telegram login is disabled on this instance');
    }

    const { hash, ...fields } = payload;

    // Build the data check string: key=value pairs, sorted, undefined/null excluded.
    const dataCheckString = (Object.entries(fields) as [string, string | number | undefined][])
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('\n');

    // secretKey = SHA256(botToken) as raw Buffer — not hex.
    const secretKey = createHash('sha256').update(botToken).digest();

    const expectedHashHex = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // crypto.timingSafeEqual requires equal-length Buffers.
    // If lengths differ (should not happen for hex), return false immediately
    // to avoid the Buffer allocation exception without leaking timing.
    const expectedBuf = Buffer.from(expectedHashHex, 'utf8');
    const receivedBuf = Buffer.from(hash, 'utf8');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, receivedBuf);
  }

  /**
   * Full validation: verifies the HMAC hash, then checks that auth_date is
   * within the last 24 hours to defeat replay attacks.
   *
   * Throws UnauthorizedException with distinct messages so server logs can
   * distinguish hash failures from stale sessions, while the HTTP status code
   * (401) remains the same to the caller.
   *
   * Throws ServiceUnavailableException if TELEGRAM_BOT_TOKEN is unset.
   */
  validate(payload: TelegramAuthPayload): TelegramAuthPayload {
    if (!this.verifyHash(payload)) {
      throw new UnauthorizedException('Invalid Telegram hash');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = nowSeconds - payload.auth_date;
    if (ageSeconds > 86400) {
      throw new UnauthorizedException('Telegram auth data has expired');
    }

    return payload;
  }
}
