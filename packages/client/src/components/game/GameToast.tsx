import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface GameToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function GameToast({ message, onDismiss }: GameToastProps) {
  const preset = useAnimationPreset();

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(onDismiss, preset.hold.toastDismiss);
    return () => clearTimeout(timeout);
  }, [message, onDismiss, preset.hold.toastDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="absolute top-6 left-0 right-0 z-[70] flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', ...preset.spring.default }}
        >
          <span className="bg-[rgba(200,30,30,0.9)] text-white px-5 py-2 rounded-[0.375rem] text-[0.85rem] font-semibold whitespace-nowrap">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
