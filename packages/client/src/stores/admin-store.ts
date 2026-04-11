import { create } from 'zustand';

export interface AdminActionLogEntry {
  index: number;
  playerId: string;
  action: { type: string; [key: string]: unknown };
  timestamp: number;
  result: 'success' | 'rejected';
  error?: string;
}

export interface AdminEvent {
  id?: number;
  type: string;
  gameId: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface GameInfo {
  gameId: string;
  gameTypeId: string;
  players: Array<{ id: string; name: string }>;
  activePlayer: string | null;
  actionCount: number;
  seed: number | undefined;
}

interface AdminState {
  // Game
  gameId: string | null;
  gameInfo: GameInfo | null;

  // State inspection
  fullState: unknown | null;
  selectedPlayerId: string | null;
  playerView: unknown | null;

  // Action log & timeline
  actionLog: AdminActionLogEntry[];
  timelineIndex: number | null;
  historicalState: unknown | null;
  historicalViews: Record<string, unknown> | null;

  // Event log
  events: AdminEvent[];
  eventFilters: Set<string>;

  // Action panel
  suggestedMove: Record<string, unknown> | null;
  lastActionResult: { success: boolean; error?: string } | null;

  // Actions
  setGameId: (gameId: string | null) => void;
  setGameInfo: (info: GameInfo | null) => void;
  setFullState: (state: unknown) => void;
  selectPlayer: (playerId: string | null) => void;
  setPlayerView: (view: unknown) => void;
  appendEvent: (event: AdminEvent) => void;
  setActionLog: (log: AdminActionLogEntry[]) => void;
  setTimelineIndex: (index: number | null) => void;
  setHistoricalState: (state: unknown | null, views: Record<string, unknown> | null) => void;
  setSuggestedMove: (move: Record<string, unknown> | null) => void;
  setLastActionResult: (result: { success: boolean; error?: string } | null) => void;
  toggleEventFilter: (filter: string) => void;
  reset: () => void;
}

const ALL_EVENT_TYPES = [
  'game:created',
  'game:reset',
  'game:over',
  'game:rewound',
  'game:destroyed',
  'action:dispatched',
  'state:updated',
  'subscription:added',
  'subscription:removed',
  'view:broadcast',
];

export const useAdminStore = create<AdminState>((set) => ({
  gameId: null,
  gameInfo: null,
  fullState: null,
  selectedPlayerId: null,
  playerView: null,
  actionLog: [],
  timelineIndex: null,
  historicalState: null,
  historicalViews: null,
  events: [],
  eventFilters: new Set(ALL_EVENT_TYPES),
  suggestedMove: null,
  lastActionResult: null,

  setGameId: (gameId) => set({ gameId }),
  setGameInfo: (gameInfo) => set({ gameInfo }),
  setFullState: (fullState) => set({ fullState }),
  selectPlayer: (selectedPlayerId) => set({ selectedPlayerId }),
  setPlayerView: (playerView) => set({ playerView }),
  appendEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  setActionLog: (actionLog) => set({ actionLog }),
  setTimelineIndex: (timelineIndex) => set({ timelineIndex }),
  setHistoricalState: (historicalState, historicalViews) => set({ historicalState, historicalViews }),
  setSuggestedMove: (suggestedMove) => set({ suggestedMove }),
  setLastActionResult: (lastActionResult) => set({ lastActionResult }),
  toggleEventFilter: (filter) =>
    set((s) => {
      const next = new Set(s.eventFilters);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return { eventFilters: next };
    }),
  reset: () =>
    set({
      gameId: null,
      gameInfo: null,
      fullState: null,
      selectedPlayerId: null,
      playerView: null,
      actionLog: [],
      timelineIndex: null,
      historicalState: null,
      historicalViews: null,
      events: [],
      eventFilters: new Set(ALL_EVENT_TYPES),
      suggestedMove: null,
      lastActionResult: null,
    }),
}));
