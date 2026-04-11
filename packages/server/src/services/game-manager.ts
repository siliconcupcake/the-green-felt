import type { AnyCard, ServerEvent } from '@the-green-felt/shared';
import { GameStateMachine } from '@the-green-felt/engine';
import { gameRegistry } from '../games/registry.js';

type Subscriber = (event: ServerEvent) => void;

interface ActiveGame {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  machine: GameStateMachine<any, any, any>;
  players: string[];
  subscribers: Map<string, Set<Subscriber>>;
}

/**
 * Manages active game sessions.
 * Bridges the engine (pure logic) with the server (I/O, persistence, subscriptions).
 */
export class GameManager {
  private readonly activeGames = new Map<string, ActiveGame>();

  /** Start a new game from a lobby room. Returns the game ID. */
  async startGame(gameId: string, gameTypeId: string, players: string[], seed?: number): Promise<string> {
    const plugin = gameRegistry.get(gameTypeId);
    if (!plugin) {
      throw new Error(`Unknown game plugin: ${gameTypeId}`);
    }

    const machine = new GameStateMachine(plugin, players, seed);

    // Preserve any subscribers that were registered before the game started
    const existing = this.activeGames.get(gameId);
    const subscribers = existing?.subscribers ?? new Map<string, Set<Subscriber>>();
    this.activeGames.set(gameId, { machine, players, subscribers });

    const state = machine.serialize() as {
      hands?: Record<string, AnyCard[]>;
      teams?: Record<string, string[]>;
      drawPile?: AnyCard[];
      discardPile?: AnyCard[];
    };

    if (state.hands) {
      // Build teams map (normalize from plugin-specific shape like { teamA, teamB })
      const teams: Record<string, string[]> = {};
      if (state.teams) {
        const raw = state.teams as Record<string, string[]>;
        for (const [key, members] of Object.entries(raw)) {
          const label = key.replace(/^team/, '');
          teams[label] = members;
        }
      }

      const drawPileCount = state.drawPile?.length ?? 0;
      const discardPile = state.discardPile ?? [];

      // Broadcast personalized DEAL_SEQUENCE to each player
      for (const playerId of players) {
        // Rotate seat order so the subscribing player is index 0
        const myIndex = players.indexOf(playerId);
        const seatOrder = [...players.slice(myIndex), ...players.slice(0, myIndex)];

        this.broadcastToPlayer(gameId, playerId, {
          type: 'DEAL_SEQUENCE',
          seatOrder,
          myCardIds: (state.hands[playerId] ?? []).map((c) => c.id),
          teams,
          drawPileCount,
          discardPileIds: discardPile.map((c) => c.id),
        });
      }
    }

    // Broadcast initial state to all players
    for (const playerId of players) {
      this.broadcastToPlayer(gameId, playerId, {
        type: 'GAME_STATE',
        view: machine.getViewForPlayer(playerId),
        activePlayer: machine.getActivePlayer(),
      });
    }

    // TODO: Persist initial state to database

    return gameId;
  }

  /** Process a player action. */
  async handleAction(gameId: string, playerId: string, action: { type: string }): Promise<void> {
    const game = this.activeGames.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    const result = game.machine.dispatch(playerId, action as never);

    if (!result.success) {
      this.broadcastToPlayer(gameId, playerId, {
        type: 'ACTION_REJECTED',
        reason: result.error,
      });
      return;
    }

    // Broadcast updated views to all players
    for (const [pid, view] of result.views) {
      this.broadcastToPlayer(gameId, pid, {
        type: 'GAME_STATE',
        view,
        activePlayer: game.machine.getActivePlayer(),
      });
    }

    // Check for game over
    if (result.result) {
      for (const pid of game.players) {
        this.broadcastToPlayer(gameId, pid, {
          type: 'GAME_OVER',
          result: result.result,
        });
      }
    }

    // TODO: Persist updated state to database
  }

  /** Get the player-specific view for a game. */
  getPlayerView(gameId: string, playerId: string): unknown {
    const game = this.activeGames.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);
    return game.machine.getViewForPlayer(playerId);
  }

  /** Subscribe a player to game events. Returns unsubscribe function. */
  subscribe(gameId: string, playerId: string, callback: Subscriber): () => void {
    let game = this.activeGames.get(gameId);

    // Allow subscribing before the game exists — create a placeholder
    if (!game) {
      game = { machine: null as never, players: [], subscribers: new Map() };
      this.activeGames.set(gameId, game);
    }

    if (!game.subscribers.has(playerId)) {
      game.subscribers.set(playerId, new Set());
    }
    game.subscribers.get(playerId)!.add(callback);

    return () => {
      game.subscribers.get(playerId)?.delete(callback);
    };
  }

  /** Check if a game is active (has a real state machine). */
  hasGame(gameId: string): boolean {
    const game = this.activeGames.get(gameId);
    return game != null && game.machine != null;
  }

  /** Reset a game — removes it but keeps subscribers so a new game can be started. */
  resetGame(gameId: string): void {
    const game = this.activeGames.get(gameId);
    if (!game) return;
    // Keep subscribers, clear the machine and players
    game.machine = null as never;
    game.players = [];
  }

  /** List all active game IDs (for debug). */
  listGames(): Array<{ gameId: string; playerCount: number; subscriberCount: number }> {
    const result: Array<{ gameId: string; playerCount: number; subscriberCount: number }> = [];
    for (const [gameId, game] of this.activeGames) {
      if (game.machine) {
        let subscriberCount = 0;
        for (const subs of game.subscribers.values()) subscriberCount += subs.size;
        result.push({ gameId, playerCount: game.players.length, subscriberCount });
      }
    }
    return result;
  }

  private broadcastToPlayer(gameId: string, playerId: string, event: ServerEvent): void {
    const game = this.activeGames.get(gameId);
    if (!game) return;
    const subs = game.subscribers.get(playerId);
    if (!subs) return;
    for (const cb of subs) {
      cb(event);
    }
  }
}

export const gameManager = new GameManager();
