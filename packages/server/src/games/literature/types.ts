import type { AnyCard, CardId, LiteraturePlayerView } from '@the-green-felt/shared';

// Re-export so existing imports from './types.js' keep working
export type { LiteraturePlayerView };

/** Full authoritative state for a Literature game */
export interface LiteratureState {
  hands: Record<string, AnyCard[]>;
  teams: { teamA: string[]; teamB: string[] };
  currentTurn: string;
  declaredSets: Array<{ set: string; declaredBy: string; team: 'A' | 'B'; correct: boolean }>;
  scores: { teamA: number; teamB: number };
  logs: string[];
}

/** All possible player actions in Literature */
export type LiteratureAction =
  | { type: 'ASK_CARD'; targetPlayer: string; card: CardId }
  | { type: 'DECLARE_SET'; set: string; cardLocations: Record<CardId, string> }
  | { type: 'TRANSFER_TURN'; targetPlayer: string };
