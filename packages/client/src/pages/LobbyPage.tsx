import { useCallback, useEffect, useRef, useState } from 'react';
import type { TransitionEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { X } from 'lucide-react';
import { trpc } from '../trpc';
import { useLobbyStore } from '../stores/lobby-store';
import { GameCatalog } from '../components/lobby/GameCatalog';
import { JoinField } from '../components/lobby/JoinField';
import { WaitingRoom } from '../components/lobby/WaitingRoom';

const STORAGE_KEY_NAME = 'tgf:playerName';
const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';
const STORAGE_KEY_ROOM_CODE = 'tgf:roomCode';

export function LobbyPage() {
  const { roomCode: routeRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const { phase, enterWaitingRoom, setError, setLoading, loading, error, loadingGameId, setLoadingGameId } =
    useLobbyStore();

  const [playerName, setPlayerName] = useState(() => localStorage.getItem(STORAGE_KEY_NAME) ?? '');
  const [nameError, setNameError] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [phaseState, setPhaseState] = useState<'active' | 'exit' | 'enter'>('active');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const validateName = (): boolean => {
    if (!playerName.trim()) {
      setNameError(true);
      nameInputRef.current?.focus();
      return false;
    }
    setNameError(false);
    return true;
  };

  const saveLocalData = (name: string, playerId: string, roomCode: string) => {
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, playerId);
    localStorage.setItem(STORAGE_KEY_ROOM_CODE, roomCode);
  };

  // Phase transition — CSS-driven via data-phase-state + transitionend
  const transitionTo = useCallback((callback: () => void) => {
    pendingCallbackRef.current = callback;
    setPhaseState('exit');
  }, []);

  const handleTransitionEnd = useCallback(
    (e: TransitionEvent) => {
      // Only respond to opacity transitions on the phase wrapper itself
      if (e.target !== e.currentTarget || e.propertyName !== 'opacity') return;

      if (phaseState === 'exit' && pendingCallbackRef.current) {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        cb();
        setPhaseState('enter');
        requestAnimationFrame(() => {
          setPhaseState('active');
        });
      }
    },
    [phaseState],
  );

  const handleHost = async (gameTypeId: string) => {
    if (!validateName()) return;
    setLoading(true);
    setLoadingGameId(gameTypeId);
    setError(null);

    try {
      const result = await trpc.lobby.createRoom.mutate({
        gameTypeId,
        playerName: playerName.trim(),
      });

      saveLocalData(playerName, result.playerId, result.roomCode);

      const names = await trpc.lobby.getPlayerNames.query({ playerIds: result.room.players });

      transitionTo(() => {
        enterWaitingRoom(result.roomCode, gameTypeId, true, result.room.players, names);
        navigate(`/join/${result.roomCode}`, { replace: true });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
      setLoadingGameId(null);
    }
  };

  const handleJoin = async (gameCode: string) => {
    if (!validateName()) return;
    setLoading(true);
    setJoiningRoom(true);
    setJoinError(null);
    setError(null);

    try {
      const existingPlayerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID) ?? undefined;
      const result = await trpc.lobby.joinRoom.mutate({
        roomId: gameCode,
        playerName: playerName.trim(),
        playerId: existingPlayerId,
      });

      saveLocalData(playerName, result.playerId, gameCode);

      const names = await trpc.lobby.getPlayerNames.query({ playerIds: result.room.players });

      transitionTo(() => {
        enterWaitingRoom(gameCode, result.room.gameTypeId, false, result.room.players, names);
        navigate(`/join/${gameCode}`, { replace: true });
      });
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Room not found');
    } finally {
      setLoading(false);
      setJoiningRoom(false);
    }
  };

  // Deep link: auto-join if arriving via /join/:roomCode with a saved name
  useEffect(() => {
    if (routeRoomCode && phase === 'landing') {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      if (savedName?.trim()) {
        setPlayerName(savedName);
        handleJoin(routeRoomCode);
      } else {
        nameInputRef.current?.focus();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If store resets to landing externally (leave, close, room-closed), animate in and reset URL
  useEffect(() => {
    if (phase === 'landing') {
      if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      if (!pendingCallbackRef.current && phaseState === 'active') {
        setPhaseState('enter');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setPhaseState('active');
          });
        });
      }
    }
  }, [phase, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="lobby isolate min-h-[100dvh] bg-base font-sans text-text-primary flex flex-col items-center justify-center py-14 px-6 relative">
      {/* Ambient top glow */}
      <div className="lobby-glow" aria-hidden="true" />

      <div className="w-full max-w-[32rem] -mt-[4vh] relative md:max-w-[64rem]">
        {/* Brand */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-text-primary m-0">
            The Green Felt
          </h1>
          <p className="text-[0.9375rem] font-normal italic text-accent-green mt-3 mb-0">
            Classic cards, anywhere
          </p>
        </header>

        {/* Name Input */}
        <div className="max-w-[25rem] mx-auto mb-12 max-md:max-w-full md:max-w-[27.5rem]">
          <label className="block text-[0.8125rem] text-text-muted mb-2.5 ml-1 font-medium tracking-wide" htmlFor="player-name">
            Your name
          </label>
          <input
            id="player-name"
            ref={nameInputRef}
            type="text"
            maxLength={24}
            className={`w-full bg-surface border rounded-card py-3 px-4 text-text-primary font-sans text-[0.875rem] outline-none transition-[border-color,box-shadow] duration-150 ease-snappy placeholder:text-text-muted focus:border-accent-green focus:shadow-[0_0_0_0.1875rem_rgba(52,211,153,0.1)] ${nameError ? 'border-accent-red animate-shake' : 'border-border'}`}
            placeholder="who art thou?"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setNameError(false);
            }}
            readOnly={phase === 'waiting'}
          />
        </div>

        {/* Swappable middle section */}
        <div
          className="lobby-phase"
          data-phase-state={phaseState}
          onTransitionEnd={handleTransitionEnd}
        >
          {phase === 'landing' ? (
            <>
              <GameCatalog onHost={handleHost} disabled={loading} loadingGameId={loadingGameId} />

              {error && (
                <div
                  className="bg-accent-red-bg border border-[rgba(239,68,68,0.15)] rounded-card px-4 py-3 mt-3.5 max-w-[27.5rem] mx-auto flex items-center gap-3"
                  role="alert"
                >
                  <span className="text-accent-red text-[0.8125rem] flex-1">{error}</span>
                  <button
                    className="text-accent-red shrink-0 transition-opacity duration-150 hover:opacity-70"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <JoinField
                initialCode={routeRoomCode ?? ''}
                onJoin={handleJoin}
                disabled={loading}
                joining={joiningRoom}
                error={joinError}
              />
            </>
          ) : (
            <WaitingRoom />
          )}
        </div>

        {/* Footer — fixed to the viewport bottom */}
        <footer className="fixed bottom-0 left-0 right-0 text-center py-5 text-text-disabled text-[0.8125rem] tracking-wide">
          Made with <span className="text-accent-green">♥</span> by siliconcupcake
        </footer>
      </div>
    </main>
  );
}
