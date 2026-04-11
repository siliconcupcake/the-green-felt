import type { GameResult } from './game-plugin.js';

/**
 * Wrapper that the server's GameManager stores in the database.
 * TState is the game-plugin-specific state.
 */
export interface PersistedGameState<TState = unknown> {
  gameId: string;
  gameTypeId: string;
  players: string[];
  state: TState;
  actionLog: ActionLogEntry[];
  status: 'active' | 'finished' | 'abandoned';
  result: GameResult | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionLogEntry {
  playerId: string;
  action: { type: string; [key: string]: unknown };
  timestamp: Date;
}
