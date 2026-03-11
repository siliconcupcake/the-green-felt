import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { LobbyRoom, LobbyPlayer } from '@the-green-felt/shared';
import type { ILobbyService, CreateRoomResult, JoinRoomResult, LobbyEvent } from '../interfaces/lobby-service.js';
import { generateRoomCode } from '../lobby-service.js';
import { gameRegistry } from '../../games/registry.js';

/**
 * In-memory lobby service for testing.
 * No database required — all state lives in a Map.
 */
export class MockLobbyService implements ILobbyService {
  private readonly rooms = new Map<string, LobbyRoom>();
  private readonly emitter = new EventEmitter();

  async createRoom(gameTypeId: string, playerName: string): Promise<CreateRoomResult> {
    const plugin = gameRegistry.get(gameTypeId);
    if (!plugin) {
      throw new Error(`Unknown game type: ${gameTypeId}`);
    }

    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const playerId = crypto.randomUUID();
    const host: LobbyPlayer = { id: playerId, name: playerName, isReady: true };

    const room: LobbyRoom = {
      id: roomCode,
      gameTypeId,
      hostPlayerId: playerId,
      players: [host],
      maxPlayers: plugin.metadata.maxPlayers,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(roomCode, room);
    return { roomCode, playerId, room };
  }

  async joinRoom(roomCode: string, playerName: string, existingPlayerId?: string): Promise<JoinRoomResult> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = existingPlayerId ?? crypto.randomUUID();
    const player: LobbyPlayer = { id: playerId, name: playerName, isReady: false };
    room.players.push(player);

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_JOINED',
      playerId,
      playerName,
    } satisfies LobbyEvent);

    return { playerId, room };
  }

  async getRoom(roomCode: string): Promise<LobbyRoom | undefined> {
    return this.rooms.get(roomCode.toUpperCase());
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostPlayerId === playerId) {
      throw new Error('Host cannot leave — use closeRoom instead');
    }

    room.players = room.players.filter((p) => p.id !== playerId);

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_LEFT',
      playerId,
    } satisfies LobbyEvent);
  }

  async closeRoom(roomCode: string, hostPlayerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the host can close this room');
    }

    this.emitter.emit(`room:${code}`, { type: 'ROOM_CLOSED' } satisfies LobbyEvent);
    this.emitter.removeAllListeners(`room:${code}`);
    this.rooms.delete(code);
  }

  async startGame(roomCode: string, hostPlayerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the host can start the game');
    }
    if (room.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    room.status = 'in_progress';
    this.emitter.emit(`room:${code}`, { type: 'GAME_STARTED' } satisfies LobbyEvent);
  }

  async removeRoom(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode.toUpperCase());
  }

  onRoomEvent(roomCode: string, callback: (event: LobbyEvent) => void): () => void {
    const key = `room:${roomCode.toUpperCase()}`;
    this.emitter.on(key, callback);
    return () => {
      this.emitter.off(key, callback);
    };
  }

  /** Test helper — clear all rooms */
  clear(): void {
    this.rooms.clear();
    this.emitter.removeAllListeners();
  }
}

export const lobbyService: ILobbyService = new MockLobbyService();
