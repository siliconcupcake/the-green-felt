import type { FastifyInstance } from 'fastify';
import { gameManager } from '../services/game-manager.js';
import { lobbyService } from '../services/mocks/lobby-service.js';
import { gameRegistry } from '../games/registry.js';

const MOCK_PLAYER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy'];

/**
 * Debug routes — only for development.
 * Provides a control panel at /debug to trigger game events manually.
 */
export async function registerDebugRoutes(server: FastifyInstance) {
  // Serve the debug control panel
  server.get('/debug', async (_req, reply) => {
    return reply.type('text/html').send(debugPageHtml);
  });

  // ─── Game APIs ───

  server.get('/debug/api/games', async () => {
    return gameManager.listGames();
  });

  server.post<{ Body: { gameId: string; playerId: string; playerName: string } }>(
    '/debug/api/start',
    async (req) => {
      const { gameId, playerId, playerName } = req.body;
      if (gameManager.hasGame(gameId)) return { ok: false, error: 'Game already exists' };

      const playerIds = [playerId];
      const playerNames: Record<string, string> = { [playerId]: playerName };
      for (let i = 0; i < 5; i++) {
        const fakeId = `mock-${i}`;
        playerIds.push(fakeId);
        playerNames[fakeId] = MOCK_PLAYER_NAMES[i];
      }

      await gameManager.startGame(gameId, 'literature', playerIds);
      return { ok: true, gameId, playerIds, playerNames };
    },
  );

  server.post<{ Body: { gameId: string } }>('/debug/api/reset', async (req) => {
    gameManager.resetGame(req.body.gameId);
    return { ok: true, gameId: req.body.gameId };
  });

  server.post<{ Body: { gameId: string; playerId: string; playerName: string } }>(
    '/debug/api/redeal',
    async (req) => {
      const { gameId, playerId, playerName } = req.body;
      gameManager.resetGame(gameId);

      const playerIds = [playerId];
      const playerNames: Record<string, string> = { [playerId]: playerName };
      for (let i = 0; i < 5; i++) {
        const fakeId = `mock-${i}`;
        playerIds.push(fakeId);
        playerNames[fakeId] = MOCK_PLAYER_NAMES[i];
      }

      await gameManager.startGame(gameId, 'literature', playerIds);
      return { ok: true, gameId, playerIds, playerNames };
    },
  );

  server.get<{ Querystring: { gameId: string; playerId: string } }>(
    '/debug/api/state',
    async (req) => {
      try {
        const view = gameManager.getPlayerView(req.query.gameId, req.query.playerId);
        return { ok: true, view };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
  );

  // ─── Lobby APIs ───

  server.get('/debug/api/lobbies', async () => {
    return await lobbyService.listRooms();
  });

  server.get<{ Querystring: { roomCode: string } }>('/debug/api/lobby', async (req) => {
    const room = await lobbyService.getRoom(req.query.roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    return { ok: true, room };
  });

  server.post<{ Body: { roomCode: string; count?: number } }>(
    '/debug/api/lobby/add-players',
    async (req) => {
      const { roomCode, count = 5 } = req.body;
      const room = await lobbyService.getRoom(roomCode);
      if (!room) return { ok: false, error: 'Room not found' };

      const existingCount = room.players.length;
      const plugin = gameRegistry.get(room.gameTypeId);
      const maxPlayers = plugin?.metadata.maxPlayers ?? 10;
      const toAdd = Math.min(count, maxPlayers - existingCount);
      if (toAdd <= 0) return { ok: false, error: 'Room is full' };

      const added: Array<{ id: string; name: string }> = [];
      for (let i = 0; i < toAdd; i++) {
        const name = MOCK_PLAYER_NAMES[(existingCount - 1 + i) % MOCK_PLAYER_NAMES.length];
        const result = await lobbyService.joinRoom(roomCode, name);
        added.push({ id: result.playerId, name });
      }

      const updatedRoom = await lobbyService.getRoom(roomCode);
      return { ok: true, added, room: updatedRoom };
    },
  );
}

const debugPageHtml = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Green Felt — Debug Controller</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; padding: 2rem; }
    h1 { color: #4caf50; margin-bottom: 1.5rem; }
    h2 { color: #888; margin: 1.5rem 0 0.75rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .panel { background: #16213e; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1rem; }
    label { display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 0.25rem; }
    input { background: #0f3460; border: 1px solid #333; color: #eee; padding: 0.4rem 0.6rem; border-radius: 0.25rem; width: 100%; margin-bottom: 0.75rem; font-size: 0.9rem; }
    button { background: #4caf50; color: #fff; border: none; padding: 0.5rem 1.25rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.85rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
    button:hover { background: #66bb6a; }
    button.danger { background: #e53935; }
    button.danger:hover { background: #ef5350; }
    button.secondary { background: #1565c0; }
    button.secondary:hover { background: #1e88e5; }
    button.warning { background: #f57c00; }
    button.warning:hover { background: #fb8c00; }
    .row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .row > * { flex: 1; min-width: 200px; }
    pre { background: #0a0a1a; border: 1px solid #333; border-radius: 0.25rem; padding: 0.75rem; margin-top: 0.75rem; font-size: 0.8rem; overflow-x: auto; max-height: 400px; overflow-y: auto; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Debug Controller</h1>

  <div class="panel">
    <h2>Game Identity</h2>
    <div class="row">
      <div>
        <label>Game / Room ID</label>
        <input id="gameId" value="debug-game" />
      </div>
      <div>
        <label>Player ID</label>
        <input id="playerId" value="debug-player" />
      </div>
      <div>
        <label>Player Name</label>
        <input id="playerName" value="DebugUser" />
      </div>
    </div>
  </div>

  <div class="panel">
    <h2>Game Actions</h2>
    <button onclick="startGame()">Start Mock Game</button>
    <button class="secondary" onclick="redeal()">Re-deal Cards</button>
    <button class="secondary" onclick="viewState()">View Game State</button>
    <button class="danger" onclick="resetGame()">Reset Game</button>
    <button onclick="listGames()">List Active Games</button>
  </div>

  <div class="panel">
    <h2>Lobby Actions</h2>
    <div class="row" style="margin-bottom: 0.75rem;">
      <div>
        <label>Room Code</label>
        <input id="roomCode" placeholder="e.g. ABCD" />
      </div>
      <div>
        <label>Players to Add</label>
        <input id="addCount" type="number" value="5" min="1" max="9" />
      </div>
    </div>
    <button class="warning" onclick="listLobbies()">List Lobbies</button>
    <button class="warning" onclick="getLobby()">Get Lobby</button>
    <button class="warning" onclick="addPlayers()">Add Mock Players</button>
  </div>

  <div class="panel">
    <h2>Output</h2>
    <pre id="output">Ready. Enter values above and click an action.</pre>
  </div>

  <script>
    const $ = (id) => document.getElementById(id);
    const out = (data) => $('output').textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    function getIds() {
      return {
        gameId: $('gameId').value.trim(),
        playerId: $('playerId').value.trim(),
        playerName: $('playerName').value.trim(),
      };
    }

    async function api(method, path, body) {
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(path, opts);
        const data = await res.json();
        out(data);
      } catch (err) {
        out('Error: ' + err.message);
      }
    }

    // Game actions
    function startGame() { api('POST', '/debug/api/start', getIds()); }
    function redeal() { api('POST', '/debug/api/redeal', getIds()); }
    function resetGame() { api('POST', '/debug/api/reset', { gameId: $('gameId').value.trim() }); }
    function viewState() { const { gameId, playerId } = getIds(); api('GET', '/debug/api/state?gameId=' + encodeURIComponent(gameId) + '&playerId=' + encodeURIComponent(playerId)); }
    function listGames() { api('GET', '/debug/api/games'); }

    // Lobby actions
    function listLobbies() { api('GET', '/debug/api/lobbies'); }
    function getLobby() { api('GET', '/debug/api/lobby?roomCode=' + encodeURIComponent($('roomCode').value.trim())); }
    function addPlayers() { api('POST', '/debug/api/lobby/add-players', { roomCode: $('roomCode').value.trim(), count: parseInt($('addCount').value) || 5 }); }
  </script>
</body>
</html>`;
