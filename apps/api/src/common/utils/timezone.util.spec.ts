import { getCurrentTashkentMonth } from './timezone.util';

describe('getCurrentTashkentMonth', () => {
  it('formats current month as YYYY-MM', () => {
    const month = getCurrentTashkentMonth();
    expect(month).toMatch(/^\d{4}-\d{2}$/);
  });

  it('correctly maps UTC late night to next month in Asia/Tashkent (UTC+5)', () => {
    // 2026-09-30 23:30:00 UTC is 2026-10-01 04:30:00 in Asia/Tashkent
    const lateSeptUtc = new Date('2026-09-30T23:30:00.000Z');
    expect(getCurrentTashkentMonth(lateSeptUtc)).toBe('2026-10');
  });

  it('correctly maps UTC early morning on the 1st to current month in Asia/Tashkent', () => {
    // 2026-10-01 00:30:00 UTC is 2026-10-01 05:30:00 in Asia/Tashkent
    const earlyOctUtc = new Date('2026-10-01T00:30:00.000Z');
    expect(getCurrentTashkentMonth(earlyOctUtc)).toBe('2026-10');
  });

  it('correctly maps end of month UTC evening', () => {
    // 2026-10-31 18:59:00 UTC is 2026-10-31 23:59:00 in Asia/Tashkent
    const octEndUtc = new Date('2026-10-31T18:59:00.000Z');
    expect(getCurrentTashkentMonth(octEndUtc)).toBe('2026-10');

    // 2026-10-31 19:01:00 UTC is 2026-11-01 00:01:00 in Asia/Tashkent
    const novStartUtc = new Date('2026-10-31T19:01:00.000Z');
    expect(getCurrentTashkentMonth(novStartUtc)).toBe('2026-11');
  });
});
