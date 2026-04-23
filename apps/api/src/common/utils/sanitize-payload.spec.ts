import { sanitizePayload } from './sanitize-payload';

describe('sanitizePayload', () => {
  it('should_return_null_for_non_object', () => {
    expect(sanitizePayload(null)).toBeNull();
    expect(sanitizePayload(undefined)).toBeNull();
    expect(sanitizePayload('foo')).toBeNull();
    expect(sanitizePayload(42)).toBeNull();
  });

  it('should_strip_password_family_at_top_level', () => {
    const out = sanitizePayload({
      email: 'a@x.com',
      password: 'secret',
      oldPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'new',
    });
    expect(out).toEqual({ email: 'a@x.com' });
  });

  it('should_strip_token_family_at_top_level', () => {
    const out = sanitizePayload({
      refreshToken: 'r',
      accessToken: 'a',
      token: 't',
      generatedPassword: 'g',
      userId: 'u-1',
    });
    expect(out).toEqual({ userId: 'u-1' });
  });

  it('should_strip_sensitive_keys_at_any_depth', () => {
    const out = sanitizePayload({
      user: { id: 'u', password: 'secret', profile: { refreshToken: 'r' } },
      items: [{ password: 's', name: 'x' }],
    });
    expect(out).toMatchObject({ user: { id: 'u', profile: {} } });
    const items = (out as { items: Array<{ password?: string; name?: string }> }).items;
    expect(items[0]?.password).toBeUndefined();
    expect(items[0]?.name).toBe('x');
  });

  it('should_wrap_top_level_array_under_underscore_array', () => {
    const out = sanitizePayload([{ password: 'p', name: 'a' }, { name: 'b' }]);
    expect(out).not.toBeNull();
    const wrapped = out as { _array: Array<{ password?: string; name?: string }> };
    expect(wrapped._array).toHaveLength(2);
    expect(wrapped._array[0]?.password).toBeUndefined();
    expect(wrapped._array[0]?.name).toBe('a');
  });

  it('should_stop_at_max_depth', () => {
    const deep: Record<string, unknown> = {
      a: { b: { c: { d: { e: { f: { g: 'too deep' } } } } } },
    };
    const out = sanitizePayload(deep);
    expect(out).not.toBeNull();
    // No exception is the main point — no infinite recursion.
  });
});
