import type { AnyCard } from '@the-green-felt/shared';
import { isHidden } from '@the-green-felt/shared';
import './card.css';

interface CardProps {
  card: AnyCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a single playing card.
 * HiddenCards always render as card backs regardless of faceDown prop.
 */
export function Card({ card, faceDown = false, selected = false, onClick }: CardProps) {
  const showBack = faceDown || isHidden(card);
  const svgPath = showBack ? '/cards/BCK.svg' : `/cards/${card.id}.svg`;

  const className = `playing-card ${showBack ? 'playing-card-back' : 'playing-card-svg'} ${selected ? 'playing-card-selected' : ''}`;
  return (
    <button type="button" className={className} onClick={onClick} aria-label={card.id}>
      <img src={svgPath} alt={card.id} className="playing-card-svg-img" draggable={false} />
    </button>
  );
}
