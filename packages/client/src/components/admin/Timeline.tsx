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
      <div className="p-3 border-t border-admin-border-subtle shrink-0 bg-admin-bg-surface">
        <div className="text-admin-text-dim italic">No actions yet</div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-admin-border-subtle shrink-0 bg-admin-bg-surface">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.6875rem] uppercase tracking-wider text-admin-text-muted font-semibold">Timeline</span>
        {timelineIndex !== null && (
          <button
            className="bg-transparent border-none text-admin-accent cursor-pointer underline p-0 font-[inherit] text-xs transition-colors duration-150 hover:text-admin-accent/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            onClick={handleBackToLive}
          >
            Back to live
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
          className="w-full cursor-pointer admin-range"
        />
        <div className="text-center text-admin-text-muted text-xs mt-1">
          Action {currentIndex + 1} of {totalActions}
          {timelineIndex !== null && ' (historical)'}
        </div>
      </div>
      {timelineIndex !== null && (
        <div className="text-admin-text-muted text-xs mb-2">
          {successfulActions[timelineIndex] && (
            <span>
              {successfulActions[timelineIndex].playerId}: {successfulActions[timelineIndex].action.type}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <button
          className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          onClick={handleViewState}
          disabled={loading || timelineIndex === null}
        >
          {loading ? 'Loading...' : 'View state here'}
        </button>
        {confirmRewind ? (
          <div className="flex items-center gap-2">
            <span className="text-admin-red text-xs">Rewind to action {(timelineIndex ?? 0) + 1}? This is destructive.</span>
            <button
              className="px-2.5 py-1 border border-admin-red/40 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
              onClick={handleRewind}
              disabled={loading}
            >
              Confirm rewind
            </button>
            <button
              className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
              onClick={() => setConfirmRewind(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="px-2.5 py-1 border border-admin-red/30 bg-admin-btn-danger text-admin-red cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-danger-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            onClick={() => setConfirmRewind(true)}
            disabled={loading || timelineIndex === null}
          >
            Rewind here
          </button>
        )}
      </div>
    </div>
  );
}
