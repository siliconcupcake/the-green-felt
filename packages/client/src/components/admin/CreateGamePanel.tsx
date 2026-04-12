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
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <h2 className="text-[#aaa] font-normal text-base">Create a test game to get started</h2>
      <div className="flex gap-3 items-center">
        <label className="flex items-center gap-1.5 text-[#aaa]">
          Player Count:
          <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[#aaa]">
          Seed (optional):
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Random if empty"
            className="px-1.5 py-[0.1875rem] border border-[#444] bg-[#111] text-[#ddd] rounded-[0.1875rem] font-[inherit] text-xs"
          />
        </label>
        <button
          className="px-2.5 py-1 border border-[#1e90ff] bg-[#0a3d62] text-admin-blue cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#0c4d7a] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create Game'}
        </button>
      </div>
      {error && (
        <div className="text-[#ee5a24] mt-2 px-2.5 py-1.5 bg-[#2a1a1a] rounded-badge">{error}</div>
      )}
    </div>
  );
}
