import { motion, AnimatePresence } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { Card } from './Card';
import { useHandLayout } from '../../hooks/useHandLayout';
import './card.css';

interface CardFanProps {
  cards: AnyCard[];
  selectedIds?: Set<string>;
  onCardClick?: (card: AnyCard) => void;
  compact?: boolean;
  faceDown?: boolean;
}

export function CardFan({ cards, selectedIds, onCardClick, compact = false, faceDown = false }: CardFanProps) {
  const { transition } = useHandLayout();
  const className = `card-fan ${compact ? 'card-fan--compact' : ''}`;

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            className="card-fan-slot"
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
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
