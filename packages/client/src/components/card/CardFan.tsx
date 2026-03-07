import type { AnyCard } from '@the-green-felt/shared';
import { Card } from './Card.js';
import './card.css';

interface CardFanProps {
  cards: AnyCard[];
  selectedIds?: Set<string>;
  onCardClick?: (card: AnyCard) => void;
}

/**
 * Renders a hand of cards in a fan layout using CSS transforms.
 * Per-card left, rotation, and z-index remain as inline styles
 * since they are computed dynamically at render time.
 */
export function CardFan({ cards, selectedIds, onCardClick }: CardFanProps) {
  const totalCards = cards.length;
  const maxSpread = 40; // degrees
  const spreadAngle = Math.min(maxSpread, totalCards * 5);

  return (
    <div className="card-fan">
      <div className="card-fan-inner" style={{ width: `${totalCards * 30 + 70}px` }}>
        {cards.map((card, i) => {
          const angle = totalCards > 1
            ? -spreadAngle / 2 + (spreadAngle / (totalCards - 1)) * i
            : 0;
          return (
            <div
              key={card.id}
              className="card-fan-slot"
              style={{
                left: `${i * 30}px`,
                transform: `rotate(${angle}deg)`,
                zIndex: i,
              }}
            >
              <Card
                card={card}
                selected={selectedIds?.has(card.id)}
                onClick={() => onCardClick?.(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
