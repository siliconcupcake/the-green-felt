import type { GamePlugin, GameResult } from '@the-green-felt/shared';
import { GameStateMachine } from './state-machine.js';

/**
 * Test harness for game plugins.
 * Enables testing game logic without a server, database, or network.
 *
 * @example
 * ```ts
 * const harness = new TestHarness(literaturePlugin, ['alice', 'bob', 'charlie'], 42);
 * harness.act('alice', { type: 'ASK_CARD', target: 'bob', card: 'AH' });
 * expect(harness.viewFor('alice').hand).toContain(...);
 * ```
 */
export class TestHarness<TState, TPlayerView, TAction extends { type: string }> {
  private readonly machine: GameStateMachine<TState, TPlayerView, TAction>;

  constructor(
    private readonly plugin: GamePlugin<TState, TPlayerView, TAction>,
    private readonly players: string[],
    seed?: number,
  ) {
    this.machine = new GameStateMachine(plugin, players, seed);
  }

  /** Perform an action. Throws if validation fails. */
  act(playerId: string, action: TAction): void {
    const result = this.machine.dispatch(playerId, action);
    if (!result.success) {
      throw new Error(`Action rejected: ${result.error}`);
    }
  }

  /** Try an action and return the result without throwing. */
  tryAct(playerId: string, action: TAction): { success: boolean; error?: string } {
    const result = this.machine.dispatch(playerId, action);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  /** Get a player's view of the game state. */
  viewFor(playerId: string): TPlayerView {
    return this.machine.getViewForPlayer(playerId);
  }

  /** Check if game is over. */
  get result(): GameResult | null {
    return this.machine.getResult();
  }

  /** Get the full authoritative state (for white-box testing). */
  get rawState(): TState {
    return this.machine.serialize();
  }

  /** Get whose turn it is. */
  get activePlayer(): string | null {
    return this.machine.getActivePlayer();
  }

  /** Get all player IDs. */
  get playerIds(): string[] {
    return [...this.players];
  }
}
