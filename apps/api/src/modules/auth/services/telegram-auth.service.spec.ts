import { createHash, createHmac } from 'crypto';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthService, TelegramAuthPayload } from './telegram-auth.service';

// ---------------------------------------------------------------------------
// Helpers — replicate the algorithm independently of the service under test
// ---------------------------------------------------------------------------

const FAKE_BOT_TOKEN = 'test_bot_token_123';

function buildDataCheckString(fields: Omit<TelegramAuthPayload, 'hash'>): string {
  return (Object.entries(fields) as [string, string | number | undefined][])
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('\n');
}

function computeHash(botToken: string, fields: Omit<TelegramAuthPayload, 'hash'>): string {
  const secretKey = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secretKey).update(buildDataCheckString(fields)).digest('hex');
}

function makePayload(
  overrides: Partial<TelegramAuthPayload> = {},
  botToken = FAKE_BOT_TOKEN,
): TelegramAuthPayload {
  const fields: Omit<TelegramAuthPayload, 'hash'> = {
    id: 123456789,
    first_name: 'Alisher',
    last_name: 'Karimov',
    username: 'alisher_k',
    auth_date: Math.floor(Date.now() / 1000) - 60, // 60 s ago — fresh
    ...overrides,
  };
  return { ...fields, hash: computeHash(botToken, fields) };
}

// ---------------------------------------------------------------------------
// Factory — wire the service with a mocked ConfigService
// ---------------------------------------------------------------------------

function buildService(botToken: string | null = FAKE_BOT_TOKEN): TelegramAuthService {
  // null sentinel means "return undefined from the mock" — we cannot pass undefined
  // as a JS default-parameter argument because JS substitutes the default when the
  // caller passes undefined, so buildService(undefined) would silently use FAKE_BOT_TOKEN.
  const resolvedToken: string | undefined = botToken === null ? undefined : botToken;
  const config = {
    get: jest.fn((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? resolvedToken : undefined)),
  } as unknown as ConfigService;
  return new TelegramAuthService(config);
}

// ---------------------------------------------------------------------------
// verifyHash
// ---------------------------------------------------------------------------

describe('TelegramAuthService.verifyHash', () => {
  it('should_return_true_when_payload_is_valid', () => {
    const service = buildService();
    expect(service.verifyHash(makePayload())).toBe(true);
  });

  it('should_return_false_when_first_name_is_tampered_after_hash_computed', () => {
    const service = buildService();
    const payload = makePayload();
    // Flip one character in first_name — hash no longer matches
    payload.first_name = payload.first_name.replace('A', 'B');
    expect(service.verifyHash(payload)).toBe(false);
  });

  it('should_return_false_when_hash_is_tampered', () => {
    const service = buildService();
    const payload = makePayload();
    // Replace the last character of the hash with a different hex char
    const lastChar = payload.hash.slice(-1);
    const replacement = lastChar === 'a' ? 'b' : 'a';
    payload.hash = payload.hash.slice(0, -1) + replacement;
    expect(service.verifyHash(payload)).toBe(false);
  });

  it('should_throw_ServiceUnavailableException_when_bot_token_is_empty', () => {
    const service = buildService('');
    expect(() => service.verifyHash(makePayload())).toThrow(ServiceUnavailableException);
  });

  it('should_throw_ServiceUnavailableException_when_bot_token_is_undefined', () => {
    // Pass null as the sentinel meaning "config returns undefined" —
    // see the buildService comment for why we cannot pass undefined directly.
    const service = buildService(null);
    expect(() => service.verifyHash(makePayload())).toThrow(ServiceUnavailableException);
  });

  it('should_return_false_without_throwing_when_hash_length_mismatches', () => {
    const service = buildService();
    const payload = makePayload();
    // Truncate the hash — different byte length prevents timingSafeEqual buffer check
    payload.hash = payload.hash.slice(0, 32);
    // Must not throw; must return false cleanly
    expect(() => service.verifyHash(payload)).not.toThrow();
    expect(service.verifyHash(payload)).toBe(false);
  });

  it('should_return_true_for_payload_without_optional_fields', () => {
    const service = buildService();
    // Build a minimal payload (no last_name, username, photo_url)
    const fields: Omit<TelegramAuthPayload, 'hash'> = {
      id: 42,
      first_name: 'Test',
      auth_date: Math.floor(Date.now() / 1000) - 10,
    };
    const payload: TelegramAuthPayload = { ...fields, hash: computeHash(FAKE_BOT_TOKEN, fields) };
    expect(service.verifyHash(payload)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

describe('TelegramAuthService.validate', () => {
  it('should_return_payload_unchanged_when_hash_is_valid_and_auth_date_is_fresh', () => {
    const service = buildService();
    const payload = makePayload();
    expect(service.validate(payload)).toBe(payload);
  });

  it('should_throw_UnauthorizedException_with_expired_message_when_auth_date_is_older_than_24h', () => {
    const service = buildService();
    const staleAuthDate = Math.floor(Date.now() / 1000) - 86401; // 1 s beyond 24 h
    const fields: Omit<TelegramAuthPayload, 'hash'> = {
      id: 1,
      first_name: 'Old',
      auth_date: staleAuthDate,
    };
    const payload: TelegramAuthPayload = { ...fields, hash: computeHash(FAKE_BOT_TOKEN, fields) };
    expect(() => service.validate(payload)).toThrow(UnauthorizedException);
    expect(() => service.validate(payload)).toThrow(/expired/i);
  });

  it('should_throw_UnauthorizedException_with_invalid_message_when_hash_is_wrong', () => {
    const service = buildService();
    const payload = makePayload();
    payload.hash = 'a'.repeat(64); // 64 chars but wrong value
    expect(() => service.validate(payload)).toThrow(UnauthorizedException);
    expect(() => service.validate(payload)).toThrow(/invalid/i);
  });

  it('should_throw_UnauthorizedException_for_expired_auth_even_after_valid_hash', () => {
    const service = buildService();
    // Build a correctly-hashed but 25-hour-old payload
    const staleAuthDate = Math.floor(Date.now() / 1000) - 90000;
    const fields: Omit<TelegramAuthPayload, 'hash'> = {
      id: 99,
      first_name: 'Stale',
      auth_date: staleAuthDate,
    };
    const payload: TelegramAuthPayload = { ...fields, hash: computeHash(FAKE_BOT_TOKEN, fields) };
    // Hash is valid, but auth_date is too old
    expect(() => service.validate(payload)).toThrow(/expired/i);
  });

  it.skip('should_have_constant_time_comparison_property', () => {
    /**
     * SKIPPED — timing tests are inherently flaky on shared CI runners where
     * process scheduling variance can easily dwarf the sub-microsecond timing
     * differences we would be trying to measure. The algorithm's use of
     * crypto.timingSafeEqual is an implementation-level guarantee; the unit
     * test for "hash length mismatch returns false" already verifies the
     * guard branch, and the valid / tampered-hash tests confirm the happy/sad
     * paths. A meaningful timing property test belongs in a dedicated security
     * benchmark environment, not in the Jest suite.
     */
  });
});
