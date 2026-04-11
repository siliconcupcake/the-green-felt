import type { AnyCard } from './card.js';
import type { DeckConfig } from './deck-config.js';

/**
 * The central interface every card game must implement.
 *
 * TState = the full authoritative game state (server-side).
 * TPlayerView = the filtered state a single player sees.
 * TAction = discriminated union of all possible player actions.
 *
 * All methods must be pure functions (no side effects, no I/O).
 */
export interface GamePlugin<TState, TPlayerView, TAction extends { type: string }> {
  /** Static metadata about this game */
  readonly metadata: GameMetadata;

  /**
   * Create the initial game state given player IDs and a shuffled deck.
   * The engine provides the deck based on metadata.deckConfig.
   */
  setup(players: string[], deck: AnyCard[]): TState;

  /**
   * Validate whether an action is legal in the current state.
   * Return null if valid, or an error message string if invalid.
   */
  validate(state: TState, playerId: string, action: TAction): string | null;

  /**
   * Apply a validated action to produce the next state.
   * Must be a pure function — no side effects, no mutation of input state.
   */
  reduce(state: TState, playerId: string, action: TAction): TState;

  /**
   * Derive the view of the game state for a specific player.
   * Used to hide private information (other players' cards, deck contents).
   */
  getPlayerView(state: TState, playerId: string): TPlayerView;

  /**
   * Check if the game has ended.
   * Return null if the game is still in progress, or a GameResult if it's over.
   */
  checkGameOver(state: TState): GameResult | null;

  /**
   * Determine whose turn it is.
   * Return null for games that allow simultaneous actions (e.g. Snap).
   */
  getActivePlayer(state: TState): string | null;
}

export interface GameMetadata {
  /** Unique game identifier, e.g. "literature", "rummy", "hearts" */
  readonly id: string;
  /** Display name shown in the lobby */
  readonly displayName: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly deckConfig: DeckConfig;
  /** Brief description for the lobby */
  readonly description: string;
  /** Number of teams to split players into. Undefined = free-for-all. */
  readonly teamsCount?: number;
  /** Cards to deal per player during setup. Undefined = deal all cards evenly. */
  readonly cardsPerPlayer?: number;
  /** Whether to flip the top card to the discard pile after dealing. */
  readonly discardOnStart?: boolean;
}

export interface GameResult {
  /** Player IDs in finishing order (index 0 = winner) */
  readonly rankings: string[];
  /** Optional per-player scores */
  readonly scores?: Record<string, number>;
  /** Human-readable summary, e.g. "Team A collected 5 sets" */
  readonly summary: string;
}
