import { useImperativeHandle, forwardRef } from 'react';
import { motion } from 'motion/react';
import type { AnyCard } from '@the-green-felt/shared';
import { CardFan } from '../card/CardFan';
import { useShake } from '../../hooks/useShake';

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

    const nameClasses = [
      'text-white text-[0.8rem] font-semibold [text-shadow:0_0.0625rem_0.125rem_rgba(0,0,0,0.5)] whitespace-nowrap',
      isCurrentTurn ? 'text-gold' : '',
      isTeammate ? 'text-teammate' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.div className="flex flex-col items-center pointer-events-auto" ref={scope}>
        <CardFan cards={cards} compact faceDown />
        <div className="flex items-center gap-[0.4rem] mt-1">
          <span className={nameClasses}>{name}</span>
          {score != null && (
            <span className="text-white/80 text-[0.7rem] font-bold bg-black/50 px-2 py-[0.1rem] rounded">
              {score}
            </span>
          )}
        </div>
      </motion.div>
    );
  },
);
