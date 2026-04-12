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
          className="game-toast"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', ...preset.spring.default }}
        >
          <span className="game-toast-inner">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
