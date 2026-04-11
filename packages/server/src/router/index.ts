import { router } from '../trpc.js';
import { lobbyRouter } from './lobby.js';
import { gameRouter } from './game.js';
import { adminRouter } from './admin.js';

const isDev = process.env.NODE_ENV !== 'production';

export const appRouter = router({
  lobby: lobbyRouter,
  game: gameRouter,
  ...(isDev ? { admin: adminRouter } : {}),
});

/** Export type for client-side type inference */
export type AppRouter = typeof appRouter;
