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
    <section>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 gap-5">
        <div className="flex flex-col gap-2 min-w-0">
          <h2 className="text-[1.4375rem] font-bold tracking-[-0.02em] text-text-primary m-0 leading-tight">
            {gameInfo?.displayName ?? 'Game'}
          </h2>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-[0.8125rem] font-semibold tracking-[0.12em] text-accent-green bg-accent-green-bg px-3 py-1 rounded-badge border border-accent-green-border select-all">
              {roomCode}
            </span>
            <span className="text-[0.8125rem] text-text-muted">
              {isReady ? (
                <span className="text-accent-green font-medium">Ready to start</span>
              ) : (
                'Waiting for players'
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            className="rounded-button py-2.5 px-4 font-sans text-[0.8125rem] font-medium cursor-pointer transition-[border-color,color,transform] duration-150 ease-snappy flex items-center gap-2 bg-elevated border border-border text-text-secondary hover:border-accent-green-border hover:text-text-primary active:scale-[0.97]"
            onClick={handleCopyInvite}
          >
            {copied ? (
              <>
                <span className="text-accent-green">✓</span> Copied
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Copy invite
              </>
            )}
          </button>
          {isHost ? (
            <button
              className="rounded-button py-2.5 px-4 font-sans text-[0.8125rem] font-medium cursor-pointer transition-[border-color,transform] duration-150 ease-snappy flex items-center gap-2 bg-accent-red-bg border border-[rgba(239,68,68,0.15)] text-accent-red hover:border-accent-red active:scale-[0.97]"
              onClick={handleClose}
            >
              Close room
            </button>
          ) : (
            <button
              className="rounded-button py-2.5 px-4 font-sans text-[0.8125rem] font-medium cursor-pointer transition-[border-color,transform] duration-150 ease-snappy flex items-center gap-2 bg-accent-red-bg border border-[rgba(239,68,68,0.15)] text-accent-red hover:border-accent-red active:scale-[0.97]"
              onClick={handleLeave}
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2.5 text-[0.8125rem] font-medium">
          <span className={isReady ? 'text-accent-green' : 'text-text-secondary'}>
            Players
          </span>
          <span className={`font-mono tabular-nums ${isReady ? 'text-accent-green' : 'text-text-secondary'}`}>
            {players.length} / {minPlayers}
          </span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-accent-green to-accent-green-dark rounded-full transition-[width] duration-500 ease-snappy ${isReady ? 'progress-shimmer' : ''}`}
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
      <div className="text-center mt-2.5">
        {isHost ? (
          <button
            className={`inline-block border-none rounded-card py-4 px-14 font-sans text-[1rem] font-semibold cursor-pointer transition-[transform,box-shadow] duration-150 ease-snappy ${
              canStart
                ? 'bg-gradient-to-br from-accent-green to-accent-green-dark text-[#0f1210] shadow-glow hover:shadow-glow-lg hover:-translate-y-[0.0625rem] active:scale-[0.98] active:translate-y-0 active:shadow-none'
                : 'bg-border text-text-muted cursor-default'
            }`}
            onClick={handleStart}
            disabled={!canStart}
          >
            {canStart ? 'Start game' : `Need ${minPlayers - players.length} more player${minPlayers - players.length === 1 ? '' : 's'}`}
          </button>
        ) : (
          <p className="text-[0.9375rem] text-text-muted m-0">Waiting for host to start...</p>
        )}
      </div>
    </section>
  );
}
