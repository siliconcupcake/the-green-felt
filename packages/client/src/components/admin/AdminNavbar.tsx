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
    <div className="admin-navbar">
      <span className="admin-navbar-title">Admin Console</span>

      {gameId && gameInfo ? (
        <div className="admin-navbar-game">
          <span className="admin-navbar-game-id">{gameId}</span>
          <span className="admin-navbar-game-meta">
            {gameInfo.players.length} players | {gameInfo.actionCount} actions
          </span>
          <button className="admin-btn admin-btn-danger" onClick={handleDestroy}>
            Destroy
          </button>
        </div>
      ) : (
        <div className="admin-navbar-create">
          {showCreate ? (
            <div className="admin-create-inline">
              <label>
                Players:
                <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Seed:
                <input
                  type="number"
                  placeholder="optional"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="admin-input-sm"
                />
              </label>
              <button className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button className="admin-btn" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
              Create Test Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
