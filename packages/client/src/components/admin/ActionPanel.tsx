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
      <div className="p-3 border-t border-[#333] shrink-0">
        <div className="text-[#888] italic p-2">
          Actions disabled while viewing historical state
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-[#333] shrink-0">
      <div className="mb-2">
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
      <div className="mb-3">
        <button
          className="px-2.5 py-1 border border-[#1e90ff] bg-[#0a3d62] text-admin-blue cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#0c4d7a] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSuggest}
          disabled={loading || !activePlayer}
        >
          {loading ? 'Generating...' : 'Suggest Move'}
        </button>
        {suggestedMove && (
          <div className="mt-2 flex flex-col gap-1.5">
            <textarea
              className="w-full p-1.5 border border-[#444] bg-[#111] text-[#ddd] rounded-[0.1875rem] font-[inherit] text-xs resize-y"
              value={actionJson}
              onChange={(e) => setActionJson(e.target.value)}
              rows={4}
            />
            <button
              className="px-2.5 py-1 border border-admin-green bg-[#1a4a1a] text-admin-green cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#2a5a2a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleApprove}
              disabled={loading}
            >
              Approve & Dispatch
            </button>
          </div>
        )}
      </div>

      {/* Manual Dispatch */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
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
          className="w-full p-1.5 border border-[#444] bg-[#111] text-[#ddd] rounded-[0.1875rem] font-[inherit] text-xs resize-y"
          value={actionJson}
          onChange={(e) => setActionJson(e.target.value)}
          placeholder={`{ "type": "${actionType}", ... }`}
          rows={4}
        />
        <button
          className="px-2.5 py-1 border border-[#444] bg-[#2a2a4a] text-[#ddd] cursor-pointer rounded-[0.1875rem] font-[inherit] text-xs hover:enabled:bg-[#3a3a5a] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleManualDispatch}
          disabled={loading || !activePlayer}
        >
          Dispatch
        </button>
      </div>

      {/* Last result */}
      {lastActionResult && (
        <div
          className={`px-2.5 py-1.5 rounded-badge mt-2 ${
            lastActionResult.success
              ? 'text-admin-green bg-[#1a2a1a]'
              : 'text-[#ee5a24] bg-[#2a1a1a]'
          }`}
        >
          {lastActionResult.success ? 'Action dispatched successfully' : `Error: ${lastActionResult.error}`}
        </div>
      )}
    </div>
  );
}
