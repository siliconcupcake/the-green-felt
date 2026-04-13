import { useState } from 'react';
import { trpc } from '../../trpc';
import { useAdminStore } from '../../stores/admin-store';
import type { GameInfo } from '../../stores/admin-store';

export function CreateGamePanel() {
  const { setGameId, setGameInfo, setFullState, setActionLog } = useAdminStore();
  const [playerCount, setPlayerCount] = useState(6);
  const [seed, setSeed] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const admin = trpc.admin!;
    try {
      const result = await admin.createTestGame.mutate({
        playerCount,
        seed: seed ? Number(seed) : undefined,
      });
      setGameId(result.gameId);

      const info = await admin.getGameInfo.query({ gameId: result.gameId });
      setGameInfo(info as GameInfo);
      const fullState = await admin.getFullState.query({ gameId: result.gameId });
      setFullState(fullState);
      const actionLog = await admin.getActionLog.query({ gameId: result.gameId });
      setActionLog(actionLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[1.5rem] opacity-30">{'>'}_</span>
        <h2 className="text-admin-text-muted font-normal text-base">No active game</h2>
        <p className="text-admin-text-dim text-xs">Create a test game to get started</p>
      </div>
      <div className="flex flex-col items-center gap-4 p-6 bg-admin-bg-surface rounded-card border border-admin-border-subtle shadow-[0_0_1.5rem_rgba(52,211,153,0.04)]">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6875rem] uppercase tracking-wider text-admin-text-muted font-semibold">Players</span>
            <div className="flex">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  className={`px-2 py-1 text-xs font-[inherit] border border-admin-border cursor-pointer transition-all duration-150 first:rounded-l-badge last:rounded-r-badge -ml-px first:ml-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50 focus-visible:z-10 ${
                    playerCount === n
                      ? 'bg-admin-btn-primary text-admin-accent border-admin-accent/30 z-10'
                      : 'bg-admin-btn-neutral text-admin-text-muted hover:bg-admin-btn-neutral-hover hover:text-admin-text'
                  }`}
                  onClick={() => setPlayerCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6875rem] uppercase tracking-wider text-admin-text-muted font-semibold">Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Random"
              className="px-1.5 py-1 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs transition-colors duration-150 focus:border-admin-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            />
          </div>
        </div>
        <button
          className="px-4 py-1.5 border border-admin-accent/30 bg-admin-btn-primary text-admin-accent cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-primary-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create game'}
        </button>
      </div>
      {error && (
        <div className="text-admin-red mt-2 px-2.5 py-1.5 bg-admin-status-error rounded-badge">{error}</div>
      )}
    </div>
  );
}
