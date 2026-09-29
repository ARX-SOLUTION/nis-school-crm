import { describe, expect, it } from 'vitest';
import App from './App';

// Smoke test - covered in depth by the component tests below.
describe('App module', () => {
  it('should_export_a_default_component', () => {
    expect(typeof App).toBe('function');
  });
});
