# The Green Felt — Design Document

An online card game platform built around a game-agnostic deck engine. Game authors implement a single `GamePlugin` interface to add new card games — the platform handles networking, persistence, lobbies, and rendering.

## Prior Art

This project is a modernized successor to `backend.cards.io` and `frontend.cards.io`, which implemented the Literature card game using Node.js/Express/Socket.io on the backend and React/Redux/PixiJS on the frontend. Key lessons from the previous implementation:

**What worked well:**
- Separation of engine (`src/engine/`) from game-specific code (`src/games/literature/`)
- Socket.io for real-time multiplayer communication
- MongoDB change streams for automatic state broadcasting

**What we're improving:**
- Engine mixed I/O with logic — the new engine is pure (no side effects)
- String-based card IDs (`"2C"`) had no compile-time safety — now using branded types
- Adding a game required wiring routes, socket events, models, reducers — now just one interface
- Two separate repos with duplicated types — now a single monorepo
- Redux boilerplate — replaced with Zustand
- PixiJS overkill for card rendering — replaced with CSS transforms

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      pnpm monorepo                          │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │  shared  │   │  engine  │   │  server  │   │  client  │  │
│  │          │   │          │   │          │   │          │  │ 
│  │ Types &  │◄──│ Deck,    │◄──│ Fastify, │   │ React,   │  │
│  │ Plugin   │   │ Hand,    │   │ tRPC,    │   │ Vite,    │  │
│  │ Contract │◄──│ State    │   │ Prisma,  │   │ Zustand  │  │
│  │          │   │ Machine  │   │ Games    │   │          │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│       ▲              ▲              │               │       │
│       └──────────────┘              │               │       │
│            ▲                        │               │       │
│            └────────────────────────┘               │       │
│       ▲                                             │       │
│       └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Graph

```
shared (zero dependencies)
  ↑
engine (depends on shared)
  ↑
server (depends on engine + shared)

shared
  ↑
client (depends on shared only — NOT engine)
```

The client never imports `engine`. Game logic runs exclusively server-side to prevent cheating. The client receives pre-computed player views.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript 5.7+ | Full type safety across the stack |
| **Monorepo** | pnpm workspaces | Strict hoisting, fast installs, shared types |
| **Server** | Fastify 5 | Faster than Express, better TypeScript support |
| **API** | tRPC 11 | End-to-end type safety, WebSocket subscriptions |
| **Database** | MongoDB + Prisma | Document-shaped game state, typed queries |
| **Client** | React 19 + Vite 6 | Modern React with fast HMR |
| **State** | Zustand 5 | Minimal boilerplate, TypeScript-first |
| **Routing** | React Router 7 | Client-side navigation |
| **Testing** | Vitest 3 | Fast, Vite-native, workspace-aware |
| **Card Rendering** | CSS transforms | Lightweight, accessible, no canvas needed |

---

## Package Details

### `@the-green-felt/shared`

Zero-dependency package containing all TypeScript types and interfaces shared across the stack:

- **Card primitives**: `Rank`, `Suit`, `Card`, `JokerCard`, `AnyCard`, branded `CardId`
- **Deck configs**: `DeckConfig` interface + presets (`STANDARD_52`, `STANDARD_54`, `PINOCHLE_48`, `EUCHRE_24`)
- **Game plugin contract**: `GamePlugin<TState, TPlayerView, TAction>` — the core interface every game implements
- **Protocol types**: `ServerEvent`, `LobbyRoom`, `ErrorCode` — client/server communication
- **Persistence types**: `PersistedGameState`, `ActionLogEntry`

### `@the-green-felt/engine`

Pure game engine with zero I/O. Every class is immutable — mutations return new instances.

- **`Deck`**: Create from config, shuffle (Fisher-Yates with optional seed), draw, peek, deal
- **`Hand`**: Add/remove cards, has/find, sort, group by suit, filter
- **`CardSet`**: Set operations (union, intersection, difference) for validating melds and sets
- **`GameStateMachine`**: Wraps any `GamePlugin`, handles deck creation, action dispatch, view computation
- **`TestHarness`**: Test game plugins without a server — feed actions, inspect player views

