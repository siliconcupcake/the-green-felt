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
          className="absolute top-[35%] left-0 right-0 z-[60] pointer-events-none flex items-center justify-center gap-3 py-[0.875rem] pr-8 pl-6"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', ...preset.spring.default }}
        >
          <div className="flex items-center gap-3 py-[0.875rem] pr-8 pl-6 bg-black/55 backdrop-blur-[0.75rem] border border-[rgba(76,175,80,0.4)] rounded-xl shadow-[0_0.5rem_2rem_rgba(0,0,0,0.4),0_0_1.5rem_rgba(76,175,80,0.15)] overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(76,175,80,0.15)_0%,transparent_70%)] pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-base text-myturn [filter:drop-shadow(0_0_0.375rem_rgba(76,175,80,0.6))] relative z-[1]">
              &#9654;
            </span>
            <span className="text-xl font-bold text-white tracking-[0.05rem] [text-shadow:0_0.0625rem_0.25rem_rgba(0,0,0,0.5)] relative z-[1]">
              Your Turn
            </span>
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
