import { useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';
import { trpc } from '../../trpc';

export function AdminNavbar() {
  const { gameId, gameInfo, reset } = useAdminStore();
  const [confirmDestroy, setConfirmDestroy] = useState(false);

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
      <span className="font-bold text-[0.9375rem] text-admin-label tracking-tight">Admin Console</span>

      {gameId && gameInfo ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Live indicator + game ID */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-admin-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-admin-accent" />
            </span>
            <span className="text-admin-accent font-bold truncate">{gameId}</span>
          </div>

          {/* Game type badge */}
          {gameInfo.gameTypeId && (
            <span className="px-2 py-0.5 rounded-badge text-[0.625rem] uppercase tracking-wider font-semibold bg-admin-btn-primary text-admin-accent border border-admin-accent/20">
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
              <span className="text-admin-accent font-semibold text-xs">{activePlayerName}</span>
            </div>
          )}

          {/* Destroy (with confirmation) */}
          {confirmDestroy ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-admin-red text-xs">Destroy this game?</span>
              <button
                className="px-2.5 py-1 border border-admin-red/40 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
                onClick={handleDestroy}
              >
                Confirm
              </button>
              <button
                className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
                onClick={() => setConfirmDestroy(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="px-2.5 py-1 border border-admin-red/30 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
              onClick={() => setConfirmDestroy(true)}
            >
              Destroy
            </button>
          )}
        </div>
      ) : (
        <span className="text-admin-text-muted text-xs">No active game</span>
      )}
    </nav>
  );
}
