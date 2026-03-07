import { create } from 'zustand';
import type { GameResult } from '@the-green-felt/shared';

interface GameState {
  gameId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  view: any | null;
  activePlayer: string | null;
  result: GameResult | null;
  error: string | null;
  setGameState: (gameId: string, view: unknown, activePlayer: string | null) => void;
  setGameOver: (result: GameResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  view: null,
  activePlayer: null,
  result: null,
  error: null,
  setGameState: (gameId, view, activePlayer) => set({ gameId, view, activePlayer, error: null }),
  setGameOver: (result) => set({ result }),
  setError: (error) => set({ error }),
  reset: () => set({ gameId: null, view: null, activePlayer: null, result: null, error: null }),
}));
