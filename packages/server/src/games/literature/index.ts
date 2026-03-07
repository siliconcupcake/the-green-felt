/**
 * Literature game plugin — placeholder for full implementation.
 *
 * This file shows the structure a game plugin author would follow.
 * The full implementation will include setup, validate, reduce,
 * getPlayerView, checkGameOver, and getActivePlayer.
 */
import type { GamePlugin, AnyCard } from '@the-green-felt/shared';
import { STANDARD_52 } from '@the-green-felt/shared';
import type { LiteratureState, LiteraturePlayerView, LiteratureAction } from './types.js';

export const literaturePlugin: GamePlugin<
  LiteratureState,
  LiteraturePlayerView,
  LiteratureAction
> = {
  metadata: {
    id: 'literature',
    displayName: 'Literature',
    minPlayers: 6,
    maxPlayers: 8,
    deckConfig: {
      ...STANDARD_52,
      // Literature excludes 8s — will be configured in full implementation
    },
    description:
      'A team-based card game where players ask opponents for cards and declare complete sets.',
  },

  setup(_players: string[], _deck: AnyCard[]): LiteratureState {
    // TODO: Implement — deal cards, assign teams, set first turn
    throw new Error('Not yet implemented');
  },

  validate(_state: LiteratureState, _playerId: string, _action: LiteratureAction): string | null {
    // TODO: Implement — check if action is legal
    throw new Error('Not yet implemented');
  },

  reduce(
    _state: LiteratureState,
    _playerId: string,
    _action: LiteratureAction,
  ): LiteratureState {
    // TODO: Implement — apply action and return new state
    throw new Error('Not yet implemented');
  },

  getPlayerView(_state: LiteratureState, _playerId: string): LiteraturePlayerView {
    // TODO: Implement — filter state for the requesting player
    throw new Error('Not yet implemented');
  },

  checkGameOver(_state: LiteratureState) {
    // TODO: Implement — check if all sets have been declared
    throw new Error('Not yet implemented');
  },

  getActivePlayer(_state: LiteratureState): string | null {
    // TODO: Implement — return current turn player
    throw new Error('Not yet implemented');
  },
};
