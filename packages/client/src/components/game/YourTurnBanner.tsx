import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface YourTurnBannerProps {
  isMyTurn: boolean;
}

export function YourTurnBanner({ isMyTurn }: YourTurnBannerProps) {
  const preset = useAnimationPreset();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMyTurn) { setVisible(false); return; }
    setVisible(true);
    const timeout = setTimeout(() => { setVisible(false); }, preset.hold.yourTurnBanner);
    return () => clearTimeout(timeout);
  }, [isMyTurn, preset.hold.yourTurnBanner]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="your-turn-banner"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', ...preset.spring.default }}
        >
          Your Turn!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
