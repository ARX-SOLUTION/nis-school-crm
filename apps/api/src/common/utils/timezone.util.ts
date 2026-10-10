/**
 * Utility functions for timezone-aware date handling in NIS School CRM.
 * Primary operational timezone is Asia/Tashkent (UTC+5).
 */

/**
 * Returns month string in YYYY-MM format formatted for Asia/Tashkent timezone.
 * Defaults to current timestamp if date is omitted.
 *
 * Example: '2026-10'
 */
export function getCurrentTashkentMonth(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
  }).format(date);
}
