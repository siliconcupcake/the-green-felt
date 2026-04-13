# The Green Felt

An online card game platform built around a game-agnostic deck engine. Implement a single `GamePlugin` interface to add any card game — the platform handles networking, persistence, lobbies, and rendering.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/) >= 9.0.0
- [Docker](https://www.docker.com/) (for local MongoDB)
- [MongoDB](https://www.mongodb.com/) (local or hosted)

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd the-green-felt

# Install dependencies
pnpm install

# Set up environment variables
cp packages/server/.env.example packages/server/.env
# Edit .env with your MongoDB connection string (default: mongodb://localhost:27017/the-green-felt)
```

### Local MongoDB (Docker)

The easiest way to get MongoDB running locally:

```bash
# Start a MongoDB 7 container with a persistent data volume
docker run -d --name mongodb-green-felt -p 27017:27017 -v mongodb-green-felt-data:/data/db mongo:7
```

The default `.env` already points to `mongodb://localhost:27017/the-green-felt`, so no changes are needed.

| Command | Description |
|---------|-------------|
| `docker stop mongodb-green-felt` | Stop the container |
| `docker start mongodb-green-felt` | Restart the container |
| `docker logs mongodb-green-felt` | View MongoDB logs |
| `docker rm -f mongodb-green-felt && docker volume rm mongodb-green-felt-data` | Remove container and data |

### Initialize the Database

```bash
# Generate Prisma client
pnpm --filter @the-green-felt/server db:generate

# Push the database schema
pnpm --filter @the-green-felt/server db:push
```

## Development

```bash
# Start all packages in dev mode (server + client)
pnpm dev

# Or start packages individually
pnpm --filter @the-green-felt/server dev    # Server on http://localhost:3001
pnpm --filter @the-green-felt/client dev    # Client on http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in watch mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |

## Project Structure

```
the-green-felt/
├── packages/
│   ├── shared/    # Types, interfaces, and the GamePlugin contract
│   ├── engine/    # Pure deck engine (Deck, Hand, CardSet, StateMachine)
│   ├── server/    # Fastify + tRPC + Prisma backend
│   └── client/    # React + Vite frontend
```

See [DESIGN.md](DESIGN.md) for detailed architecture documentation.

## Adding a New Game

1. Define your game state, player view, and action types in `packages/server/src/games/<name>/types.ts`
2. Implement the `GamePlugin` interface in `packages/server/src/games/<name>/index.ts`
3. Register it in `packages/server/src/games/registry.ts`
4. Build the board UI in `packages/client/src/games/<name>/`

That's it — no new routes, socket events, or database models needed.

## License

MIT
