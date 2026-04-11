import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { adminService } from '../services/admin-service.js';
import { gameManager } from '../services/game-manager.js';
import type { AdminEvent } from '../services/game-manager.js';

export const adminRouter = router({
  /** Create a test game with mock players. */
  createTestGame: publicProcedure
    .input(
      z.object({
        playerCount: z.number().int().min(2).max(8),
        seed: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return adminService.createTestGame(input.playerCount, input.seed);
    }),

  /** Destroy an active game. */
  destroyGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ input }) => {
      adminService.destroyGame(input.gameId);
    }),

  /** Get the full authoritative game state. */
  getFullState: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }) => {
      return adminService.getFullState(input.gameId);
    }),

  /** Get a player's filtered view. */
  getPlayerView: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string() }))
    .query(({ input }) => {
      return adminService.getPlayerView(input.gameId, input.playerId);
    }),

  /** Get the action log. */
  getActionLog: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }) => {
      return adminService.getActionLog(input.gameId);
    }),

  /** Get game metadata. */
  getGameInfo: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }) => {
      return adminService.getGameInfo(input.gameId);
    }),

  /** Suggest a random valid move for a player. */
  suggestMove: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string() }))
    .query(({ input }) => {
      return adminService.suggestMove(input.gameId, input.playerId);
    }),

  /** Dispatch an action as any player. */
  dispatchAs: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        playerId: z.string(),
        action: z.object({ type: z.string() }).passthrough(),
      }),
    )
    .mutation(async ({ input }) => {
      return adminService.dispatchAs(input.gameId, input.playerId, input.action);
    }),

  /** Compute state at a historical action index (read-only). */
  getStateAtIndex: publicProcedure
    .input(z.object({ gameId: z.string(), actionIndex: z.number().int().min(0) }))
    .query(({ input }) => {
      return adminService.getStateAtIndex(input.gameId, input.actionIndex);
    }),

  /** Rewind the live game to a historical action index (destructive). */
  rewindTo: publicProcedure
    .input(z.object({ gameId: z.string(), actionIndex: z.number().int().min(-1) }))
    .mutation(async ({ input }) => {
      await adminService.rewindTo(input.gameId, input.actionIndex);
    }),

  /** Subscribe to real-time admin events for a game. */
  onServerEvents: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .subscription(async function* ({ input, signal }) {
      const { gameId } = input;
      const events: AdminEvent[] = [];
      let resolve: (() => void) | null = null;
      let eventId = 0;

      const unsubscribe = gameManager.onAdminEvent((event) => {
        if (event.gameId === gameId) {
          events.push({ ...event, id: eventId++ });
          resolve?.();
        }
      });

      signal?.addEventListener('abort', () => {
        unsubscribe();
        resolve?.();
      });

      try {
        while (!signal?.aborted) {
          if (events.length > 0) {
            yield events.shift()!;
          } else {
            await new Promise<void>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        unsubscribe();
      }
    }),
});
