import type { AnyCard } from '@the-green-felt/shared';
import { Card } from '../card/Card';
import { CardFan } from '../card/CardFan';
import { PlayerSeat } from './PlayerSeat';
import { GameInfoPanel } from './GameInfoPanel';
import './game-table.css';

export interface GamePlayer {
  id: string;
  name: string;
  cards: AnyCard[];
  isCurrentTurn: boolean;
  team?: string;
  score?: number;
}

interface GameTableProps {
  currentPlayer: GamePlayer;
  opponents: GamePlayer[];
  turnPlayerName: string;
  isMyTurn: boolean;
  isTeammateTurn: boolean;
  roomCode: string;
  drawPile: AnyCard[];
  discardPile: AnyCard[];
  onCardClick?: (card: AnyCard) => void;
}

const X_RADIUS = 42;
const Y_RADIUS = 40;
const ARC_STEPS = 500;

// Horseshoe arc: extends past the semicircle so endpoints come down toward
// the bottom corners, wrapping around the table more naturally.
const ARC_START = (-30 * Math.PI) / 180; // -30°
const ARC_END = (210 * Math.PI) / 180; // 210°
const ARC_SPAN = ARC_END - ARC_START;

/**
 * Precompute cumulative arc lengths along the elliptical arc
 * so we can distribute opponents at equal arc-length intervals.
 *
 * ds = sqrt((a·sinθ)² + (b·cosθ)²) dθ
 */
function buildArcTable() {
  const lengths = [0];
  const step = ARC_SPAN / ARC_STEPS;
  let cumulative = 0;

  for (let i = 1; i <= ARC_STEPS; i++) {
    const theta = ARC_START + i * step;
    const dx = X_RADIUS * Math.sin(theta);
    const dy = Y_RADIUS * Math.cos(theta);
    cumulative += Math.sqrt(dx * dx + dy * dy) * step;
    lengths.push(cumulative);
  }

  return lengths;
}

const arcTable = buildArcTable();
const totalArcLength = arcTable[arcTable.length - 1];

/** Find the angle (in radians) at a given target arc length via the precomputed table. */
function angleAtArcLength(target: number): number {
  const step = ARC_SPAN / ARC_STEPS;
  for (let i = 1; i < arcTable.length; i++) {
    if (arcTable[i] >= target) {
      const t = (target - arcTable[i - 1]) / (arcTable[i] - arcTable[i - 1]);
      return ARC_START + (i - 1 + t) * step;
    }
  }
  return ARC_END;
}

function getOpponentPosition(index: number, total: number) {
  let rad: number;
  if (total === 1) {
    rad = Math.PI / 2;
  } else {
    const targetLength = (index / (total - 1)) * totalArcLength;
    rad = angleAtArcLength(targetLength);
  }

  const x = 50 + X_RADIUS * Math.cos(Math.PI - rad);
  const y = 50 - Y_RADIUS * Math.sin(rad);

  return { position: 'absolute' as const, left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' };
}

export function GameTable({
  currentPlayer,
  opponents,
  turnPlayerName,
  isMyTurn,
  isTeammateTurn,
  roomCode,
  drawPile,
  discardPile,
  onCardClick,
}: GameTableProps) {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const myTeam = currentPlayer.team;

  return (
    <div className="game-table">
      {/* Center area — draw and discard piles */}
      <div className="game-table-center">
        <div className="game-table-pile-stack">
          {drawPile.length > 0 ? (
            <>
              <Card card={drawPile[0]} faceDown />
              <span className="pile-label">{drawPile.length} cards</span>
            </>
          ) : (
            <div className="game-table-pile">Empty</div>
          )}
        </div>
        <div className="game-table-pile-stack">
          {topDiscard ? (
            <>
              <Card card={topDiscard} />
              <span className="pile-label">Discard</span>
            </>
          ) : (
            <div className="game-table-pile">Discard</div>
          )}
        </div>
      </div>

      {/* Opponent seats positioned in semicircle */}
      <div className="game-table-opponents">
        {opponents.map((opponent, i) => (
          <div key={opponent.id} style={getOpponentPosition(i, opponents.length)}>
            <PlayerSeat
              name={opponent.name}
              cards={opponent.cards}
              score={opponent.score}
              isCurrentTurn={opponent.isCurrentTurn}
              isTeammate={myTeam != null && opponent.team === myTeam}
            />
          </div>
        ))}
      </div>

      {/* Current player's hand at bottom center */}
      <div className="game-table-my-hand">
        {currentPlayer.score != null && (
          <div className="my-score">
            <span className="my-score-label">{currentPlayer.name}</span>
            <span className="my-score-value">{currentPlayer.score}</span>
          </div>
        )}
        <CardFan cards={currentPlayer.cards} onCardClick={onCardClick} />
      </div>

      {/* Game info panel */}
      <GameInfoPanel
        roomCode={roomCode}
        currentTurnPlayer={turnPlayerName}
        isMyTurn={isMyTurn}
        isTeammateTurn={isTeammateTurn}
      />
    </div>
  );
}
