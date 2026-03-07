import type { GamePlugin, GameResult } from '@the-green-felt/shared';
import { Deck } from './deck.js';

export type DispatchResult<TPlayerView> =
  | { success: true; views: Map<string, TPlayerView>; result: GameResult | null }
  | { success: false; error: string };

/**
 * Generic game state machine that wraps any GamePlugin.
 *
 * The server creates one of these per active game. It handles:
 * - Deck creation and shuffling based on plugin metadata
 * - Action validation and state transitions
 * - Player view computation
 * - Game-over detection
 */
export class GameStateMachine<TState, TPlayerView, TAction extends { type: string }> {
  private state: TState;
  private readonly players: string[];

  constructor(
    private readonly plugin: GamePlugin<TState, TPlayerView, TAction>,
    players: string[],
    seed?: number,
  ) {
    this.players = players;
    const deck = Deck.create(plugin.metadata.deckConfig).shuffle(seed);
    this.state = plugin.setup(players, [...deck.toArray()]);
  }

  /** Attempt to perform an action. */
  dispatch(playerId: string, action: TAction): DispatchResult<TPlayerView> {
    const error = this.plugin.validate(this.state, playerId, action);
    if (error !== null) {
      return { success: false, error };
    }

    this.state = this.plugin.reduce(this.state, playerId, action);

    const views = new Map<string, TPlayerView>();
    for (const pid of this.players) {
      views.set(pid, this.plugin.getPlayerView(this.state, pid));
    }

    const result = this.plugin.checkGameOver(this.state);
    return { success: true, views, result };
  }

  /** Get the filtered view for a specific player. */
  getViewForPlayer(playerId: string): TPlayerView {
    return this.plugin.getPlayerView(this.state, playerId);
  }

  /** Get the current active player (null for simultaneous games). */
  getActivePlayer(): string | null {
    return this.plugin.getActivePlayer(this.state);
  }

  /** Check if game is over. */
  getResult(): GameResult | null {
    return this.plugin.checkGameOver(this.state);
  }

  /** Serialize the full state for persistence. */
  serialize(): TState {
    return structuredClone(this.state);
  }

  /** Restore a state machine from persisted state. */
  static restore<TState, TPlayerView, TAction extends { type: string }>(
    plugin: GamePlugin<TState, TPlayerView, TAction>,
    players: string[],
    state: TState,
  ): GameStateMachine<TState, TPlayerView, TAction> {
    const machine = Object.create(GameStateMachine.prototype) as GameStateMachine<
      TState,
      TPlayerView,
      TAction
    >;
    Object.assign(machine, { plugin, players, state: structuredClone(state) });
    return machine;
  }
}
