import { z } from 'zod';
import type { ServerEvent } from '@the-green-felt/shared';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { gameManager } from '../services/game-manager.js';

const MOCK_PLAYER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

export const gameRouter = router({
  /**
   * Start a mock game for development.
   * Creates fake opponents and starts the literature plugin.
   */
  startMockGame: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string(), playerName: z.string() }))
    .mutation(async ({ input }) => {
      if (gameManager.hasGame(input.gameId)) {
        return { alreadyStarted: true };
      }

      const playerIds = [input.playerId];
      const playerNames: Record<string, string> = { [input.playerId]: input.playerName };

      // Create 5 mock opponents for 6 total (literature minimum)
      for (let i = 0; i < MOCK_PLAYER_NAMES.length; i++) {
        const fakeId = `mock-${i}`;
        playerIds.push(fakeId);
        playerNames[fakeId] = MOCK_PLAYER_NAMES[i];
      }

      await gameManager.startGame(input.gameId, 'literature', playerIds);
      return { alreadyStarted: false, playerNames };
    }),
  /** Perform a game action */
  performAction: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        playerId: z.string(),
        action: z.object({ type: z.string() }).passthrough(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await gameManager.handleAction(input.gameId, input.playerId, input.action);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to perform action';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }
    }),

  /** Get current game state for the requesting player */
  getState: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string() }))
    .query(({ input }) => {
      try {
        return gameManager.getPlayerView(input.gameId, input.playerId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Game not found';
        throw new TRPCError({ code: 'NOT_FOUND', message });
      }
    }),

  /** Subscribe to real-time game updates */
  onGameUpdate: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string() }))
    .subscription(async function* ({ input, signal }) {
      const { gameId, playerId } = input;
      const events: ServerEvent[] = [];
      let resolve: (() => void) | null = null;

      const unsubscribe = gameManager.subscribe(gameId, playerId, (event) => {
        events.push(event);
        resolve?.();
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
