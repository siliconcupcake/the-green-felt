import { useEffect, useRef } from 'react';
import { useAnimate } from 'motion/react';
import { createHidden, cardFromId } from '@the-green-felt/shared';
import type { CardTransferState } from '../../hooks/useCardTransfer';
import { useAnimationPreset } from '../animation/AnimationPresetProvider';
import { Card } from '../card/Card';
import './game-table.css';

interface CardTransferOverlayProps {
  transfer: CardTransferState | null;
  onComplete: () => void;
}

export function CardTransferOverlay({ transfer, onComplete }: CardTransferOverlayProps) {
  const preset = useAnimationPreset();
  const [scope, animate] = useAnimate();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!transfer || hasAnimated.current) return;
    hasAnimated.current = true;

    const run = async () => {
      try {
        const targetX = transfer.to.x - transfer.from.x;
        const targetY = transfer.to.y - transfer.from.y;

        await animate(
          scope.current,
          {
            x: `${targetX}vw`,
            y: `${targetY}vh`,
            ...(transfer.flipToFaceUp ? { rotateY: 180 } : {}),
          },
          { type: 'spring', ...preset.spring.default },
        );

        onComplete();
      } catch {
        onComplete();
      }
    };

    requestAnimationFrame(() => run());
  }, [transfer, animate, scope, preset.spring.default, onComplete]);

  useEffect(() => {
    if (!transfer) {
      hasAnimated.current = false;
    }
  }, [transfer]);

  if (!transfer) return null;

  const card = transfer.flipToFaceUp ? cardFromId(transfer.cardId) : createHidden();

  return (
    <div className="dealing-overlay">
      <div
        ref={scope}
        className="dealing-card"
        style={{
          left: `${transfer.from.x}%`,
          top: `${transfer.from.y}%`,
        }}
      >
        <Card card={card} faceDown={!transfer.flipToFaceUp} disableHover />
      </div>
    </div>
  );
}
