import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { LobbyRoom, LobbyPlayer } from '@the-green-felt/shared';
import type { ILobbyService, CreateRoomResult, JoinRoomResult, LobbyEvent } from './interfaces/lobby-service.js';
import { gameRegistry } from '../games/registry.js';
import { prisma } from '../db.js';

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
const TTL_DAYS = 14;

function toLobbyRoom(doc: {
  roomCode: string;
  gameTypeId: string;
  hostPlayerId: string;
  players: unknown[];
  maxPlayers: number;
  status: string;
  createdAt: Date;
}): LobbyRoom {
  return {
    id: doc.roomCode,
    gameTypeId: doc.gameTypeId,
    hostPlayerId: doc.hostPlayerId,
    players: doc.players as LobbyPlayer[],
    maxPlayers: doc.maxPlayers,
    status: doc.status as LobbyRoom['status'],
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
 * Rooms are persisted to MongoDB with a TTL index for auto-cleanup after 14 days.
 *
 * To enable the TTL auto-deletion, run the following in mongosh after first deploy:
 *   db.Lobby.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
 */
class LobbyService implements ILobbyService {
  private readonly emitter = new EventEmitter();
  async createRoom(gameTypeId: string, playerName: string): Promise<CreateRoomResult> {
    const plugin = gameRegistry.get(gameTypeId);
    if (!plugin) {
      throw new Error(`Unknown game type: ${gameTypeId}`);
    }

    const playerId = crypto.randomUUID();
    const host: LobbyPlayer = { id: playerId, name: playerName, isReady: true };

    // Generate a unique room code with collision check
    let roomCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRoomCode();
      const existing = await prisma.lobby.findUnique({ where: { roomCode: candidate } });
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

    const doc = await prisma.lobby.create({
      data: {
        roomCode,
        gameTypeId: gameTypeId,
        hostPlayerId: playerId,
        players: [host],
        maxPlayers: plugin.metadata.maxPlayers,
        status: 'waiting',
        expiresAt,
      },
    });

    return { roomCode, playerId, room: toLobbyRoom(doc) };
  }

  async joinRoom(roomCode: string, playerName: string, existingPlayerId?: string): Promise<JoinRoomResult> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.lobby.findUnique({ where: { roomCode: code } });

    if (!doc) {
      throw new Error('Room not found');
    }
    if (doc.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    const players = doc.players as LobbyPlayer[];
    if (players.length >= doc.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = existingPlayerId ?? crypto.randomUUID();
    const player: LobbyPlayer = { id: playerId, name: playerName, isReady: false };
    players.push(player);

    const updated = await prisma.lobby.update({
      where: { roomCode: code },
      data: { players },
    });

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_JOINED',
      playerId,
      playerName,
    } satisfies LobbyEvent);

    return { playerId, room: toLobbyRoom(updated) };
  }

  async getRoom(roomCode: string): Promise<LobbyRoom | undefined> {
    const doc = await prisma.lobby.findUnique({ where: { roomCode: roomCode.toUpperCase() } });
    return doc ? toLobbyRoom(doc) : undefined;
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.lobby.findUnique({ where: { roomCode: code } });
    if (!doc) throw new Error('Room not found');
    if (doc.hostPlayerId === playerId) {
      throw new Error('Host cannot leave — use closeRoom instead');
    }

    const players = (doc.players as LobbyPlayer[]).filter((p) => p.id !== playerId);
    await prisma.lobby.update({ where: { roomCode: code }, data: { players } });

    this.emitter.emit(`room:${code}`, {
      type: 'PLAYER_LEFT',
      playerId,
    } satisfies LobbyEvent);
  }

  async closeRoom(roomCode: string, hostPlayerId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const doc = await prisma.lobby.findUnique({ where: { roomCode: code } });
    if (!doc) throw new Error('Room not found');
    if (doc.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the host can close this room');
    }

    this.emitter.emit(`room:${code}`, { type: 'ROOM_CLOSED' } satisfies LobbyEvent);
    this.emitter.removeAllListeners(`room:${code}`);
    await prisma.lobby.delete({ where: { roomCode: code } }).catch(() => {});
  }

  async removeRoom(roomCode: string): Promise<void> {
    await prisma.lobby.delete({ where: { roomCode: roomCode.toUpperCase() } }).catch(() => {
      // Ignore if already deleted or expired
    });
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
