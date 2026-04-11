import { useState, useEffect, useCallback } from 'react';
import { Card } from '../card/Card';
import type { AnyCard } from '@the-green-felt/shared';
import { createHidden } from '@the-green-felt/shared';
import './game-table.css';

const DEAL_INTERVAL_MS = 100;
const SETTLE_DELAY_MS = 400;

interface DealingAnimationProps {
  /** Player IDs in seat order (index 0 = current player) */
  seatOrder: string[];
  /** Cards dealt to the current player */
  myCards: AnyCard[];
  /** Number of cards each player receives */
  cardsPerPlayer: number;
  /** Position of each player on screen (% coordinates) */
  playerPositions: Map<string, { x: number; y: number }>;
  onComplete: () => void;
}

/** Build the round-robin dealing sequence the client animates. */
function buildClientDealOrder(
  seatOrder: string[],
  myCards: AnyCard[],
  cardsPerPlayer: number,
  myPlayerId: string,
): Array<{ playerId: string; card: AnyCard; faceUp: boolean }> {
  const order: Array<{ playerId: string; card: AnyCard; faceUp: boolean }> = [];
  // Track how many cards each player has been dealt so far
  const dealtPerPlayer: Record<string, number> = {};
  for (const pid of seatOrder) dealtPerPlayer[pid] = 0;

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const pid of seatOrder) {
      if (pid === myPlayerId) {
        // Use the real card for the current player
        const card = myCards[dealtPerPlayer[pid]];
        if (card) {
          order.push({ playerId: pid, card, faceUp: true });
        }
      } else {
        // Hidden card for opponents (rendered face-down)
        order.push({ playerId: pid, card: createHidden(), faceUp: false });
      }
      dealtPerPlayer[pid]++;
    }
  }

  return order;
}

/**
 * Animates dealing cards from center of the table to each player seat.
 * Cards fly one at a time in round-robin order.
 */
export function DealingAnimation({
  seatOrder,
  myCards,
  cardsPerPlayer,
  playerPositions,
  onComplete,
}: DealingAnimationProps) {
  const myPlayerId = seatOrder[0];
  const [dealOrder] = useState(() => buildClientDealOrder(seatOrder, myCards, cardsPerPlayer, myPlayerId));
  const [dealtCount, setDealtCount] = useState(0);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (dealtCount >= dealOrder.length) {
      const timeout = setTimeout(handleComplete, SETTLE_DELAY_MS);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setDealtCount((prev) => {
        const next = prev + 1;
        if (next >= dealOrder.length) {
          clearInterval(interval);
        }
        return next;
      });
    }, DEAL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [dealtCount >= dealOrder.length, dealOrder.length, handleComplete]);

  return (
    <div className="dealing-overlay">
      {dealOrder.slice(0, dealtCount).map((entry, i) => {
        const pos = playerPositions.get(entry.playerId);
        if (!pos) return null;

        return (
          <div
            key={`deal-${i}`}
            className="dealing-card"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <Card card={entry.card} faceDown={!entry.faceUp} />
          </div>
        );
      })}

      {/* The card currently being dealt — starts at center, transitions to target */}
      {dealtCount < dealOrder.length && (
        <div
          className="dealing-card dealing-card--flying"
          style={{ left: '50%', top: '50%' }}
        >
          <Card card={dealOrder[dealtCount].card} faceDown />
        </div>
      )}
    </div>
  );
}
