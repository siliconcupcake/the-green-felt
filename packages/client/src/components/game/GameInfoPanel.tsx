import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Hash } from 'lucide-react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

interface GameInfoPanelProps {
  roomCode: string;
  currentTurnPlayer: string;
  isMyTurn: boolean;
  isTeammateTurn: boolean;
  turnTimeLimit?: number;
}

export function GameInfoPanel({ roomCode, currentTurnPlayer, isMyTurn, isTeammateTurn, turnTimeLimit = 30 }: GameInfoPanelProps) {
  const preset = useAnimationPreset();
  const [timeLeft, setTimeLeft] = useState(turnTimeLimit);
  const [prevTurnKey, setPrevTurnKey] = useState(`${currentTurnPlayer}-${turnTimeLimit}`);
  const turnKey = `${currentTurnPlayer}-${turnTimeLimit}`;

  if (prevTurnKey !== turnKey) {
    setPrevTurnKey(turnKey);
    setTimeLeft(turnTimeLimit);
  }

  useEffect(() => {
    const interval = setInterval(() => { setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)); }, 1000);
    return () => clearInterval(interval);
  }, [turnKey]);

  const timeWarning = timeLeft <= 10;
  const turnDotClass = isMyTurn
    ? 'bg-myturn'
    : isTeammateTurn
      ? 'bg-teammate'
      : 'bg-gold';
  const turnLabel = isMyTurn ? 'Your turn' : `${currentTurnPlayer}'s turn`;

  return (
    <div className="absolute bottom-6 left-6 bg-black/70 text-white py-3 px-4 rounded-lg text-[0.8rem] z-10 min-w-[10rem]">
      <div className="flex items-center gap-2 py-[0.2rem]">
        <Hash size={14} aria-hidden="true" />
        <span className="font-mono font-bold tracking-[0.05rem]">{roomCode}</span>
      </div>
      <div className="border-t border-white/20 my-[0.375rem]" />
      <div className="flex items-center gap-2 py-[0.2rem]">
        <motion.span
          className={`w-[0.625rem] h-[0.625rem] rounded-full inline-block ${turnDotClass}`}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={turnKey}
            className={isMyTurn ? 'text-myturn' : isTeammateTurn ? 'text-teammate' : ''}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: 'spring', ...preset.spring.snappy }}
          >
            <strong>{turnLabel}</strong>
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 py-[0.2rem]">
        <Clock size={14} aria-hidden="true" className={timeWarning ? 'text-[#ffc107]' : ''} />
        <span className={timeWarning ? 'text-[#ffc107] font-bold' : ''}>{timeLeft}s</span>
      </div>
    </div>
  );
}
