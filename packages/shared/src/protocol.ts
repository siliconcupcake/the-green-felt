import type { GameResult } from './game-plugin.js';

/** Messages from server to client via tRPC subscription */
export type ServerEvent<TPlayerView = unknown> =
  | { type: 'GAME_STATE'; view: TPlayerView; activePlayer: string | null }
  | { type: 'ACTION_REJECTED'; reason: string }
  | { type: 'GAME_OVER'; result: GameResult }
  | { type: 'PLAYER_JOINED'; playerId: string; playerName: string }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'CHAT_MESSAGE'; playerId: string; playerName: string; message: string }
  | { type: 'ERROR'; code: ErrorCode; message: string };

/** Lobby-related types */
export interface LobbyRoom {
  id: string;
  gameId: string;
  hostPlayerId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt: string;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
}

export enum ErrorCode {
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  INVALID_ACTION = 'INVALID_ACTION',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  LOBBY_FULL = 'LOBBY_FULL',
  LOBBY_NOT_FOUND = 'LOBBY_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED',
  PLAYER_NOT_IN_GAME = 'PLAYER_NOT_IN_GAME',
}
