import type { AnyCard } from '@the-green-felt/shared';
import { Card } from './Card.js';

interface CardFanProps {
  cards: AnyCard[];
  selectedIds?: Set<string>;
  onCardClick?: (card: AnyCard) => void;
}

/**
 * Renders a hand of cards in a fan layout using CSS transforms.
 */
export function CardFan({ cards, selectedIds, onCardClick }: CardFanProps) {
  const totalCards = cards.length;
  const maxSpread = 40; // degrees
  const spreadAngle = Math.min(maxSpread, totalCards * 5);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ position: 'relative', width: `${totalCards * 30 + 70}px`, height: '120px' }}>
        {cards.map((card, i) => {
          const angle = totalCards > 1
            ? -spreadAngle / 2 + (spreadAngle / (totalCards - 1)) * i
            : 0;
          return (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                left: `${i * 30}px`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
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
