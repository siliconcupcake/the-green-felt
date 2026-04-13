import { create } from 'zustand';

const AVATAR_GRADIENTS = [
  ['#34d399', '#059669'], // green (host)
  ['#8b5cf6', '#6d28d9'], // violet
  ['#f59e0b', '#d97706'], // amber
  ['#3b82f6', '#2563eb'], // blue
  ['#ec4899', '#db2777'], // pink
  ['#06b6d4', '#0891b2'], // cyan
  ['#f97316', '#ea580c'], // orange
  ['#a78bfa', '#7c3aed'], // light violet
] as const;

export function getAvatarGradient(index: number): [string, string] {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return [gradient[0], gradient[1]];
}

interface LobbyState {
  // Room state
  phase: 'landing' | 'waiting';
  roomCode: string | null;
  gameTypeId: string | null;
  isHost: boolean;

  // Player state
  players: string[];
  playerNames: Record<string, string>;

  // UI state
  error: string | null;
  loading: boolean;
  loadingGameId: string | null;

  // Actions
  enterWaitingRoom: (roomCode: string, gameTypeId: string, isHost: boolean, players: string[], playerNames: Record<string, string>) => void;
  addPlayer: (playerId: string, playerName: string) => void;
  removePlayer: (playerId: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingGameId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  phase: 'landing' as const,
  roomCode: null,
  gameTypeId: null,
  isHost: false,
  players: [],
  playerNames: {},
  error: null,
  loading: false,
  loadingGameId: null,
};

export const useLobbyStore = create<LobbyState>((set) => ({
  ...initialState,

  enterWaitingRoom: (roomCode, gameTypeId, isHost, players, playerNames) =>
    set({
      phase: 'waiting',
      roomCode,
      gameTypeId,
      isHost,
      players,
      playerNames,
      error: null,
    }),

  addPlayer: (playerId, playerName) =>
    set((state) => {
      if (state.players.includes(playerId)) return state;
      return {
        players: [...state.players, playerId],
        playerNames: { ...state.playerNames, [playerId]: playerName },
      };
    }),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p !== playerId),
    })),

  setError: (error) => set({ error }),

  setLoading: (loading) => set({ loading }),

  setLoadingGameId: (loadingGameId) => set({ loadingGameId }),

  reset: () => set(initialState),
}));
