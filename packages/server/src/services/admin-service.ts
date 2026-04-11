import { GameStateMachine } from '@the-green-felt/engine';
import { gameManager } from './game-manager.js';
import { gameRegistry } from '../games/registry.js';
import type { AdminActionLogEntry } from './game-manager.js';

export interface GameInfo {
  gameId: string;
  gameTypeId: string;
  players: Array<{ id: string; name: string }>;
  activePlayer: string | null;
  actionCount: number;
  seed: number | undefined;
}

export interface TestGameResult {
  gameId: string;
  players: Array<{ id: string; name: string }>;
  seed: number | undefined;
}

const MOCK_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank'];

class AdminService {
  /** Create a test game with mock players. */
  async createTestGame(playerCount: number, seed?: number): Promise<TestGameResult> {
    const gameId = `admin-${Date.now()}`;
    const players: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < playerCount; i++) {
      players.push({
        id: `admin-p${i + 1}`,
        name: MOCK_NAMES[i] ?? `Player ${i + 1}`,
      });
    }

    const playerIds = players.map((p) => p.id);
    await gameManager.startGame(gameId, 'literature', playerIds, seed);

    return { gameId, players, seed };
  }

  /** Remove a game entirely. */
  destroyGame(gameId: string): void {
    gameManager.destroyGame(gameId);
  }

  /** Get the full authoritative state (god mode). */
  getFullState(gameId: string): unknown {
    const game = gameManager.getActiveGame(gameId);
    if (!game?.machine) throw new Error(`Game ${gameId} not found`);
    return game.machine.serialize();
  }

  /** Get a specific player's filtered view. */
  getPlayerView(gameId: string, playerId: string): unknown {
    return gameManager.getPlayerView(gameId, playerId);
  }

  /** Get the action log for a game. */
  getActionLog(gameId: string): AdminActionLogEntry[] {
    const game = gameManager.getActiveGame(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);
    return [...game.actionLog];
  }

  /** Get game metadata. */
  getGameInfo(gameId: string): GameInfo {
    const game = gameManager.getActiveGame(gameId);
    if (!game?.machine) throw new Error(`Game ${gameId} not found`);

    return {
      gameId,
      gameTypeId: game.gameTypeId,
      players: game.players.map((id, i) => ({
        id,
        name: MOCK_NAMES[i] ?? `Player ${i + 1}`,
      })),
      activePlayer: game.machine.getActivePlayer(),
      actionCount: game.actionLog.filter((e) => e.result === 'success').length,
      seed: game.seed,
    };
  }

  /** Dispatch an action as any player. Returns result instead of throwing. */
  async dispatchAs(
    gameId: string,
    playerId: string,
    action: { type: string; [key: string]: unknown },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await gameManager.handleAction(gameId, playerId, action);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /** Suggest a random valid move for a player. */
  suggestMove(gameId: string, playerId: string): { action: Record<string, unknown> } | null {
    const game = gameManager.getActiveGame(gameId);
    if (!game?.machine) throw new Error(`Game ${gameId} not found`);

    // Dynamic import of move generator based on game type
    const generator = moveGenerators[game.gameTypeId];
    if (!generator) return null;

    const state = game.machine.serialize();
    return generator(state, playerId);
  }

  /** Read-only: compute state at a given action index without modifying the live game. */
  getStateAtIndex(
    gameId: string,
    actionIndex: number,
  ): { state: unknown; views: Record<string, unknown> } {
    const game = gameManager.getActiveGame(gameId);
    if (!game?.machine) throw new Error(`Game ${gameId} not found`);

    const plugin = gameRegistry.get(game.gameTypeId);
    if (!plugin) throw new Error(`Unknown plugin: ${game.gameTypeId}`);

    // Replay from seed up to actionIndex
    const replayMachine = new GameStateMachine(plugin, game.players, game.seed);
    const successfulActions = game.actionLog.filter((e) => e.result === 'success');

    for (let i = 0; i <= actionIndex && i < successfulActions.length; i++) {
      const entry = successfulActions[i];
      const result = replayMachine.dispatch(entry.playerId, entry.action as never);
      if (!result.success) {
        throw new Error(`Replay failed at action ${i}: ${result.error}`);
      }
    }

    const state = replayMachine.serialize();
    const views: Record<string, unknown> = {};
    for (const pid of game.players) {
      views[pid] = replayMachine.getViewForPlayer(pid);
    }

    return { state, views };
  }

  /** Destructive: rewind the live game to a given action index. */
  async rewindTo(gameId: string, actionIndex: number): Promise<void> {
    const game = gameManager.getActiveGame(gameId);
    if (!game?.machine) throw new Error(`Game ${gameId} not found`);

    const plugin = gameRegistry.get(game.gameTypeId);
    if (!plugin) throw new Error(`Unknown plugin: ${game.gameTypeId}`);

    // Replay from seed up to actionIndex
    const replayMachine = new GameStateMachine(plugin, game.players, game.seed);
    const successfulActions = game.actionLog.filter((e) => e.result === 'success');

    for (let i = 0; i <= actionIndex && i < successfulActions.length; i++) {
      const entry = successfulActions[i];
      const result = replayMachine.dispatch(entry.playerId, entry.action as never);
      if (!result.success) {
        throw new Error(`Replay failed at action ${i}: ${result.error}`);
      }
    }

    // Replace live machine
    game.machine = replayMachine;

    // Truncate action log to only the replayed successful entries (re-index)
    const kept = successfulActions.slice(0, actionIndex + 1);
    game.actionLog = kept.map((entry, i) => ({ ...entry, index: i }));

    // Broadcast updated views to all subscribers
    for (const pid of game.players) {
      const view = replayMachine.getViewForPlayer(pid);
      gameManager['broadcastToPlayer'](gameId, pid, {
        type: 'GAME_STATE',
        view,
        activePlayer: replayMachine.getActivePlayer(),
      });
    }
  }
}

// Move generator registry — add entries as new games are implemented
type MoveGenerator = (state: unknown, playerId: string) => { action: Record<string, unknown> } | null;
const moveGenerators: Record<string, MoveGenerator> = {};

/** Register a move generator for a game type. */
export function registerMoveGenerator(gameTypeId: string, generator: MoveGenerator): void {
  moveGenerators[gameTypeId] = generator;
}

export const adminService = new AdminService();
