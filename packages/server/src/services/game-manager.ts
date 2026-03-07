import type { GamePlugin, GameResult } from '@the-green-felt/shared';
import type { ServerEvent } from '@the-green-felt/shared';
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
  async startGame(
    gameId: string,
    pluginId: string,
    players: string[],
    seed?: number,
  ): Promise<string> {
    const plugin = gameRegistry.get(pluginId);
    if (!plugin) {
      throw new Error(`Unknown game plugin: ${pluginId}`);
    }

    const machine = new GameStateMachine(plugin, players, seed);
    this.activeGames.set(gameId, { machine, players, subscribers: new Map() });

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
  async handleAction(
    gameId: string,
    playerId: string,
    action: { type: string },
  ): Promise<void> {
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

  /** Subscribe a player to game events. Returns unsubscribe function. */
  subscribe(gameId: string, playerId: string, callback: Subscriber): () => void {
    const game = this.activeGames.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    if (!game.subscribers.has(playerId)) {
      game.subscribers.set(playerId, new Set());
    }
    game.subscribers.get(playerId)!.add(callback);

    return () => {
      game.subscribers.get(playerId)?.delete(callback);
    };
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
