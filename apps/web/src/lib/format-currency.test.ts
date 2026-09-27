import { describe, it, expect } from 'vitest';
import { formatUzbekSum, formatCompactSum, describeSumUzbek } from './format-currency';

describe('format-currency utility', () => {
  describe('formatUzbekSum', () => {
    it("formats thousands with non-breaking space and so'm suffix", () => {
      expect(formatUzbekSum(2500000)).toBe("2\u00A0500\u00A0000\u00A0so'm");
      expect(formatUzbekSum(1000)).toBe("1\u00A0000\u00A0so'm");
      expect(formatUzbekSum(500)).toBe("500\u00A0so'm");
    });

    it('handles zero and nullish values gracefully', () => {
      expect(formatUzbekSum(0)).toBe("0\u00A0so'm");
      expect(formatUzbekSum(null)).toBe("0\u00A0so'm");
      expect(formatUzbekSum(undefined)).toBe("0\u00A0so'm");
      expect(formatUzbekSum('')).toBe("0\u00A0so'm");
    });

    it('handles string numbers correctly', () => {
      expect(formatUzbekSum('1800000')).toBe("1\u00A0800\u00A0000\u00A0so'm");
    });
  });

  describe('formatCompactSum', () => {
    it('formats millions and billions in readable compact form', () => {
      expect(formatCompactSum(2500000)).toBe("2.5\u00A0mln\u00A0so'm");
      expect(formatCompactSum(1000000)).toBe("1\u00A0mln\u00A0so'm");
      expect(formatCompactSum(1500000000)).toBe("1.5\u00A0mlrd\u00A0so'm");
      expect(formatCompactSum(450000)).toBe("450\u00A0ming\u00A0so'm");
      expect(formatCompactSum(5000)).toBe("5\u00A0000\u00A0so'm");
    });
  });

  describe('describeSumUzbek', () => {
    it('describes standard sums in verbal Uzbek for zero-miscount prevention', () => {
      expect(describeSumUzbek(2500000)).toBe("2 million 500 ming so'm");
      expect(describeSumUzbek(25000000)).toBe("25 million so'm");
      expect(describeSumUzbek(1000000)).toBe("1 million so'm");
      expect(describeSumUzbek(350000)).toBe("350 ming so'm");
    });

    it('returns empty string for zero or negative', () => {
      expect(describeSumUzbek(0)).toBe('');
      expect(describeSumUzbek(-100)).toBe('');
    });
  });
});
