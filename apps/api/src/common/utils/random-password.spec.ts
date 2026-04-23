import { generateRandomPassword } from './random-password';

describe('generateRandomPassword', () => {
  it('should_default_to_14_characters', () => {
    expect(generateRandomPassword()).toHaveLength(14);
  });

  it('should_honour_explicit_length', () => {
    expect(generateRandomPassword(20)).toHaveLength(20);
  });

  it('should_throw_when_length_below_eight', () => {
    expect(() => generateRandomPassword(4)).toThrow();
  });

  it('should_include_at_least_one_lower_upper_digit_and_symbol', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateRandomPassword(12);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*()\-_=+]/);
    }
  });

  it('should_produce_distinct_values_across_calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(generateRandomPassword(14));
    expect(set.size).toBe(100);
  });
});
