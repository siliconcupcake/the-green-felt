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
import '../components/admin/admin.css';

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
    <div className="admin-page">
      <AdminNavbar />
      {!gameId ? (
        <CreateGamePanel />
      ) : (
        <div className="admin-layout">
          <div className="admin-left">
            <StateInspector />
            <ActionPanel />
          </div>
          <div className="admin-right">
            <EventLog />
            <Timeline />
          </div>
        </div>
      )}
    </div>
  );
}
