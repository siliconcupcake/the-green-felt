import { motion, AnimatePresence } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { useHandLayout } from '../../hooks/useHandLayout';
import { Card } from './Card';

interface CardFanProps {
  cards: AnyCard[];
  selectedIds?: Set<string>;
  onCardClick?: (card: AnyCard) => void;
  compact?: boolean;
  faceDown?: boolean;
}

export function CardFan({ cards, selectedIds, onCardClick, compact = false, faceDown = false }: CardFanProps) {
  const { transition } = useHandLayout();
  const slotClass = compact
    ? 'mr-[-3.5rem] last:mr-0'
    : 'mr-[-5.75rem] last:mr-0';

  return (
    <div className="flex py-5">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            className={slotClass}
            style={{ zIndex: i }}
            layout
            transition={transition}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Card
              card={card}
              faceDown={faceDown}
              selected={selectedIds?.has(card.id)}
              onClick={() => onCardClick?.(card)}
              disableHover={compact}
              size={compact ? 'compact' : 'default'}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
