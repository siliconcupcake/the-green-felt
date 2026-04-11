import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { LobbyRoom } from '@the-green-felt/shared';
import type { ILobbyService, CreateRoomResult, JoinRoomResult, LobbyEvent } from './interfaces/lobby-service.js';
import { gameRegistry } from '../games/registry.js';
import { prisma } from '../db.js';

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
const TTL_DAYS = 14;

function toRoom(doc: {
  id: string;
  roomCode: string;
  gameTypeId: string;
  hostPlayerId: string;
  players: string[];
  status: string;
  inLobby: boolean;
  createdAt: Date;
}): LobbyRoom {
  return {
    id: doc.id,
    roomCode: doc.roomCode,
    gameTypeId: doc.gameTypeId,
    hostPlayerId: doc.hostPlayerId,
    players: doc.players,
    status: doc.status as LobbyRoom['status'],
    inLobby: doc.inLobby,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function generateRoomCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH)))
    .map((b) => ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length])
    .join('');
}

/**
 * Database-backed lobby service.
 * Uses the unified Game model with inLobby flag.
 * Player names are stored in a separate Player model.
 *
 * To enable TTL auto-deletion, run in mongosh:
 *   db.Game.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
 */
class LobbyService implements ILobbyService {
  private readonly emitter = new EventEmitter();

  async createRoom(gameTypeId: string, playerName: string): Promise<CreateRoomResult> {
    const plugin = gameRegistry.get(gameTypeId);
    if (!plugin) {
      throw new Error(`Unknown game type: ${gameTypeId}`);
    }

    const playerId = crypto.randomUUID();

    // Upsert player name
    await prisma.player.upsert({
      where: { id: playerId },
      update: { name: playerName },
      create: { id: playerId, name: playerName },
    });

    // Generate a unique room code with collision check
    let roomCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRoomCode();
      const existing = await prisma.game.findUnique({ where: { roomCode: candidate } });
      if (!existing) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      throw new Error('Failed to generate a unique room code');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

    const doc = await prisma.game.create({
      data: {
        roomCode,
        gameTypeId,
        hostPlayerId: playerId,
        players: [playerId],
        status: 'waiting',
        inLobby: true,
        expiresAt,
      },
    });

    return { roomCode, playerId, room: toRoom(doc) };
  }

  async joinRoom(roomCode: string, playerName: string, existingPlayerId?: string): Promise<JoinRoomResult> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.game.findUnique({ where: { roomCode: code } });

    if (!doc) {
      throw new Error('Room not found');
    }
    if (doc.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    const plugin = gameRegistry.get(doc.gameTypeId);
    if (plugin && doc.players.length >= plugin.metadata.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = existingPlayerId ?? crypto.randomUUID();

    // Upsert player name
    await prisma.player.upsert({
      where: { id: playerId },
      update: { name: playerName },
      create: { id: playerId, name: playerName },
    });

    const updated = await prisma.game.update({
      where: { roomCode: code },
      data: { players: { push: playerId } },
    });

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_JOINED',
      playerId,
      playerName,
    } satisfies LobbyEvent);

    return { playerId, room: toRoom(updated) };
  }

  async getRoom(roomCode: string): Promise<LobbyRoom | undefined> {
    const doc = await prisma.game.findUnique({ where: { roomCode: roomCode.toUpperCase() } });
    return doc ? toRoom(doc) : undefined;
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.game.findUnique({ where: { roomCode: code } });
    if (!doc) throw new Error('Room not found');
    if (doc.hostPlayerId === playerId) {
      throw new Error('Host cannot leave — use closeRoom instead');
    }

    const players = doc.players.filter((p) => p !== playerId);
    await prisma.game.update({ where: { roomCode: code }, data: { players } });

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_LEFT',
      playerId,
    } satisfies LobbyEvent);
  }

  async closeRoom(roomCode: string, hostPlayerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.game.findUnique({ where: { roomCode: code } });
    if (!doc) throw new Error('Room not found');
    if (doc.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the host can close this room');
    }

    this.emitter.emit(`room:${code}`, { type: 'ROOM_CLOSED' } satisfies LobbyEvent);
    this.emitter.removeAllListeners(`room:${code}`);
    await prisma.game.delete({ where: { roomCode: code } }).catch(() => {});
  }

  async startGame(roomCode: string, hostPlayerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.game.findUnique({ where: { roomCode: code } });
    if (!doc) throw new Error('Room not found');
    if (doc.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the host can start the game');
    }
    if (doc.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    await prisma.game.update({ where: { roomCode: code }, data: { status: 'in_progress', inLobby: false } });
    this.emitter.emit(`room:${code}`, { type: 'GAME_STARTED' } satisfies LobbyEvent);
  }

  async removeRoom(roomCode: string): Promise<void> {
    await prisma.game.delete({ where: { roomCode: roomCode.toUpperCase() } }).catch(() => {});
  }

  async listRooms(): Promise<LobbyRoom[]> {
    const docs = await prisma.game.findMany();
    return docs.map((doc) => toRoom(doc));
  }

  onRoomEvent(roomCode: string, callback: (event: LobbyEvent) => void): () => void {
    const key = `room:${roomCode.toUpperCase()}`;
    this.emitter.on(key, callback);
    return () => {
      this.emitter.off(key, callback);
    };
  }
}

export const lobbyService: ILobbyService = new LobbyService();
