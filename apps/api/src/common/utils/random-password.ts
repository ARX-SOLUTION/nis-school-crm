import { randomBytes } from 'crypto';

const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+';
const ALPHABET = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

/**
 * Generate a cryptographically random password using `crypto.randomBytes`
 * (rejection-sampled to avoid modulo bias). Default length is 14 to give
 * comfortable margin over the policy minimum (12).
 *
 * Guarantees at least one character from each of {lower, upper, digit,
 * symbol} so the result satisfies common composition rules out of the box.
 */
export function generateRandomPassword(length = 14): string {
  if (length < 8) {
    throw new Error('Password length must be at least 8');
  }

  // Required-class characters first.
  const required = [
    pickRandom(LOWERCASE),
    pickRandom(UPPERCASE),
    pickRandom(DIGITS),
    pickRandom(SYMBOLS),
  ];

  const remaining: string[] = [];
  while (remaining.length < length - required.length) {
    remaining.push(pickRandom(ALPHABET));
  }

  // Fisher-Yates shuffle so the required chars aren't always at the front.
  const all = [...required, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = pickRandomInt(i + 1);
    const tmp = all[i] as string;
    all[i] = all[j] as string;
    all[j] = tmp;
  }
  return all.join('');
}

function pickRandom(set: string): string {
  return set.charAt(pickRandomInt(set.length));
}

function pickRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0');
  // Rejection sampling against the largest multiple of maxExclusive that
  // fits in a 32-bit unsigned integer to avoid modulo bias.
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  while (true) {
    const value = randomBytes(4).readUInt32BE(0);
    if (value < limit) return value % maxExclusive;
  }
}
