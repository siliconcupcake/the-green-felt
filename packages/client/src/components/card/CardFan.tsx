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
  return (
    <div className="card-fan">
      {cards.map((card, i) => (
        <div key={card.id} className="card-fan-slot" style={{ zIndex: i }}>
          <Card card={card} selected={selectedIds?.has(card.id)} onClick={() => onCardClick?.(card)} />
        </div>
      ))}
    </div>
  );
}
