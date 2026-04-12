import { describe, it, expect } from 'vitest';
import { buildShakeKeyframes } from '../useShake';

describe('buildShakeKeyframes', () => {
  it('generates correct number of keyframe values', () => {
    expect(buildShakeKeyframes(6, 3)).toHaveLength(7);
  });
  it('starts and ends at zero', () => {
    const kf = buildShakeKeyframes(6, 3);
    expect(kf[0]).toBe(0);
    expect(kf[kf.length - 1]).toBe(0);
  });
  it('alternates between positive and negative', () => {
    const kf = buildShakeKeyframes(6, 3);
    expect(kf[1]).toBe(6);
    expect(kf[2]).toBe(-6);
    expect(kf[3]).toBe(6);
    expect(kf[4]).toBe(-6);
    expect(kf[5]).toBe(6);
  });
  it('handles 2 oscillations', () => {
    expect(buildShakeKeyframes(4, 2)).toEqual([0, 4, -4, 4, 0]);
  });
});
