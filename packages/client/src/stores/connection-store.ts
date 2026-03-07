import { create } from 'zustand';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected';
  userId: string | null;
  userName: string | null;
  setConnected: (userId: string, userName: string) => void;
  setDisconnected: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  userId: null,
  userName: null,
  setConnected: (userId, userName) => set({ status: 'connected', userId, userName }),
  setDisconnected: () => set({ status: 'disconnected', userId: null, userName: null }),
}));
