import type { AnyCard } from '@the-green-felt/shared';
import { Card } from './Card.js';
import './card.css';

interface CardFanProps {
  cards: AnyCard[];
  selectedIds?: Set<string>;
  onCardClick?: (card: AnyCard) => void;
  compact?: boolean;
  faceDown?: boolean;
}

/**
 * Renders a hand of cards in a fan layout.
 * - `compact`: tighter overlap for opponent hands
 * - `faceDown`: render all cards face-down
 */
export function CardFan({ cards, selectedIds, onCardClick, compact = false, faceDown = false }: CardFanProps) {
  const className = `card-fan ${compact ? 'card-fan--compact' : ''}`;

  return (
    <div className={className}>
      {cards.map((card, i) => (
        <div key={card.id} className="card-fan-slot" style={{ zIndex: i }}>
          <Card
            card={card}
            faceDown={faceDown}
            selected={selectedIds?.has(card.id)}
            onClick={() => onCardClick?.(card)}
          />
        </div>
      ))}
    </div>
  );
}
