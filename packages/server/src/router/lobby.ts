import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { gameRegistry } from '../games/registry.js';
import { lobbyService } from '../services/mocks/lobby-service.js';
import { gameManager } from '../services/game-manager.js';
import type { LobbyEvent } from '../services/interfaces/lobby-service.js';

export const lobbyRouter = router({
  /** List all available game types */
  listGameTypes: publicProcedure.query(() => {
    return gameRegistry.getAll().map((plugin) => ({
      id: plugin.metadata.id,
      displayName: plugin.metadata.displayName,
      minPlayers: plugin.metadata.minPlayers,
      maxPlayers: plugin.metadata.maxPlayers,
      description: plugin.metadata.description,
    }));
  }),

  /** Create a new lobby room */
  createRoom: publicProcedure
    .input(z.object({ gameTypeId: z.string(), playerName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await lobbyService.createRoom(input.gameTypeId, input.playerName);
      } catch (err) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err instanceof Error ? err.message : 'Failed to create room',
        });
      }
    }),

  /** Join an existing lobby room */
  joinRoom: publicProcedure
    .input(z.object({ roomId: z.string().min(1), playerName: z.string().min(1), playerId: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        return await lobbyService.joinRoom(input.roomId, input.playerName, input.playerId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join room';
        const code = message === 'Room not found' ? 'NOT_FOUND' : 'BAD_REQUEST';
        throw new TRPCError({ code, message });
      }
    }),

  /** Peek at an existing room (see players without joining) */
  getRoom: publicProcedure.input(z.object({ roomCode: z.string().min(1) })).query(async ({ input }) => {
    const room = await lobbyService.getRoom(input.roomCode);
    if (!room) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' });
    }
    return room;
  }),

  /** Resolve player IDs to display names */
  getPlayerNames: publicProcedure
    .input(z.object({ playerIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      // Use the mock service's getPlayerNames if available, otherwise return empty
      if ('getPlayerNames' in lobbyService) {
        return (lobbyService as { getPlayerNames: (ids: string[]) => Record<string, string> }).getPlayerNames(input.playerIds);
      }
      return {} as Record<string, string>;
    }),

  /** Leave a room (non-host players only) */
  leaveRoom: publicProcedure
    .input(z.object({ roomCode: z.string().min(1), playerId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        await lobbyService.leaveRoom(input.roomCode, input.playerId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to leave room';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }
    }),

  /** Close a room (host only — removes the room and notifies all players) */
  closeRoom: publicProcedure
    .input(z.object({ roomCode: z.string().min(1), hostPlayerId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        await lobbyService.closeRoom(input.roomCode, input.hostPlayerId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to close room';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }
    }),

  /** Start the game (host only — notifies all players to transition to game page) */
  startGame: publicProcedure
    .input(z.object({ roomCode: z.string().min(1), hostPlayerId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        await lobbyService.startGame(input.roomCode, input.hostPlayerId);

        // Initialize game engine after lobby transition
        const room = await lobbyService.getRoom(input.roomCode);
        if (room) {
          const playerIds = room.players.map((p) => p.id);
          await gameManager.startGame(room.roomCode, room.gameTypeId, playerIds);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start game';
        throw new TRPCError({ code: 'BAD_REQUEST', message });
      }
    }),

  /** Subscribe to real-time lobby updates (player joins/leaves) */
  onLobbyUpdate: publicProcedure
    .input(z.object({ roomCode: z.string().min(1) }))
    .subscription(async function* ({ input, signal }) {
      const { roomCode } = input;
      const events: LobbyEvent[] = [];
      let resolve: (() => void) | null = null;

      const unsubscribe = lobbyService.onRoomEvent(roomCode, (event) => {
        events.push(event);
        resolve?.();
      });

      signal?.addEventListener('abort', () => {
        unsubscribe();
        resolve?.();
      });

      try {
        while (!signal?.aborted) {
          if (events.length > 0) {
            yield events.shift()!;
          } else {
            await new Promise<void>((r) => {
              resolve = r;
            });
          }
        }
      } finally {
        unsubscribe();
      }
    }),
});
