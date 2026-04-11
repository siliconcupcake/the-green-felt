import { useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';
import type { GameInfo } from '../../stores/admin-store';
import { trpc } from '../../trpc';

const ACTION_TYPES = ['ASK_CARD', 'DECLARE_SET', 'TRANSFER_TURN'] as const;

export function ActionPanel() {
  const {
    gameId,
    gameInfo,
    suggestedMove,
    lastActionResult,
    setSuggestedMove,
    setLastActionResult,
    setFullState,
    setActionLog,
    setGameInfo,
    selectedPlayerId,
    setPlayerView,
    timelineIndex,
  } = useAdminStore();

  const [actionType, setActionType] = useState<string>('ASK_CARD');
  const [actionJson, setActionJson] = useState('');
  const [loading, setLoading] = useState(false);

  const activePlayer = gameInfo?.activePlayer;
  const isHistorical = timelineIndex !== null;

  const refreshState = async () => {
    if (!gameId) return;
    const admin = trpc.admin!;
    const [info, fullState, actionLog] = await Promise.all([
      admin.getGameInfo.query({ gameId }),
      admin.getFullState.query({ gameId }),
      admin.getActionLog.query({ gameId }),
    ]);
    setGameInfo(info as GameInfo);
    setFullState(fullState);
    setActionLog(actionLog);
    if (selectedPlayerId) {
      const view = await admin.getPlayerView.query({ gameId, playerId: selectedPlayerId });
      setPlayerView(view);
    }
  };

  const handleSuggest = async () => {
    if (!gameId || !activePlayer) return;
    setLoading(true);
    try {
      const result = await trpc.admin!.suggestMove.query({ gameId, playerId: activePlayer });
      if (result) {
        setSuggestedMove(result.action);
        setActionJson(JSON.stringify(result.action, null, 2));
      } else {
        setSuggestedMove(null);
        setLastActionResult({ success: false, error: 'No valid move found' });
      }
    } catch (err) {
      setLastActionResult({ success: false, error: err instanceof Error ? err.message : 'Failed to suggest' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (actionStr: string) => {
    if (!gameId || !activePlayer) return;
    setLoading(true);
    try {
      const action = JSON.parse(actionStr);
      const result = await trpc.admin!.dispatchAs.mutate({
        gameId,
        playerId: activePlayer,
        action,
      });
      setLastActionResult(result);
      setSuggestedMove(null);
      if (result.success) {
        await refreshState();
      }
    } catch (err) {
      setLastActionResult({ success: false, error: err instanceof Error ? err.message : 'Invalid JSON' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (suggestedMove) {
      handleDispatch(JSON.stringify(suggestedMove));
    }
  };

  const handleManualDispatch = () => {
    handleDispatch(actionJson);
  };

  if (isHistorical) {
    return (
      <div className="admin-action-panel">
        <div className="admin-action-disabled">
          Actions disabled while viewing historical state
        </div>
      </div>
    );
  }

  return (
    <div className="admin-action-panel">
      <div className="admin-action-header">
        <strong>Acting as:</strong>{' '}
        {activePlayer ? (
          <>
            {activePlayer} ({gameInfo?.players.find((p) => p.id === activePlayer)?.name ?? 'unknown'})
          </>
        ) : (
          <em>No active player</em>
        )}
      </div>

      {/* Suggest Move */}
      <div className="admin-action-section">
        <button className="admin-btn admin-btn-primary" onClick={handleSuggest} disabled={loading || !activePlayer}>
          {loading ? 'Generating...' : 'Suggest Move'}
        </button>
        {suggestedMove && (
          <div className="admin-suggested-move">
            <textarea
              className="admin-json-input"
              value={actionJson}
              onChange={(e) => setActionJson(e.target.value)}
              rows={4}
            />
            <button className="admin-btn admin-btn-success" onClick={handleApprove} disabled={loading}>
              Approve & Dispatch
            </button>
          </div>
        )}
      </div>

      {/* Manual Dispatch */}
      <div className="admin-action-section">
        <div className="admin-action-manual-header">
          <strong>Manual:</strong>
          <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="admin-json-input"
          value={actionJson}
          onChange={(e) => setActionJson(e.target.value)}
          placeholder={`{ "type": "${actionType}", ... }`}
          rows={4}
        />
        <button className="admin-btn" onClick={handleManualDispatch} disabled={loading || !activePlayer}>
          Dispatch
        </button>
      </div>

      {/* Last result */}
      {lastActionResult && (
        <div className={`admin-action-result ${lastActionResult.success ? 'admin-success' : 'admin-error'}`}>
          {lastActionResult.success ? 'Action dispatched successfully' : `Error: ${lastActionResult.error}`}
        </div>
      )}
    </div>
  );
}
