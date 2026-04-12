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
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', ...preset.spring.default }}
        >
          <motion.div
            className="your-turn-banner-glow"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="your-turn-banner-icon">&#9654;</span>
          <span className="your-turn-banner-text">Your Turn</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

