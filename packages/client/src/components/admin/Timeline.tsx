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
      <div className="admin-timeline">
        <div className="admin-timeline-empty">No actions yet</div>
      </div>
    );
  }

  return (
    <div className="admin-timeline">
      <div className="admin-timeline-header">
        <strong>Timeline</strong>
        {timelineIndex !== null && (
          <button className="admin-btn-link" onClick={handleBackToLive}>
            Back to Live
          </button>
        )}
      </div>
      <div className="admin-timeline-slider">
        <input
          type="range"
          min={0}
          max={totalActions - 1}
          value={currentIndex}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
        />
        <div className="admin-timeline-label">
          Action {currentIndex + 1} of {totalActions}
          {timelineIndex !== null && ' (historical)'}
        </div>
      </div>
      {timelineIndex !== null && (
        <div className="admin-timeline-info">
          {successfulActions[timelineIndex] && (
            <span>
              {successfulActions[timelineIndex].playerId}: {successfulActions[timelineIndex].action.type}
            </span>
          )}
        </div>
      )}
      <div className="admin-timeline-actions">
        <button
          className="admin-btn"
          onClick={handleViewState}
          disabled={loading || timelineIndex === null}
        >
          {loading ? 'Loading...' : 'View State Here'}
        </button>
        {confirmRewind ? (
          <div className="admin-rewind-confirm">
            <span>Rewind to action {(timelineIndex ?? 0) + 1}? This is destructive.</span>
            <button className="admin-btn admin-btn-danger" onClick={handleRewind} disabled={loading}>
              Confirm Rewind
            </button>
            <button className="admin-btn" onClick={() => setConfirmRewind(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="admin-btn admin-btn-danger"
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
