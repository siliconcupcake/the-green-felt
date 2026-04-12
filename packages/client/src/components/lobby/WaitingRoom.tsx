import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { GAME_CATALOG } from '@the-green-felt/shared';
import { trpc } from '../../trpc';
import { useLobbyStore } from '../../stores/lobby-store';
import { PlayerGrid } from './PlayerGrid';

const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';
const STORAGE_KEY_ROOM_CODE = 'tgf:roomCode';

function getPlayerId(): string | null {
  return localStorage.getItem(STORAGE_KEY_PLAYER_ID);
}

export function WaitingRoom() {
  const navigate = useNavigate();
  const { roomCode, gameTypeId, isHost, players, playerNames, addPlayer, removePlayer, reset } = useLobbyStore();
  const [copied, setCopied] = useState(false);

  const gameInfo = gameTypeId ? GAME_CATALOG.find((g) => g.id === gameTypeId) : null;
  const totalSlots = gameInfo ? gameInfo.maxPlayers : 6;
  const minPlayers = gameInfo?.minPlayers ?? 2;
  const canStart = isHost && players.length >= minPlayers;
  const isReady = players.length >= minPlayers;
  const currentPlayerId = getPlayerId();
  const hostPlayerId = players.length > 0 ? players[0] : null;

  // Subscribe to lobby updates
  useEffect(() => {
    if (!roomCode) return;

    const subscription = trpc.lobby.onLobbyUpdate.subscribe(
      { roomCode },
      {
        onData: (event) => {
          if (event.type === 'PLAYER_JOINED') {
            addPlayer(event.playerId, event.playerName);
          } else if (event.type === 'PLAYER_LEFT') {
            if (event.playerId === getPlayerId()) {
              reset();
              return;
            }
            removePlayer(event.playerId);
          } else if (event.type === 'ROOM_CLOSED') {
            reset();
          } else if (event.type === 'GAME_STARTED') {
            navigate('/game');
          }
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomCode, addPlayer, removePlayer, reset, navigate]);

  const handleCopyInvite = async () => {
    if (!roomCode) return;
    const link = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this invite link:', link);
    }
  };

  const handleLeave = async () => {
    const pid = getPlayerId();
    if (!pid || !roomCode) return;
    try {
      await trpc.lobby.leaveRoom.mutate({ roomCode, playerId: pid });
      localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
      reset();
    } catch {
      // If leave fails, reset anyway — server state may already be cleaned up
      localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
      reset();
    }
  };

  const handleClose = async () => {
    const pid = getPlayerId();
    if (!pid || !roomCode) return;
    try {
      await trpc.lobby.closeRoom.mutate({ roomCode, hostPlayerId: pid });
      localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
      reset();
    } catch {
      localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
      reset();
    }
  };

  const handleKick = async (targetPlayerId: string) => {
    if (!roomCode) return;
    try {
      await trpc.lobby.leaveRoom.mutate({ roomCode, playerId: targetPlayerId });
    } catch {
      // Player may have already left
    }
  };

  const handleStart = async () => {
    const pid = getPlayerId();
    if (!pid || !roomCode) return;
    try {
      await trpc.lobby.startGame.mutate({ roomCode, hostPlayerId: pid });
      navigate('/game');
    } catch (err) {
      useLobbyStore.getState().setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const fillPercent = Math.min((players.length / minPlayers) * 100, 100);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-text-primary m-0">{gameInfo?.displayName ?? 'Game'}</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold tracking-[0.1em] text-accent-green bg-[rgba(52,211,153,0.1)] px-2 py-[0.125rem] rounded-badge">
              {roomCode}
            </span>
            <span className="text-[0.6875rem] text-text-muted">· waiting for players</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="rounded-button py-1.5 px-3 font-sans text-xs cursor-pointer transition-opacity duration-150 flex items-center gap-1 hover:opacity-[0.85] bg-elevated border border-border text-text-secondary"
            onClick={handleCopyInvite}
          >
            {copied ? '✓ Copied!' : '🔗 Copy Invite'}
          </button>
          {isHost ? (
            <button
              className="rounded-button py-1.5 px-3 font-sans text-xs cursor-pointer transition-opacity duration-150 flex items-center gap-1 hover:opacity-[0.85] bg-accent-red-bg border border-[rgba(239,68,68,0.2)] text-accent-red"
              onClick={handleClose}
            >
              Close Room
            </button>
          ) : (
            <button
              className="rounded-button py-1.5 px-3 font-sans text-xs cursor-pointer transition-opacity duration-150 flex items-center gap-1 hover:opacity-[0.85] bg-accent-red-bg border border-[rgba(239,68,68,0.2)] text-accent-red"
              onClick={handleLeave}
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1.5 text-[0.6875rem]">
          <span className={isReady ? 'text-accent-green font-semibold' : 'text-text-secondary'}>
            {isReady ? 'Ready!' : 'Players'}
          </span>
          <span className={isReady ? 'text-accent-green font-semibold' : 'text-text-secondary'}>
            {players.length} / {minPlayers}
          </span>
        </div>
        <div className="h-1 bg-border rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-green to-accent-green-dark rounded-sm transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Player Grid */}
      <PlayerGrid
        players={players}
        playerNames={playerNames}
        currentPlayerId={currentPlayerId}
        hostPlayerId={hostPlayerId}
        isHost={isHost}
        totalSlots={totalSlots}
        onKick={isHost ? handleKick : undefined}
      />

      {/* Start / Waiting */}
      <div className="text-center">
        {isHost ? (
          <button
            className={`inline-block border-none rounded-card py-3 px-10 font-sans text-sm font-semibold cursor-pointer [transition:opacity_0.15s,box-shadow_0.3s] ${
              canStart
                ? 'bg-gradient-to-br from-accent-green to-accent-green-dark text-[#121212] font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:opacity-90 hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                : 'bg-border text-text-muted cursor-default'
            }`}
            onClick={handleStart}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : `Need ${minPlayers - players.length} more player${minPlayers - players.length === 1 ? '' : 's'}`}
          </button>
        ) : (
          <div className="text-[0.8125rem] text-text-muted">Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
