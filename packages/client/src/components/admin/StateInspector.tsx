import { useEffect } from 'react';
import { trpc } from '../../trpc';
import { useAdminStore } from '../../stores/admin-store';
import { JsonTree } from './JsonTree';

export function StateInspector() {
  const {
    gameId,
    gameInfo,
    fullState,
    selectedPlayerId,
    playerView,
    timelineIndex,
    historicalState,
    historicalViews,
    selectPlayer,
    setPlayerView,
  } = useAdminStore();

  const isHistorical = timelineIndex !== null;
  const displayState = isHistorical ? historicalState : fullState;
  const displayView = isHistorical && historicalViews && selectedPlayerId
    ? historicalViews[selectedPlayerId]
    : playerView;

  // Fetch player view when selection changes (live mode only)
  useEffect(() => {
    if (!gameId || !selectedPlayerId || isHistorical) return;
    trpc.admin!.getPlayerView
      .query({ gameId, playerId: selectedPlayerId })
      .then((view) => setPlayerView(view))
      .catch(console.error);
  }, [gameId, selectedPlayerId, isHistorical, setPlayerView]);

  // Auto-select first player if none selected
  useEffect(() => {
    if (!selectedPlayerId && gameInfo && gameInfo.players.length > 0) {
      selectPlayer(gameInfo.players[0].id);
    }
  }, [gameInfo, selectedPlayerId, selectPlayer]);

  // Update historical player view when switching players during historical mode
  useEffect(() => {
    if (isHistorical && historicalViews && selectedPlayerId) {
      setPlayerView(historicalViews[selectedPlayerId] ?? null);
    }
  }, [isHistorical, historicalViews, selectedPlayerId, setPlayerView]);

  if (!displayState) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isHistorical && (
        <div className="px-3 py-1.5 text-center bg-[#3a2a0a] text-admin-orange border-b border-admin-orange">
          Viewing historical state at action {timelineIndex! + 1} &mdash;{' '}
          <button
            className="bg-transparent border-none text-admin-blue cursor-pointer underline p-0 font-[inherit] text-[inherit]"
            onClick={() => {
              useAdminStore.getState().setTimelineIndex(null);
              useAdminStore.getState().setHistoricalState(null, null);
            }}
          >
            Back to Live
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 border-r border-[#333] last:border-r-0">
          <JsonTree data={displayState} label="Full State (God Mode)" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 border-r border-[#333] last:border-r-0">
          <div className="flex items-center gap-2 pb-2 border-b border-[#333] mb-2">
            <label htmlFor="admin-player-select" className="text-[#aaa]">Player View:</label>
            <select
              id="admin-player-select"
              value={selectedPlayerId ?? ''}
              onChange={(e) => selectPlayer(e.target.value || null)}
            >
              <option value="">Select player...</option>
              {gameInfo?.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          {displayView ? (
            <JsonTree data={displayView} label={`View: ${selectedPlayerId}`} />
          ) : (
            <div className="text-[#666] italic p-4 text-center">Select a player to view their perspective</div>
          )}
        </div>
      </div>
    </div>
  );
}
