import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface ScoreCounterProps {
  label: string;
  value: number;
}

export function ScoreCounter({ label, value }: ScoreCounterProps) {
  const preset = useAnimationPreset();
  return (
    <div className="flex items-center gap-2 bg-black/50 px-3 py-[0.2rem] rounded mb-1">
      <span className="text-white/70 text-xs font-semibold">{label}</span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          className="text-white text-xs font-bold"
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
