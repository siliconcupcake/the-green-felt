import { useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';
import type { GameInfo } from '../../stores/admin-store';
import { trpc } from '../../trpc';

export function AdminNavbar() {
  const { gameId, gameInfo, setGameId, setGameInfo, setFullState, setActionLog, reset } = useAdminStore();
  const [playerCount, setPlayerCount] = useState(6);
  const [seed, setSeed] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDestroy, setConfirmDestroy] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    const admin = trpc.admin!;
    try {
      const result = await admin.createTestGame.mutate({
        playerCount,
        seed: seed ? Number(seed) : undefined,
      });
      setGameId(result.gameId);

      // Fetch initial state
      const info = await admin.getGameInfo.query({ gameId: result.gameId });
      setGameInfo(info as GameInfo);
      const fullState = await admin.getFullState.query({ gameId: result.gameId });
      setFullState(fullState);
      const actionLog = await admin.getActionLog.query({ gameId: result.gameId });
      setActionLog(actionLog);
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create test game:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDestroy = async () => {
    if (!gameId) return;
    try {
      await trpc.admin!.destroyGame.mutate({ gameId });
    } catch {
      // Game may already be gone
    }
    setConfirmDestroy(false);
    reset();
  };

  const activePlayerName = gameInfo?.activePlayer
    ? gameInfo.players.find((p) => p.id === gameInfo.activePlayer)?.name
    : null;

  return (
    <nav className="flex items-center gap-4 px-4 py-2.5 bg-admin-bg-elevated border-b border-admin-border shrink-0">
      <span className="font-bold text-[0.9375rem] text-admin-orange tracking-tight">Admin Console</span>

      {gameId && gameInfo ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Live indicator + game ID */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-admin-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-admin-green" />
            </span>
            <span className="text-admin-blue font-bold truncate">{gameId}</span>
          </div>

          {/* Game type badge */}
          {gameInfo.gameTypeId && (
            <span className="px-2 py-0.5 rounded-badge text-[0.625rem] uppercase tracking-wider font-semibold bg-admin-btn-primary text-admin-blue border border-admin-blue/20">
              {gameInfo.gameTypeId}
            </span>
          )}

          {/* Stats */}
          <span className="text-admin-text-muted text-xs">
            {gameInfo.players.length} players · {gameInfo.actionCount} actions
          </span>

          {/* Active player */}
          {activePlayerName && (
            <div className="flex items-center gap-1.5 ml-auto mr-2">
              <span className="text-admin-text-dim text-xs">Turn:</span>
              <span className="text-admin-green font-semibold text-xs">{activePlayerName}</span>
            </div>
          )}

          {/* Destroy (with confirmation) */}
          {confirmDestroy ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-admin-red text-xs">Destroy this game?</span>
              <button
                className="px-2.5 py-1 border border-admin-red/40 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
                onClick={handleDestroy}
              >
                Confirm
              </button>
              <button
                className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
                onClick={() => setConfirmDestroy(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="px-2.5 py-1 border border-admin-red/30 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
              onClick={() => setConfirmDestroy(true)}
            >
              Destroy
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          {showCreate ? (
            <div className="flex items-center gap-2">
              <span className="text-admin-text-muted">Players:</span>
              <div className="flex">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    className={`px-1.5 py-0.5 text-xs font-[inherit] border border-admin-border cursor-pointer transition-all duration-150 first:rounded-l-badge last:rounded-r-badge -ml-px first:ml-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50 focus-visible:z-10 ${
                      playerCount === n
                        ? 'bg-admin-btn-primary text-admin-blue border-admin-blue/30 z-10'
                        : 'bg-admin-btn-neutral text-admin-text-muted hover:bg-admin-btn-neutral-hover hover:text-admin-text'
                    }`}
                    onClick={() => setPlayerCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1 text-admin-text-muted">
                Seed:
                <input
                  type="number"
                  placeholder="optional"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-20 px-1.5 py-[0.1875rem] border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs transition-colors duration-150 focus:border-admin-blue/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
                />
              </label>
              <button
                className="px-2.5 py-1 border border-admin-blue/30 bg-admin-btn-primary text-admin-blue cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-primary-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="px-2.5 py-1 border border-admin-blue/30 bg-admin-btn-primary text-admin-blue cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-primary-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-blue/50"
              onClick={() => setShowCreate(true)}
            >
              Create Test Game
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
