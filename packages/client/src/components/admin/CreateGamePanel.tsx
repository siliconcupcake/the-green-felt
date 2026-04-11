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
    <div className="admin-create-panel">
      <h2>Create a test game to get started</h2>
      <div className="admin-create-form">
        <label>
          Player Count:
          <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Seed (optional):
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Random if empty"
            className="admin-input"
          />
        </label>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : 'Create Game'}
        </button>
      </div>
      {error && <div className="admin-error">{error}</div>}
    </div>
  );
}
