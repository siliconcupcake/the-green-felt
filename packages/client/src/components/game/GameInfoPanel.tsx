import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';
import './game-table.css';

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
  const turnDotClass = isMyTurn ? 'turn-dot--mine' : isTeammateTurn ? 'turn-dot--teammate' : 'turn-dot--opponent';
  const turnLabel = isMyTurn ? 'Your turn' : `${currentTurnPlayer}'s turn`;

  return (
    <div className="game-info-panel">
      <div className="game-info-row">
        <i className="bi bi-hash" />
        <span className="game-info-room-code">{roomCode}</span>
      </div>
      <div className="game-info-divider" />
      <div className="game-info-row">
        <motion.span
          className={`turn-indicator-dot ${turnDotClass}`}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={turnKey}
            className={isMyTurn ? 'turn-text--mine' : isTeammateTurn ? 'turn-text--teammate' : ''}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: 'spring', ...preset.spring.snappy }}
          >
            <strong>{turnLabel}</strong>
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="game-info-row">
        <i className={`bi bi-clock ${timeWarning ? 'text-warning' : ''}`} />
        <span className={timeWarning ? 'text-warning fw-bold' : ''}>{timeLeft}s</span>
      </div>
    </div>
  );
}
