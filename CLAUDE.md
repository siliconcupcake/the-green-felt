# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Green Felt is an online card game platform built around a game-agnostic deck engine. Game authors implement a single `GamePlugin` interface — the platform handles networking, persistence, lobbies, and rendering. The reference game is Literature (a team-based card game for 6 players).

## First-Time Setup

```bash
pnpm install
cp packages/server/.env.example packages/server/.env   # set DATABASE_URL if needed
pnpm --filter @the-green-felt/server db:generate        # generate Prisma client
pnpm --filter @the-green-felt/server db:push             # push schema to MongoDB
```

## Commands

```bash
# Dev (all packages in parallel — server :3001, client :3000 with proxy)
pnpm dev

# Run a single package
pnpm --filter @the-green-felt/server dev
pnpm --filter @the-green-felt/client dev

# Build all packages
pnpm build

# Tests
pnpm test                # run all tests once
pnpm test:watch          # vitest watch mode

# Run a single test file
pnpm --filter @the-green-felt/engine vitest run src/__tests__/deck.test.ts

# Type checking
pnpm typecheck

# Lint
pnpm lint
pnpm lint:fix

# Prisma (server package)
pnpm --filter @the-green-felt/server db:generate   # regenerate Prisma client
pnpm --filter @the-green-felt/server db:push        # push schema to MongoDB

# Docker deployment
cd deploy && docker compose up --build
```

## Architecture

**Monorepo** — pnpm workspaces with 4 packages. Build order: `shared` → `engine` → `server`/`client`.

### Dependency Graph

```
shared (zero deps — types, GamePlugin contract, card primitives)
  ↑
engine (pure game logic — Deck, Hand, CardSet, GameStateMachine, TestHarness)
  ↑
server (Fastify 5 + tRPC 11 + Prisma/MongoDB — orchestrates games, broadcasts views)

shared
  ↑
client (React 19 + Vite 6 + Zustand 5 — receives pre-computed views via tRPC subscriptions)
```

**Critical constraint:** The client depends on `shared` only, never on `engine`. All game logic runs server-side to prevent cheating. Clients receive filtered player views.

### The GamePlugin Contract

The central interface every game implements (`packages/shared/src/game-plugin.ts`):

- `setup(players, deck)` → initial state
- `validate(state, playerId, action)` → error string or null
- `reduce(state, playerId, action)` → next state (pure function)
- `getPlayerView(state, playerId)` → filtered view per player
- `checkGameOver(state)` → GameResult or null
- `getActivePlayer(state)` → whose turn

All methods are pure functions with no I/O. `TState` is the full authoritative state (server-only). `TPlayerView` is what each player sees. `TAction` is a discriminated union.

### Data Flow

```
Client action → tRPC mutation → GameManager.handleAction()
  → GameStateMachine.dispatch() → plugin.validate() → plugin.reduce()
  → plugin.getPlayerView() per player → persist to MongoDB
  → broadcast via tRPC subscription → Zustand store → React re-render
```

Server exposes tRPC over both HTTP (`fastifyTRPCPlugin`) and WebSocket (`applyWSSHandler`). The client currently uses `httpBatchLink` for queries/mutations and `httpSubscriptionLink` (SSE) for real-time subscriptions.

### Key Files

| File | Role |
|------|------|
| `packages/shared/src/game-plugin.ts` | GamePlugin interface — the core contract |
| `packages/shared/src/card.ts` | Card, Rank, Suit, branded CardId type |
| `packages/engine/src/state-machine.ts` | GameStateMachine — wraps plugins, dispatches actions |
| `packages/engine/src/test-harness.ts` | TestHarness — test game plugins without a server |
| `packages/server/src/services/game-manager.ts` | GameManager — orchestrates state machines, persists, broadcasts |
| `packages/server/src/games/registry.ts` | GameRegistry — plugin discovery by ID |
| `packages/server/src/router/index.ts` | AppRouter — main tRPC router (exported type used by client) |
| `packages/server/prisma/schema.prisma` | MongoDB models: User, Player, Game |
| `packages/client/src/trpc.ts` | tRPC client (HTTP batch + SSE subscriptions) |
| `packages/client/src/stores/` | Zustand stores (connection, game, lobby state) |

### Adding a New Game

1. Define types in `packages/server/src/games/<name>/types.ts`
2. Implement `GamePlugin` in `packages/server/src/games/<name>/index.ts`
3. Register in `packages/server/src/games/registry.ts`
4. Build board UI in `packages/client/src/games/<name>/`

No new routes, socket events, or database models needed.

### Testing Game Plugins

Use `TestHarness` from `@the-green-felt/engine` to test plugins without a server:

```typescript
const harness = new TestHarness(plugin, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], 42);
const view = harness.viewFor('p1');
// act() throws on validation failure; tryAct() returns { success, error? }
const result = harness.tryAct('p1', { type: 'ASK_CARD', targetPlayer: 'p3', card: 'AH' as CardId });
```

Deterministic seeds produce known card distributions for reproducible tests.

## Code Style

- **No default exports** — `import/no-default-export` is enforced
- **No inline styles on React components** — use CSS classes (`react/forbid-component-props` bans `style`)
- **Underscore-prefix for unused vars** — `_unusedVar` is allowed, `unusedVar` is an error
- **Import ordering** — builtin → external → internal → parent → sibling → index (no blank lines between groups)
- **Prettier** — single quotes, trailing commas, semicolons, 120 char width, 2-space indent
- **Immutable engine classes** — Deck, Hand, CardSet return new instances on mutation
- **Branded types** — use `CardId` (branded string), construct via `makeCardId('AS')`

## Tech Stack

TypeScript 5.7+, Node.js 22+, pnpm 9+, Fastify 5, tRPC 11, Prisma 6 + MongoDB, React 19, Vite 6, Zustand 5, React Router 7, React Bootstrap, Vitest 3, Zod for validation. Card rendering uses CSS transforms (no canvas).
