import { PlayerCard } from './PlayerCard';

interface PlayerGridProps {
  players: string[];
  playerNames: Record<string, string>;
  currentPlayerId: string | null;
  hostPlayerId: string | null;
  isHost: boolean;
  totalSlots: number;
  onKick?: (playerId: string) => void;
}

export function PlayerGrid({
  players,
  playerNames,
  currentPlayerId,
  hostPlayerId,
  isHost,
  totalSlots,
  onKick,
}: PlayerGridProps) {
  const emptyCount = Math.max(0, totalSlots - players.length);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {players.map((playerId, index) => (
        <PlayerCard
          key={playerId}
          playerId={playerId}
          name={playerNames[playerId] ?? playerId.slice(0, 6)}
          index={index}
          isSelf={playerId === currentPlayerId}
          isHost={playerId === hostPlayerId}
          canKick={isHost && playerId !== currentPlayerId}
          onKick={() => onKick?.(playerId)}
        />
      ))}
      {Array.from({ length: emptyCount }, (_, i) => (
        <PlayerCard key={`empty-${i}`} empty />
      ))}
    </div>
  );
}
