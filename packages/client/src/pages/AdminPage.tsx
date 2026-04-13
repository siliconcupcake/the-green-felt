import { useEffect } from 'react';
import { useAdminStore } from '../stores/admin-store';
import type { GameInfo } from '../stores/admin-store';
import { trpc } from '../trpc';
import { AdminNavbar } from '../components/admin/AdminNavbar';
import { CreateGamePanel } from '../components/admin/CreateGamePanel';
import { StateInspector } from '../components/admin/StateInspector';
import { ActionPanel } from '../components/admin/ActionPanel';
import { EventLog } from '../components/admin/EventLog';
import { Timeline } from '../components/admin/Timeline';

export function AdminPage() {
  const {
    gameId,
    appendEvent,
  } = useAdminStore();

  // Subscribe to admin events when a game is active
  useEffect(() => {
    if (!gameId) return;

    const admin = trpc.admin!;
    const subscription = admin.onServerEvents.subscribe(
      { gameId },
      {
        onData: (event) => {
          appendEvent(event as ReturnType<typeof useAdminStore.getState>['events'][number]);

          // Auto-refresh state on meaningful events (only in live mode)
          const eventType = (event as { type: string }).type;
          if (
            useAdminStore.getState().timelineIndex === null &&
            (eventType === 'state:updated' || eventType === 'game:rewound')
          ) {
            trpc.admin!.getFullState.query({ gameId }).then((s) => {
              useAdminStore.getState().setFullState(s);
            }).catch(console.error);
            trpc.admin!.getActionLog.query({ gameId }).then((log) => {
              useAdminStore.getState().setActionLog(log);
            }).catch(console.error);
            trpc.admin!.getGameInfo.query({ gameId }).then((info) => {
              useAdminStore.getState().setGameInfo(info as GameInfo);
            }).catch(console.error);
            const pid = useAdminStore.getState().selectedPlayerId;
            if (pid) {
              trpc.admin!.getPlayerView.query({ gameId, playerId: pid }).then((v) => {
                useAdminStore.getState().setPlayerView(v);
              }).catch(console.error);
            }
          }
        },
      },
    );

    return () => subscription.unsubscribe();
  }, [gameId, appendEvent]);

  return (
    <div className="flex flex-col h-screen bg-admin-bg text-admin-text font-mono text-[0.8125rem]">
      <AdminNavbar />
      {!gameId ? (
        <CreateGamePanel />
      ) : (
        <div className="flex flex-1 overflow-hidden gap-px bg-admin-border-subtle">
          <div className="flex-1 flex flex-col overflow-y-auto bg-admin-bg">
            <StateInspector />
            <ActionPanel />
          </div>
          <div className="w-[28rem] flex flex-col overflow-hidden bg-admin-bg">
            <EventLog />
            <Timeline />
          </div>
        </div>
      )}
    </div>
  );
}
