import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import type { AnyCard } from '@the-green-felt/shared';
import { createHidden } from '@the-green-felt/shared';
import { useDealAnimation } from '../../hooks/useDealAnimation';
import { Card } from '../card/Card';

interface DealingAnimationProps {
  seatOrder: string[];
  myCards: AnyCard[];
  cardsPerPlayer: number;
  playerPositions: Map<string, { x: number; y: number }>;
  onComplete: () => void;
}

function buildClientDealOrder(
  seatOrder: string[],
  myCards: AnyCard[],
  cardsPerPlayer: number,
  myPlayerId: string,
): Array<{ playerId: string; card: AnyCard; faceUp: boolean }> {
  const order: Array<{ playerId: string; card: AnyCard; faceUp: boolean }> = [];
  const dealtPerPlayer: Record<string, number> = {};
  for (const pid of seatOrder) dealtPerPlayer[pid] = 0;
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const pid of seatOrder) {
      if (pid === myPlayerId) {
        const card = myCards[dealtPerPlayer[pid]];
        if (card) order.push({ playerId: pid, card, faceUp: true });
      } else {
        order.push({ playerId: pid, card: createHidden(), faceUp: false });
      }
      dealtPerPlayer[pid]++;
    }
  }
  return order;
}

export function DealingAnimation({ seatOrder, myCards, cardsPerPlayer, playerPositions, onComplete }: DealingAnimationProps) {
  const myPlayerId = seatOrder[0];
  const dealOrder = buildClientDealOrder(seatOrder, myCards, cardsPerPlayer, myPlayerId);
  const { scope, startDeal } = useDealAnimation({ onComplete });

  useEffect(() => {
    const frame = requestAnimationFrame(() => { startDeal(); });
    return () => cancelAnimationFrame(frame);
  }, [startDeal]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none" ref={scope}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99]">
        <Card card={createHidden()} faceDown disableHover />
      </div>
      {dealOrder.map((entry, i) => {
        const pos = playerPositions.get(entry.playerId);
        if (!pos) return null;
        const offsetX = pos.x - 50;
        const offsetY = pos.y - 50;
        return (
          <div
            key={`deal-${i}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] will-change-transform"
            data-deal-card
            style={{ '--target-x': `${offsetX}vw`, '--target-y': `${offsetY}vh`, opacity: 0 } as CSSProperties}
          >
            <Card card={entry.card} faceDown={!entry.faceUp} disableHover size="deal" />
          </div>
        );
      })}
    </div>
  );
}
