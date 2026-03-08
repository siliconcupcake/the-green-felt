import { useState } from 'react';
import type { AnyCard } from '@the-green-felt/shared';
import { CSSCard } from './CSSCard';
import './card.css';

interface CardProps {
  card: AnyCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Renders a single playing card.
 * Uses SVG assets when available, falls back to CSSCard.
 */
export function Card({ card, faceDown = false, selected = false, onClick }: CardProps) {
  const svgPath = `/cards/${faceDown ? 'back' : card.id}.svg`;
  const className = `card ${faceDown ? 'card-back' : 'card-svg'} ${selected ? 'card-selected' : ''}`;
  return (
    <button type="button" className={className} onClick={onClick} aria-label={card.id}>
      <img src={svgPath} alt={card.id} className="card-svg-img" draggable={false} />
    </button>
  );
}
