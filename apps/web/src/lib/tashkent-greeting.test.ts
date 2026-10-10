import { describe, expect, it } from 'vitest';
import { getTashkentGreeting } from './tashkent-greeting';

describe('getTashkentGreeting', () => {
  it('returns Xayrli tong between 05:00 and 11:59 Tashkent time', () => {
    // 05:30 Tashkent time (UTC+5) is 00:30 UTC
    const morning = new Date('2026-10-04T00:30:00.000Z');
    expect(getTashkentGreeting(morning)).toBe('Xayrli tong');

    // 11:59 Tashkent time is 06:59 UTC
    const lateMorning = new Date('2026-10-04T06:59:00.000Z');
    expect(getTashkentGreeting(lateMorning)).toBe('Xayrli tong');
  });

  it('returns Xayrli kun between 12:00 and 17:59 Tashkent time', () => {
    // 12:00 Tashkent time is 07:00 UTC
    const noon = new Date('2026-10-04T07:00:00.000Z');
    expect(getTashkentGreeting(noon)).toBe('Xayrli kun');

    // 17:45 Tashkent time is 12:45 UTC
    const afternoon = new Date('2026-10-04T12:45:00.000Z');
    expect(getTashkentGreeting(afternoon)).toBe('Xayrli kun');
  });

  it('returns Xayrli kech between 18:00 and 04:59 Tashkent time', () => {
    // 18:00 Tashkent time is 13:00 UTC
    const evening = new Date('2026-10-04T13:00:00.000Z');
    expect(getTashkentGreeting(evening)).toBe('Xayrli kech');

    // 23:30 Tashkent time is 18:30 UTC
    const night = new Date('2026-10-04T18:30:00.000Z');
    expect(getTashkentGreeting(night)).toBe('Xayrli kech');

    // 04:30 Tashkent time is 23:30 UTC previous day
    const earlyMorning = new Date('2026-10-03T23:30:00.000Z');
    expect(getTashkentGreeting(earlyMorning)).toBe('Xayrli kech');
  });

  it('handles invalid Date and undefined gracefully without throwing', () => {
    // Invalid date object
    const invalidDate = new Date('not-a-valid-date');
    const greeting = getTashkentGreeting(invalidDate);
    expect(['Xayrli tong', 'Xayrli kun', 'Xayrli kech']).toContain(greeting);

    // Call without parameters
    const defaultGreeting = getTashkentGreeting();
    expect(['Xayrli tong', 'Xayrli kun', 'Xayrli kech']).toContain(defaultGreeting);
  });
});