### `@the-green-felt/server`

HTTP + WebSocket server that orchestrates games:

- **`GameManager`**: Creates `GameStateMachine` instances, persists state, broadcasts views via subscriptions
- **`GameRegistry`**: Plugin discovery — register game plugins at startup, look up by ID
- **tRPC routers**: `lobby` (room CRUD), `game` (actions + subscriptions)
- **Prisma**: MongoDB models for Users, Games, Lobbies
- **Game plugins**: Each game lives in `src/games/[name]/` with `index.ts` (plugin) + `types.ts` (state/actions)

### `@the-green-felt/client`

React SPA consuming tRPC subscriptions:

- **Zustand stores**: `connectionStore` (auth state), `gameStore` (current game view)
- **Card components**: `<Card>`, `<CardFan>`, `<CardStack>` — CSS-based, no canvas
- **Game UI plugins**: Each game provides a `BoardComponent` that receives `view` + `dispatch`
- **tRPC client**: Typed queries/mutations + WebSocket subscriptions

---

## The GamePlugin Interface

This is the central contract of the entire platform:

```typescript
interface GamePlugin<TState, TPlayerView, TAction extends { type: string }> {
  readonly metadata: GameMetadata;              // name, player count, deck config
  setup(players: string[], deck: AnyCard[]): TState;            // initial state
  validate(state: TState, playerId: string, action: TAction): string | null;  // legal?
  reduce(state: TState, playerId: string, action: TAction): TState;           // next state
  getPlayerView(state: TState, playerId: string): TPlayerView;                // hide info
  checkGameOver(state: TState): GameResult | null;              // terminal check
  getActivePlayer(state: TState): string | null;                // whose turn
}
```

**Key properties:**
- All methods are **pure functions** — no I/O, no mutation, deterministic
- `TState` is the full authoritative state (server-only, never sent to clients)
- `TPlayerView` is a filtered projection (sent to each player, may differ per player)
- `TAction` is a discriminated union — TypeScript enforces exhaustive handling

---

## Adding a New Game

To add a new card game (e.g., Rummy), a developer creates:

### 1. Game types (`packages/server/src/games/rummy/types.ts`)

Define the game-specific state, player view, and action types.

### 2. Game plugin (`packages/server/src/games/rummy/index.ts`)

Implement `GamePlugin<RummyState, RummyPlayerView, RummyAction>` — pure logic only.

### 3. Register the plugin (`packages/server/src/games/registry.ts`)

```typescript
import { rummyPlugin } from './rummy/index.js';
gameRegistry.register(rummyPlugin);
```

### 4. Game UI (`packages/client/src/games/rummy/RummyBoard.tsx`)

A React component receiving the player view and an action dispatcher. Use the shared `<Card>`, `<CardFan>`, etc. components.

### 5. Register the UI

Register the board component in the client-side game registry.

**That's it.** No new API routes, no new WebSocket events, no new database models, no new Redux reducers. The platform handles all of that generically through the `GamePlugin` contract and `GameStateMachine`.

---

## Data Flow

### Game Action Flow

```
Player clicks "Ask for Ace of Spades"
  → Client dispatches tRPC mutation: game.performAction({ gameId, action })
  → Server: GameManager.handleAction()
    → GameStateMachine.dispatch(playerId, action)
      → plugin.validate(state, playerId, action) — legal?
      → plugin.reduce(state, playerId, action) — new state
      → plugin.getPlayerView(newState, eachPlayer) — filtered views
      → plugin.checkGameOver(newState) — game ended?
    → Persist state to MongoDB
    → Broadcast ServerEvent to each player's subscription
  → Client: Zustand store updates → React re-renders
```

### Lobby Flow

```
Host creates room → Server stores in Lobby collection → Room code generated
Players join room → Server adds to Lobby, broadcasts PLAYER_JOINED
All ready → Host starts → Server creates GameStateMachine, game begins
```

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| **Shared** | Unit tests for type guards and utility functions |
| **Engine** | Unit tests for Deck, Hand, CardSet, shuffle distribution |
| **Game Plugins** | Integration tests via `TestHarness` — full game scenarios without a server |
| **Server** | Integration tests for tRPC routers and GameManager lifecycle |
| **Client** | Component tests with React Testing Library |
| **E2E** | Playwright (future) — full game flow from lobby to conclusion |

