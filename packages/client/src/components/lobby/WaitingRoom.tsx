import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { GAME_CATALOG } from '@the-green-felt/shared';
import { trpc } from '../../trpc';
import { useLobbyStore } from '../../stores/lobby-store';
import { PlayerGrid } from './PlayerGrid';
import './lobby.css';

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
      <div className="waiting-room-header">
        <div className="waiting-room-header__left">
          <h2 className="waiting-room-header__game-name">{gameInfo?.displayName ?? 'Game'}</h2>
          <div className="waiting-room-header__meta">
            <span className="waiting-room-header__room-code">{roomCode}</span>
            <span className="waiting-room-header__status">· waiting for players</span>
          </div>
        </div>
        <div className="waiting-room-header__actions">
          <button className="waiting-room-button waiting-room-button--copy" onClick={handleCopyInvite}>
            {copied ? '✓ Copied!' : '🔗 Copy Invite'}
          </button>
          {isHost ? (
            <button className="waiting-room-button waiting-room-button--danger" onClick={handleClose}>
              Close Room
            </button>
          ) : (
            <button className="waiting-room-button waiting-room-button--danger" onClick={handleLeave}>
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-bar__labels">
          <span className={`progress-bar__label${isReady ? ' progress-bar__label--ready' : ''}`}>
            {isReady ? 'Ready!' : 'Players'}
          </span>
          <span className={`progress-bar__count${isReady ? ' progress-bar__count--ready' : ''}`}>
            {players.length} / {minPlayers}
          </span>
        </div>
        <div className="progress-bar__track">
          <div className="progress-bar__fill" style={{ width: `${Math.min(fillPercent, 100)}%` }} />
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
      <div className="waiting-room-start">
        {isHost ? (
          <button
            className={`waiting-room-start__button ${canStart ? 'waiting-room-start__button--ready' : 'waiting-room-start__button--disabled'}`}
            onClick={handleStart}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : `Need ${minPlayers - players.length} more player${minPlayers - players.length === 1 ? '' : 's'}`}
          </button>
        ) : (
          <div className="waiting-room-start__text">Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
