import { describe, expect, it } from 'vitest';

// Smoke test — covered in depth by the component tests below.
describe('App module', () => {
  it('should_export_a_default_component', async () => {
    const mod = await import('./App');
    expect(typeof mod.default).toBe('function');
  });
});
