import { router } from '../trpc.js';
import { lobbyRouter } from './lobby.js';
import { gameRouter } from './game.js';

export const appRouter = router({
  lobby: lobbyRouter,
  game: gameRouter,
});

/** Export type for client-side type inference */
export type AppRouter = typeof appRouter;
