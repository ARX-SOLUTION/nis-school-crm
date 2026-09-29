/**
 * Centralized currency and number formatting utilities for NIS School CRM.
 * Adheres to DESIGN.md and Anti-Slop (R-11) standards:
 * - Uses non-breaking spaces (\u00A0) to prevent line breaks between figures and currency names.
 * - Standardizes on "so'm" across all views.
 * - Provides verbal Uzbek approximations for zero-miscount prevention in cash entry.
 */

const NBSP = '\u00A0';

/**
 * Formats a monetary amount into Uzbek So'm with non-breaking thousand separators.
 * Example: 2500000 -> "2 500 000 so'm"
 */
export function formatUzbekSum(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return `0${NBSP}so'm`;
  }
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return `0${NBSP}so'm`;
  }

  const rounded = Math.round(numeric);
  const formattedNumber = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

  return `${formattedNumber}${NBSP}so'm`;
}

/**
 * Formats numbers into a compact, human-readable summary for dashboards and charts.
 * Example: 1500000 -> "1.5 mln so'm", 450000 -> "450 ming so'm"
 */
export function formatCompactSum(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return `0${NBSP}so'm`;
  }
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return `0${NBSP}so'm`;
  }

  const abs = Math.abs(numeric);
  const sign = numeric < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${val}${NBSP}mlrd${NBSP}so'm`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${val}${NBSP}mln${NBSP}so'm`;
  }
  if (abs >= 10_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}${val}${NBSP}ming${NBSP}so'm`;
  }

  return formatUzbekSum(numeric);
}

/**
 * Translates integer amounts to verbal Uzbek description.
 * Helps prevent clerical errors where cashiers enter an extra zero (e.g. 25,000,000 vs 2,500,000).
 */
export function describeSumUzbek(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(num) || num <= 0) return '';

  const rounded = Math.floor(num);
  const billions = Math.floor(rounded / 1_000_000_000);
  const millions = Math.floor((rounded % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1_000);
  const remainder = rounded % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(`${billions} milliard`);
  }
  if (millions > 0) {
    parts.push(`${millions} million`);
  }
  if (thousands > 0) {
    parts.push(`${thousands} ming`);
  }
  if (remainder > 0 && parts.length === 0) {
    parts.push(`${remainder}`);
  } else if (remainder > 0) {
    parts.push(`${remainder}`);
  }

  if (parts.length === 0) return '';
  return `${parts.join(' ')} so'm`;
}
