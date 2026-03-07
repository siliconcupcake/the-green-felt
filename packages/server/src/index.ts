import Fastify from 'fastify';
// import { gameRegistry } from './games/registry.js';
// import { literaturePlugin } from './games/literature/index.js';

// Register game plugins
// gameRegistry.register(literaturePlugin);

const server = Fastify({ logger: true });

// TODO: Set up tRPC with Fastify adapter
// TODO: Set up WebSocket server for tRPC subscriptions
// TODO: Set up Prisma client

const PORT = Number(process.env.PORT ?? 3001);

async function start() {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
