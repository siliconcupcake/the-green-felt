import { useState, useEffect } from 'react';
import './game-table.css';

interface GameInfoPanelProps {
  roomCode: string;
  currentTurnPlayer: string;
  isMyTurn: boolean;
  isTeammateTurn: boolean;
  turnTimeLimit?: number;
}

export function GameInfoPanel({
  roomCode,
  currentTurnPlayer,
  isMyTurn,
  isTeammateTurn,
  turnTimeLimit = 30,
}: GameInfoPanelProps) {
  const [timeLeft, setTimeLeft] = useState(turnTimeLimit);
  const [prevTurnKey, setPrevTurnKey] = useState(`${currentTurnPlayer}-${turnTimeLimit}`);
  const turnKey = `${currentTurnPlayer}-${turnTimeLimit}`;

  // Reset the timer when the active player or time limit changes (no effect needed).
  // This is the React-recommended pattern for "derived state reset".
  if (prevTurnKey !== turnKey) {
    setPrevTurnKey(turnKey);
    setTimeLeft(turnTimeLimit);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
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
        <span className={`turn-indicator-dot ${turnDotClass}`} />
        <span className={isMyTurn ? 'turn-text--mine' : isTeammateTurn ? 'turn-text--teammate' : ''}>
          <strong>{turnLabel}</strong>
        </span>
      </div>

      <div className="game-info-row">
        <i className={`bi bi-clock ${timeWarning ? 'text-warning' : ''}`} />
        <span className={timeWarning ? 'text-warning fw-bold' : ''}>{timeLeft}s</span>
      </div>
    </div>
  );
}
