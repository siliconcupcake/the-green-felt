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
    reset();
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#16213e] border-b border-[#333] shrink-0">
      <span className="font-bold text-[0.9375rem] text-admin-orange">Admin Console</span>

      {gameId && gameInfo ? (
        <div className="flex items-center gap-3">
          <span className="text-admin-blue font-bold">{gameId}</span>
          <span className="text-[#888]">
            {gameInfo.players.length} players | {gameInfo.actionCount} actions
          </span>
          <button
            className="px-2.5 py-1 border border-[#ee5a24] bg-[#4a1a1a] text-[#ee5a24] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#5a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDestroy}
          >
            Destroy
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          {showCreate ? (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[#aaa]">
                Players:
                <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-[#aaa]">
                Seed:
                <input
                  type="number"
                  placeholder="optional"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-20 px-1.5 py-[0.1875rem] border border-[#444] bg-[#111] text-[#ddd] rounded-[0.1875rem] font-[inherit] text-xs"
                />
              </label>
              <button
                className="px-2.5 py-1 border border-[#1e90ff] bg-[#0a3d62] text-admin-blue cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#0c4d7a] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                className="px-2.5 py-1 border border-[#444] bg-[#2a2a4a] text-[#ddd] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#3a3a5a] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="px-2.5 py-1 border border-[#1e90ff] bg-[#0a3d62] text-admin-blue cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#0c4d7a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setShowCreate(true)}
            >
              Create Test Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
