import type { AnyCard } from '@the-green-felt/shared';
import { isJoker } from '@the-green-felt/shared';
import './card.css';

interface CSSCardProps {
  card: AnyCard;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a playing card using pure CSS (no SVG assets).
 */
export function CSSCard({ card, selected = false, onClick }: CSSCardProps) {
  if (isJoker(card)) {
    return (
      <button
        type="button"
        className={`card card-joker card-${card.color} ${selected ? 'card-selected' : ''}`}
        onClick={onClick}
        aria-label={`Joker ${card.color}`}
      >
        <span className="card-label">JOKER</span>
      </button>
    );
  }

  const suitSymbol = { C: '\u2663', D: '\u2666', H: '\u2665', S: '\u2660' }[card.suit];
  const isRed = card.suit === 'D' || card.suit === 'H';

  return (
    <button
      type="button"
      className={`card ${isRed ? 'card-red' : 'card-black'} ${selected ? 'card-selected' : ''}`}
      onClick={onClick}
      aria-label={`${card.rank} of ${suitSymbol}`}
    >
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{suitSymbol}</span>
    </button>
  );
}
