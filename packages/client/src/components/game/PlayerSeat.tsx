import type { AnyCard } from '@the-green-felt/shared';
import { CardFan } from '../card/CardFan';
import './game-table.css';

interface PlayerSeatProps {
  name: string;
  cards: AnyCard[];
  score?: number;
  isCurrentTurn: boolean;
  isTeammate?: boolean;
}

export function PlayerSeat({ name, cards, score, isCurrentTurn, isTeammate = false }: PlayerSeatProps) {
  const nameClasses = [
    'opponent-seat-name',
    isCurrentTurn ? 'is-turn' : '',
    isTeammate ? 'is-teammate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="opponent-seat">
      <CardFan cards={cards} compact faceDown />
      <div className="opponent-seat-info">
        <span className={nameClasses}>{name}</span>
        {score != null && <span className="opponent-seat-score">{score}</span>}
      </div>
    </div>
  );
}
