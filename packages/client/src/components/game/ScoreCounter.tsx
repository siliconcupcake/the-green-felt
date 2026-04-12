import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface ScoreCounterProps {
  label: string;
  value: number;
}

export function ScoreCounter({ label, value }: ScoreCounterProps) {
  const preset = useAnimationPreset();
  return (
    <div className="my-score">
      <span className="my-score-label">{label}</span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          className="my-score-value"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', ...preset.spring.snappy }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
