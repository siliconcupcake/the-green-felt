import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface YourTurnBannerProps {
  isMyTurn: boolean;
}

export function YourTurnBanner({ isMyTurn }: YourTurnBannerProps) {
  const preset = useAnimationPreset();
  const [dismissed, setDismissed] = useState(false);
  const prevIsMyTurn = useRef(isMyTurn);

  // Reset dismissed flag when isMyTurn transitions to true
  if (isMyTurn && !prevIsMyTurn.current) {
    setDismissed(false);
  }
  prevIsMyTurn.current = isMyTurn;

  // Auto-dismiss after hold duration
  useEffect(() => {
    if (!isMyTurn || dismissed) return;
    const timeout = setTimeout(() => { setDismissed(true); }, preset.hold.yourTurnBanner);
    return () => clearTimeout(timeout);
  }, [isMyTurn, dismissed, preset.hold.yourTurnBanner]);

  const visible = isMyTurn && !dismissed;

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
          <div className="your-turn-banner-card">
            <motion.div
              className="your-turn-banner-glow"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="your-turn-banner-icon">&#9654;</span>
            <span className="your-turn-banner-text">Your Turn</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