The `TestHarness` is the most important testing tool. Example:

```typescript
const harness = new TestHarness(literaturePlugin, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], 42);

// Deterministic seed → known card distribution
const view = harness.viewFor('p1');
expect(view.myHand).toHaveLength(8);

// Test an invalid action
const result = harness.tryAct('p2', { type: 'ASK_CARD', target: 'p1', card: 'AH' as CardId });
expect(result.success).toBe(false); // not p2's turn
```

---

## Project Structure

```
the-green-felt/
├── DESIGN.md
├── package.json                     # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.workspace.ts
├── .gitignore
├── .prettierrc
│
├── packages/
│   ├── shared/                      # Zero-dependency types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── card.ts              # Rank, Suit, Card, CardId
│   │       ├── deck-config.ts       # DeckConfig + presets
│   │       ├── game-plugin.ts       # GamePlugin interface ★
│   │       ├── game-state.ts        # PersistedGameState
│   │       ├── protocol.ts          # ServerEvent, LobbyRoom
│   │       └── errors.ts            # GameError
│   │
│   ├── engine/                      # Pure game engine, no I/O
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── deck.ts              # Immutable Deck class
│   │       ├── hand.ts              # Immutable Hand class
│   │       ├── card-set.ts          # Set operations on cards
│   │       ├── shuffle.ts           # Fisher-Yates + seeded RNG
│   │       ├── state-machine.ts     # GameStateMachine ★
│   │       ├── test-harness.ts      # TestHarness for plugins
│   │       └── __tests__/
│   │
│   ├── server/                      # Fastify + tRPC + Prisma
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── index.ts
│   │       ├── trpc.ts
│   │       ├── router/
│   │       │   ├── index.ts         # AppRouter (exported type)
│   │       │   ├── lobby.ts
│   │       │   └── game.ts
│   │       ├── services/
│   │       │   └── game-manager.ts  # GameManager ★
│   │       └── games/
│   │           ├── registry.ts      # Plugin registry
│   │           └── literature/
│   │               ├── index.ts     # GamePlugin implementation
│   │               └── types.ts     # State, View, Action types
│   │
│   └── client/                      # React + Vite
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── trpc.ts
│           ├── stores/
│           │   ├── connection-store.ts
│           │   └── game-store.ts
│           ├── components/
│           │   └── card/
│           │       ├── Card.tsx
│           │       ├── CardFan.tsx
│           │       └── card.css
│           └── games/
│               └── literature/
│                   └── LiteratureBoard.tsx
```

---

## Improvements Over Previous Implementation

| Aspect | Before (cards.io) | After (The Green Felt) |
|--------|-------------------|----------------------|
| Type safety | String card IDs, no shared types | Branded `CardId`, shared package, tRPC e2e |
| Game logic | Mixed with Express routes / Socket handlers | Pure functions, zero I/O coupling |
| Adding a game | api.ts + controller.ts + validator.ts + model + routes + socket events + reducers | Implement `GamePlugin`, register, done |
| Real-time | Socket.io 2.3 with string event names | tRPC subscriptions with typed events |
| State mgmt | Redux with boilerplate | Zustand with minimal code |
| Card rendering | PixiJS (heavyweight canvas) | CSS transforms (lightweight, accessible) |
| Testing | No test harness | `TestHarness` for server-free game testing |
| Repository | Two separate repos | Single pnpm monorepo |
| Build | tsc + Create React App | tsc + Vite |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development (all packages)
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Type check
pnpm typecheck
```

---

## Next Steps

1. **Implement the `Deck` and `Hand` classes** with full unit tests
2. **Complete the Literature game plugin** — port logic from `backend.cards.io`
3. **Wire up tRPC** — Fastify adapter, WebSocket subscriptions
4. **Build the lobby UI** — create/join rooms, player list
5. **Build the game table UI** — card fan, action buttons, game log
6. **Add authentication** — user accounts, session management
7. **Add a second game** (e.g., Rummy, Hearts) to validate the plugin system
8. **E2E tests** with Playwright
