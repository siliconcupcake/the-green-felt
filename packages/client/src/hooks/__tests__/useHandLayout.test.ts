import { describe, it, expect } from 'vitest';
import { buildLayoutTransition } from '../useHandLayout';

describe('buildLayoutTransition', () => {
  it('returns a transition with type spring', () => {
    expect(buildLayoutTransition({ stiffness: 200, damping: 20, mass: 1.2 }).type).toBe('spring');
  });
  it('passes through spring config values', () => {
    const t = buildLayoutTransition({ stiffness: 300, damping: 25, mass: 0.8 });
    expect(t.stiffness).toBe(300);
    expect(t.damping).toBe(25);
    expect(t.mass).toBe(0.8);
  });
});
