import { useCallback } from 'react';
import { useAnimate } from 'motion/react';
import { useAnimationPreset } from '../components/animation/AnimationPresetProvider';

export function buildShakeKeyframes(amplitude: number, oscillations: number): number[] {
  const keyframes: number[] = [0];
  for (let i = 0; i < oscillations * 2 - 1; i++) {
    keyframes.push(i % 2 === 0 ? amplitude : -amplitude);
  }
  keyframes.push(0);
  return keyframes;
}

export function useShake() {
  const preset = useAnimationPreset();
  const [scope, animate] = useAnimate();
  const trigger = useCallback(async () => {
    const { amplitude, oscillations, duration } = preset.shake;
    const keyframes = buildShakeKeyframes(amplitude, oscillations);
    await animate(scope.current, { x: keyframes }, { duration: duration / 1000 });
  }, [animate, scope, preset.shake]);
  return { scope, trigger };
}
