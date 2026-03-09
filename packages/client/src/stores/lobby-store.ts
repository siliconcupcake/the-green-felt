import { create } from 'zustand';

interface LobbyState {
  roomId: string | null;
  isHost: boolean;
  error: string | null;
  activeTab: 'create' | 'join';

  setActiveTab: (tab: 'create' | 'join') => void;
  setRoom: (roomId: string, isHost: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  roomId: null,
  isHost: false,
  error: null,
  activeTab: 'create',

  setActiveTab: (activeTab) => set({ activeTab }),
  setRoom: (roomId, isHost) => set({ roomId, isHost }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      roomId: null,
      isHost: false,
      error: null,
    }),
}));
