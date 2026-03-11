import type { LobbyRoom } from '@the-green-felt/shared';

export interface CreateRoomResult {
  roomCode: string;
  playerId: string;
  room: LobbyRoom;
}

export interface JoinRoomResult {
  playerId: string;
  room: LobbyRoom;
}

export type LobbyEvent =
  | { type: 'PLAYER_JOINED'; playerId: string; playerName: string }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'ROOM_CLOSED' }
  | { type: 'GAME_STARTED' };

export interface ILobbyService {
  createRoom(gameTypeId: string, playerName: string): Promise<CreateRoomResult>;
  joinRoom(roomCode: string, playerName: string, playerId?: string): Promise<JoinRoomResult>;
  leaveRoom(roomCode: string, playerId: string): Promise<void>;
  closeRoom(roomCode: string, hostPlayerId: string): Promise<void>;
  startGame(roomCode: string, hostPlayerId: string): Promise<void>;
  getRoom(roomCode: string): Promise<LobbyRoom | undefined>;
  removeRoom(roomCode: string): Promise<void>;
  onRoomEvent(roomCode: string, callback: (event: LobbyEvent) => void): () => void;
}
