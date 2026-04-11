import type { AnyCard, CardId } from './card.js';
import type { GameResult } from './game-plugin.js';

/** Data sent when cards are dealt at game start. */
export interface DealSequenceData {
  /** Player IDs in seating order, rotated so the subscribing player is always index 0 */
  seatOrder: string[];
  /** Card IDs dealt to the subscribing player */
  myCardIds: CardId[];
  /** Team assignments — e.g. { "A": ["p1","p3"], "B": ["p2","p4"] } */
  teams: Record<string, string[]>;
  /** Number of cards remaining in the draw pile after dealing */
  drawPileCount: number;
  /** Card IDs in the discard pile (top card last) */
  discardPileIds: CardId[];
}

/** Literature game — what a single player can see */
export interface LiteraturePlayerView {
  myHand: AnyCard[];
  otherPlayerCardCounts: Record<string, number>;
  teams: { teamA: string[]; teamB: string[] };
  currentTurn: string;
  declaredSets: Array<{ set: string; declaredBy: string; team: 'A' | 'B'; correct: boolean }>;
  scores: { teamA: number; teamB: number };
  logs: string[];
}

/** Messages from server to client via tRPC subscription */
export type ServerEvent<TPlayerView = unknown> =
  | { type: 'GAME_STATE'; view: TPlayerView; activePlayer: string | null }
  | { type: 'ACTION_REJECTED'; reason: string }
  | { type: 'GAME_OVER'; result: GameResult }
  | ({ type: 'DEAL_SEQUENCE' } & DealSequenceData)
  | { type: 'PLAYER_JOINED'; playerId: string; playerName: string }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'CHAT_MESSAGE'; playerId: string; playerName: string; message: string }
  | { type: 'ERROR'; code: ErrorCode; message: string };

/** Lobby-related types */
export interface LobbyRoom {
  id: string;
  roomCode: string;
  gameTypeId: string;
  hostPlayerId: string;
  players: string[];
  status: 'waiting' | 'in_progress' | 'finished';
  inLobby: boolean;
  createdAt: string;
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
