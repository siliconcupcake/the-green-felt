import { useCallback, useRef } from 'react';
import { useAnimate, stagger } from 'motion/react';
import { useAnimationPreset } from '../components/animation/AnimationPresetProvider';

interface DealAnimationConfig {
  /** Total number of cards to deal (reserved for future progress indicator) */
  _totalCards?: number;
  onComplete: () => void;
}

export function useDealAnimation({ onComplete }: DealAnimationConfig) {
  const preset = useAnimationPreset();
  const [scope, animate] = useAnimate();
  const hasRun = useRef(false);

  const startDeal = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;
    try {
      await animate(
        '[data-deal-card]',
        { x: 'var(--target-x)', y: 'var(--target-y)', opacity: 1 },
        { delay: stagger(preset.stagger.dealCard / 1000), type: 'spring', ...preset.spring.default },
      );
      await new Promise((resolve) => setTimeout(resolve, preset.hold.dealSettle));
      onComplete();
    } catch {
      onComplete();
    }
  }, [animate, preset, onComplete]);

  return { scope, startDeal };
}
