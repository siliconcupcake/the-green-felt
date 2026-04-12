import { motion } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { isHidden } from '@the-green-felt/shared';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';

export type CardSize = 'default' | 'compact' | 'deal';

interface CardProps {
  card: AnyCard;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disableHover?: boolean;
  size?: CardSize;
}

const sizeClasses: Record<CardSize, string> = {
  default: 'w-[8.225rem] h-[11.5rem] cursor-pointer',
  compact: 'w-[5.76rem] h-32 cursor-default',
  deal: 'w-[4.5rem] h-[6.25rem] cursor-default',
};

export function Card({
  card,
  faceDown = false,
  selected = false,
  onClick,
  disableHover = false,
  size = 'default',
}: CardProps) {
  const preset = useAnimationPreset();
  const showBack = faceDown || isHidden(card);
  const svgPath = showBack ? '/backs/BCK.svg' : `/cards/${card.id}.svg`;

  const baseClasses = [
    sizeClasses[size],
    'rounded-[0.65rem] p-0 bg-white',
    'flex flex-col items-center justify-center',
    'select-none font-[Georgia,serif] relative',
    showBack
      ? 'border-2 border-[#0d2240] bg-[linear-gradient(135deg,#1a3a5c_25%,#2a5a8c_50%,#1a3a5c_75%)]'
      : 'border-none p-0 overflow-hidden',
    selected ? 'border-2 border-[#0064c8]' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hoverAnimation = disableHover ? undefined : { y: `${preset.hover.lift}rem`, boxShadow: preset.hover.shadow };
  const selectedAnimation = selected
    ? { y: `${preset.hover.selectedLift}rem`, boxShadow: preset.hover.selectedShadow }
    : { y: '0rem', boxShadow: '0 0 0 rgba(0,0,0,0)' };

  return (
    <motion.button
      type="button"
      className={baseClasses}
      onClick={onClick}
      aria-label={card.id}
      animate={selectedAnimation}
      whileHover={hoverAnimation}
      transition={{ type: 'spring', ...preset.spring.snappy }}
    >
      <img src={svgPath} alt={card.id} className="w-full h-full object-contain pointer-events-none" draggable={false} />
    </motion.button>
  );
}
