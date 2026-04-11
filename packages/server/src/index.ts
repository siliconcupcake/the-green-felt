import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from './router/index.js';
import type { Context } from './trpc.js';
import { gameRegistry } from './games/registry.js';
import { literaturePlugin } from './games/literature/index.js';
import { registerDebugRoutes } from './router/debug.js';
import { registerMoveGenerator } from './services/admin-service.js';
import { literatureMoveGenerator } from './games/literature/move-generator.js';

// Register game plugins
gameRegistry.register(literaturePlugin);

// Register move generators for admin console
registerMoveGenerator('literature', literatureMoveGenerator);

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });

// Debug controller (development only)
await registerDebugRoutes(server);

// HTTP tRPC handler (queries + mutations)
await server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: (): Context => ({
      userId: null, // TODO: extract from auth header/session
    }),
  },
});

const PORT = Number(process.env.PORT ?? 3001);

async function start() {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });

    // WebSocket tRPC handler (subscriptions)
    // Attach to Fastify's underlying HTTP server after it starts listening
    const wss = new WebSocketServer({ server: server.server });
    applyWSSHandler({
      wss,
      router: appRouter,
      createContext: (): Context => ({
        userId: null,
      }),
    });

    console.log(`Server listening on port ${PORT} (HTTP + WebSocket)`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
