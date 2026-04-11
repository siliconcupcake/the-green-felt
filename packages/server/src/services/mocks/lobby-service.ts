import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { LobbyRoom } from '@the-green-felt/shared';
import type { ILobbyService, CreateRoomResult, JoinRoomResult, LobbyEvent } from '../interfaces/lobby-service.js';
import { generateRoomCode } from '../lobby-service.js';
import { gameRegistry } from '../../games/registry.js';

/**
 * In-memory lobby service for testing.
 * No database required — all state lives in Maps.
 */
export class MockLobbyService implements ILobbyService {
  private readonly rooms = new Map<string, LobbyRoom>();
  /** In-memory player name store (mirrors the Player DB model). */
  private readonly playerNames = new Map<string, string>();
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
    this.playerNames.set(playerId, playerName);

    const room: LobbyRoom = {
      id: crypto.randomUUID(),
      roomCode,
      gameTypeId,
      hostPlayerId: playerId,
      players: [playerId],
      status: 'waiting',
      inLobby: true,
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
    const plugin = gameRegistry.get(room.gameTypeId);
    if (plugin && room.players.length >= plugin.metadata.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = existingPlayerId ?? crypto.randomUUID();
    this.playerNames.set(playerId, playerName);
    room.players.push(playerId);

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

  /** Look up a player's display name by ID. */
  getPlayerName(playerId: string): string | undefined {
    return this.playerNames.get(playerId);
  }

  /** Look up multiple player names by IDs. */
  getPlayerNames(playerIds: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const id of playerIds) {
      const name = this.playerNames.get(id);
      if (name) result[id] = name;
    }
    return result;
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (room.hostPlayerId === playerId) {
      throw new Error('Host cannot leave — use closeRoom instead');
    }

    room.players = room.players.filter((p) => p !== playerId);

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
    room.inLobby = false;
    this.emitter.emit(`room:${code}`, { type: 'GAME_STARTED' } satisfies LobbyEvent);
  }

  async removeRoom(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode.toUpperCase());
  }

  async listRooms(): Promise<LobbyRoom[]> {
    return [...this.rooms.values()];
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
    this.playerNames.clear();
    this.emitter.removeAllListeners();
  }
}

export const lobbyService = new MockLobbyService();
