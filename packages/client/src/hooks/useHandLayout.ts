import { useMemo } from 'react';
import { useAnimationPreset } from '../components/animation/AnimationPresetProvider';
import type { SpringConfig } from '../components/animation/types';

export function buildLayoutTransition(spring: SpringConfig) {
  return { type: 'spring' as const, stiffness: spring.stiffness, damping: spring.damping, mass: spring.mass };
}

export function useHandLayout() {
  const preset = useAnimationPreset();
  const transition = useMemo(() => buildLayoutTransition(preset.spring.default), [preset.spring.default]);
  return { transition };
}
