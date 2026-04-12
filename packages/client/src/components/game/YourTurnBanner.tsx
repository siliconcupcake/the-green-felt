import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface YourTurnBannerProps {
  isMyTurn: boolean;
}

/**
 * Inner component that shows on mount and auto-dismisses after the preset hold duration.
 * Remounted via key change when isMyTurn transitions to true.
 */
function YourTurnBannerInner() {
  const preset = useAnimationPreset();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => { setVisible(false); }, preset.hold.yourTurnBanner);
    return () => clearTimeout(timeout);
  }, [preset.hold.yourTurnBanner]);

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

/**
 * Animated "Your Turn" banner that briefly appears when isMyTurn becomes true.
 * Uses a key counter to remount the inner component on each new turn,
 * avoiding ref access and synchronous setState during render.
 */
export function YourTurnBanner({ isMyTurn }: YourTurnBannerProps) {
  const [turnCount, setTurnCount] = useState(0);
  const [wasMyTurn, setWasMyTurn] = useState(isMyTurn);

  // Detect rising edge of isMyTurn — increment key to remount inner component
  if (isMyTurn && !wasMyTurn) {
    setTurnCount((c) => c + 1);
  }
  if (wasMyTurn !== isMyTurn) {
    setWasMyTurn(isMyTurn);
  }

  if (!isMyTurn) return null;

  return <YourTurnBannerInner key={turnCount} />;
}
