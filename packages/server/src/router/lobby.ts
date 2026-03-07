import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { gameRegistry } from '../games/registry.js';

export const lobbyRouter = router({
  /** List all available game types */
  listGameTypes: publicProcedure.query(() => {
    return gameRegistry.getAll().map((plugin) => ({
      id: plugin.metadata.id,
      displayName: plugin.metadata.displayName,
      minPlayers: plugin.metadata.minPlayers,
      maxPlayers: plugin.metadata.maxPlayers,
      description: plugin.metadata.description,
    }));
  }),

  /** Create a new lobby room */
  createRoom: publicProcedure
    .input(z.object({ gameId: z.string(), playerName: z.string() }))
    .mutation(({ input }) => {
      // TODO: Implement — create lobby in database, return room ID
      void input;
      throw new Error('Not yet implemented');
    }),

  /** Join an existing lobby room */
  joinRoom: publicProcedure
    .input(z.object({ roomId: z.string(), playerName: z.string() }))
    .mutation(({ input }) => {
      // TODO: Implement
      void input;
      throw new Error('Not yet implemented');
    }),
});
