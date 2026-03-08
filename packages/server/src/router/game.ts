import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

export const gameRouter = router({
  /** Perform a game action */
  performAction: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        action: z.object({ type: z.string() }).passthrough(),
      }),
    )
    .mutation(({ input }) => {
      // TODO: Implement — look up GameStateMachine, dispatch action, broadcast views
      void input;
      throw new Error('Not yet implemented');
    }),

  /** Get current game state for the requesting player */
  getState: publicProcedure.input(z.object({ gameId: z.string() })).query(({ input }) => {
    // TODO: Implement — return player-specific view
    void input;
    throw new Error('Not yet implemented');
  }),

  /** Subscribe to real-time game updates */
  onGameUpdate: publicProcedure.input(z.object({ gameId: z.string() })).subscription(({ input }) => {
    // TODO: Implement — return observable of ServerEvent
    void input;
    throw new Error('Not yet implemented');
  }),
});
