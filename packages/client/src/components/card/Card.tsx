import { useState } from 'react';
import type { AnyCard } from '@the-green-felt/shared';
import { isJoker } from '@the-green-felt/shared';
import './card.css';

interface CardProps {
  card: AnyCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a single playing card.
 * Uses SVG assets when available, falls back to CSS rendering.
 */
export function Card({ card, faceDown = false, selected = false, onClick }: CardProps) {
  const [svgFailed, setSvgFailed] = useState(false);

  if (faceDown) {
    return (
      <div className={`card card-back ${selected ? 'card-selected' : ''}`} onClick={onClick} />
    );
  }

  const svgPath = `/cards/${card.id}.svg`;
  console.log(`Attempting to load SVG for card ${card.id} from ${svgPath}`);

  if (!svgFailed) {
    return (
      <div
        className={`card card-svg ${selected ? 'card-selected' : ''}`}
        onClick={onClick}
      >
        <img
          src={svgPath}
          alt={card.id}
          className="card-svg-img"
          onError={() => setSvgFailed(true)}
          draggable={false}
        />
      </div>
    );
  }

  // CSS fallback
  if (isJoker(card)) {
    return (
      <div
        className={`card card-joker card-${card.color} ${selected ? 'card-selected' : ''}`}
        onClick={onClick}
      >
        <span className="card-label">JOKER</span>
      </div>
    );
  }

  const suitSymbol = { C: '\u2663', D: '\u2666', H: '\u2665', S: '\u2660' }[card.suit];
  const isRed = card.suit === 'D' || card.suit === 'H';

  return (
    <div
      className={`card ${isRed ? 'card-red' : 'card-black'} ${selected ? 'card-selected' : ''}`}
      onClick={onClick}
    >
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{suitSymbol}</span>
    </div>
  );
}
