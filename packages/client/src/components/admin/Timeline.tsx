import { useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';
import type { GameInfo } from '../../stores/admin-store';
import { trpc } from '../../trpc';

export function Timeline() {
  const {
    gameId,
    actionLog,
    timelineIndex,
    setTimelineIndex,
    setHistoricalState,
    setFullState,
    setActionLog,
    setGameInfo,
    selectedPlayerId,
    setPlayerView,
  } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [confirmRewind, setConfirmRewind] = useState(false);

  const successfulActions = actionLog.filter((e) => e.result === 'success');
  const totalActions = successfulActions.length;
  const currentIndex = timelineIndex ?? totalActions - 1;

  const handleSliderChange = (value: number) => {
    setTimelineIndex(value);
  };

  const handleViewState = async () => {
    if (!gameId || timelineIndex === null) return;
    setLoading(true);
    try {
      const result = await trpc.admin!.getStateAtIndex.query({
        gameId,
        actionIndex: timelineIndex,
      });
      setHistoricalState(result.state, result.views);
    } catch (err) {
      console.error('Failed to fetch historical state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRewind = async () => {
    if (!gameId || timelineIndex === null) return;
    setLoading(true);
    try {
      await trpc.admin!.rewindTo.mutate({
        gameId,
        actionIndex: timelineIndex,
      });
      // Refresh live state
      const admin = trpc.admin!;
      const [info, fullState, log] = await Promise.all([
        admin.getGameInfo.query({ gameId }),
        admin.getFullState.query({ gameId }),
        admin.getActionLog.query({ gameId }),
      ]);
      setGameInfo(info as GameInfo);
      setFullState(fullState);
      setActionLog(log);
      setTimelineIndex(null);
      setHistoricalState(null, null);
      setConfirmRewind(false);
      if (selectedPlayerId) {
        const view = await admin.getPlayerView.query({ gameId, playerId: selectedPlayerId });
        setPlayerView(view);
      }
    } catch (err) {
      console.error('Failed to rewind:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLive = () => {
    setTimelineIndex(null);
    setHistoricalState(null, null);
  };

  if (totalActions === 0) {
    return (
      <div className="p-3 border-t border-[#333] shrink-0">
        <div className="text-[#666] italic">No actions yet</div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-[#333] shrink-0">
      <div className="flex justify-between items-center mb-2">
        <strong>Timeline</strong>
        {timelineIndex !== null && (
          <button
            className="bg-transparent border-none text-admin-blue cursor-pointer underline p-0 font-[inherit] text-[inherit]"
            onClick={handleBackToLive}
          >
            Back to Live
          </button>
        )}
      </div>
      <div className="mb-2">
        <input
          type="range"
          min={0}
          max={totalActions - 1}
          value={currentIndex}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
        <div className="text-center text-[#aaa] text-xs mt-1">
          Action {currentIndex + 1} of {totalActions}
          {timelineIndex !== null && ' (historical)'}
        </div>
      </div>
      {timelineIndex !== null && (
        <div className="text-[#888] text-xs mb-2">
          {successfulActions[timelineIndex] && (
            <span>
              {successfulActions[timelineIndex].playerId}: {successfulActions[timelineIndex].action.type}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <button
          className="px-2.5 py-1 border border-[#444] bg-[#2a2a4a] text-[#ddd] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#3a3a5a] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleViewState}
          disabled={loading || timelineIndex === null}
        >
          {loading ? 'Loading...' : 'View State Here'}
        </button>
        {confirmRewind ? (
          <div className="flex items-center gap-2">
            <span className="text-[#ee5a24] text-xs">Rewind to action {(timelineIndex ?? 0) + 1}? This is destructive.</span>
            <button
              className="px-2.5 py-1 border border-[#ee5a24] bg-[#4a1a1a] text-[#ee5a24] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#5a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRewind}
              disabled={loading}
            >
              Confirm Rewind
            </button>
            <button
              className="px-2.5 py-1 border border-[#444] bg-[#2a2a4a] text-[#ddd] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#3a3a5a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setConfirmRewind(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="px-2.5 py-1 border border-[#ee5a24] bg-[#4a1a1a] text-[#ee5a24] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#5a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setConfirmRewind(true)}
            disabled={loading || timelineIndex === null}
          >
            Rewind Here
          </button>
        )}
      </div>
    </div>
  );
}
