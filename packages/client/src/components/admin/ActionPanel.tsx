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
      <div className="p-3 border-t border-admin-border-subtle shrink-0 bg-admin-bg-surface">
        <div className="text-admin-text-muted italic p-2">
          Actions disabled while viewing historical state
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-admin-border-subtle shrink-0 bg-admin-bg-surface">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[0.6875rem] uppercase tracking-wider text-admin-text-muted font-semibold">Acting as</span>
        {activePlayer ? (
          <span className="text-admin-text text-xs">
            {activePlayer} ({gameInfo?.players.find((p) => p.id === activePlayer)?.name ?? 'unknown'})
          </span>
        ) : (
          <em className="text-admin-text-dim text-xs">No active player</em>
        )}
      </div>

      {/* Suggest Move */}
      <div className="mb-3">
        <button
          className="px-2.5 py-1 border border-admin-accent/30 bg-admin-btn-primary text-admin-accent cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-primary-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          onClick={handleSuggest}
          disabled={loading || !activePlayer}
        >
          {loading ? 'Generating...' : 'Suggest move'}
        </button>
        {suggestedMove && (
          <div className="mt-2 flex flex-col gap-1.5">
            <textarea
              className="w-full p-1.5 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs resize-y transition-colors duration-150 focus:border-admin-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
              value={actionJson}
              onChange={(e) => setActionJson(e.target.value)}
              rows={4}
            />
            <button
              className="px-2.5 py-1 border border-admin-accent/30 bg-admin-btn-success text-admin-accent cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-success-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
              onClick={handleApprove}
              disabled={loading}
            >
              Approve & dispatch
            </button>
          </div>
        )}
      </div>

      {/* Manual Dispatch */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[0.6875rem] uppercase tracking-wider text-admin-text-muted font-semibold">Manual</span>
          <select className="px-1 py-0.5 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50" value={actionType} onChange={(e) => setActionType(e.target.value)}>
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="w-full p-1.5 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs resize-y transition-colors duration-150 focus:border-admin-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          value={actionJson}
          onChange={(e) => setActionJson(e.target.value)}
          placeholder={`{ "type": "${actionType}", ... }`}
          rows={4}
        />
        <button
          className="px-2.5 py-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge font-[inherit] text-xs transition-all duration-150 hover:enabled:bg-admin-btn-neutral-hover active:enabled:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          onClick={handleManualDispatch}
          disabled={loading || !activePlayer}
        >
          Dispatch
        </button>
      </div>

      {/* Last result */}
      {lastActionResult && (
        <div
          className={`px-2.5 py-1.5 rounded-badge mt-2 transition-colors duration-200 ${
            lastActionResult.success
              ? 'text-admin-accent bg-admin-status-success'
              : 'text-admin-red bg-admin-status-error'
          }`}
        >
          {lastActionResult.success ? 'Action dispatched successfully' : `Error: ${lastActionResult.error}`}
        </div>
      )}
    </div>
  );
}
