import { useImperativeHandle, forwardRef } from 'react';
import { motion } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { CardFan } from '../card/CardFan';
import { useShake } from '../../hooks/useShake';
import './game-table.css';

interface PlayerSeatProps {
  name: string;
  cards: AnyCard[];
  score?: number;
  isCurrentTurn: boolean;
  isTeammate?: boolean;
}

export interface PlayerSeatHandle {
  shake: () => void;
}

export const PlayerSeat = forwardRef<PlayerSeatHandle, PlayerSeatProps>(
  function PlayerSeat({ name, cards, score, isCurrentTurn, isTeammate = false }, ref) {
    const { scope, trigger } = useShake();
    useImperativeHandle(ref, () => ({ shake: trigger }), [trigger]);

    const nameClasses = ['opponent-seat-name', isCurrentTurn ? 'is-turn' : '', isTeammate ? 'is-teammate' : ''].filter(Boolean).join(' ');

    return (
      <motion.div className="opponent-seat" ref={scope}>
        <CardFan cards={cards} compact faceDown />
        <div className="opponent-seat-info">
          <span className={nameClasses}>{name}</span>
          {score != null && <span className="opponent-seat-score">{score}</span>}
        </div>
      </motion.div>
    );
  },
);
