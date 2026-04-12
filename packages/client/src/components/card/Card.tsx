import { motion } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { isHidden } from '@the-green-felt/shared';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';
import './card.css';

interface CardProps {
  card: AnyCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disableHover?: boolean;
}

export function Card({ card, faceDown = false, selected = false, onClick, disableHover = false }: CardProps) {
  const preset = useAnimationPreset();
  const showBack = faceDown || isHidden(card);
  const svgPath = showBack ? '/backs/BCK.svg' : `/cards/${card.id}.svg`;
  const className = `playing-card ${showBack ? 'playing-card-back' : 'playing-card-svg'} ${selected ? 'playing-card-selected' : ''}`;

  const hoverAnimation = disableHover ? undefined : { y: `${preset.hover.lift}rem`, boxShadow: preset.hover.shadow };
  const selectedAnimation = selected
    ? { y: `${preset.hover.selectedLift}rem`, boxShadow: preset.hover.selectedShadow }
    : { y: '0rem', boxShadow: '0 0 0 rgba(0,0,0,0)' };

  return (
    <motion.button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={card.id}
      animate={selectedAnimation}
      whileHover={hoverAnimation}
      transition={{ type: 'spring', ...preset.spring.snappy }}
    >
      <img src={svgPath} alt={card.id} className="playing-card-svg-img" draggable={false} />
    </motion.button>
  );
}
