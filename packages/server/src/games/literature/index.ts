/**
 * Literature game plugin.
 *
 * A team-based card game where players ask opponents for cards
 * and declare complete sets.
 */
import type { GamePlugin, AnyCard } from '@the-green-felt/shared';
import { STANDARD_52 } from '@the-green-felt/shared';
import { Deck, assignTeams } from '@the-green-felt/engine';
import type { LiteratureState, LiteraturePlayerView, LiteratureAction } from './types.js';

export const literaturePlugin: GamePlugin<LiteratureState, LiteraturePlayerView, LiteratureAction> = {
  metadata: {
    id: 'literature',
    displayName: 'Literature',
    minPlayers: 6,
    maxPlayers: 8,
    deckConfig: {
      ...STANDARD_52,
      // Literature excludes 8s — will be configured in full implementation
    },
    description: 'A team-based card game where players ask opponents for cards and declare complete sets.',
    teamsCount: 2,
    cardsPerPlayer: 8,
    discardOnStart: false,
  },

  setup(players: string[], deck: AnyCard[]): LiteratureState {
    const { seatOrder, teams } = assignTeams(players, 2);

    const deckObj = Deck.fromArray(deck);
    const [handArrays] = deckObj.deal(seatOrder.length, 8);

    const hands: Record<string, AnyCard[]> = {};
    for (let i = 0; i < seatOrder.length; i++) {
      hands[seatOrder[i]] = handArrays[i];
    }

    return {
      hands,
      teams: { teamA: teams['A'], teamB: teams['B'] },
      currentTurn: seatOrder[0],
      declaredSets: [],
      scores: { teamA: 0, teamB: 0 },
      logs: [`Game started. Team A: ${teams['A'].length} players, Team B: ${teams['B'].length} players.`],
    };
  },

  validate(_state: LiteratureState, _playerId: string, _action: LiteratureAction): string | null {
    // TODO: Implement — check if action is legal
    throw new Error('Not yet implemented');
  },

  reduce(_state: LiteratureState, _playerId: string, _action: LiteratureAction): LiteratureState {
    // TODO: Implement — apply action and return new state
    throw new Error('Not yet implemented');
  },

  getPlayerView(state: LiteratureState, playerId: string): LiteraturePlayerView {
    const otherPlayerCardCounts: Record<string, number> = {};
    for (const [pid, hand] of Object.entries(state.hands)) {
      if (pid !== playerId) {
        otherPlayerCardCounts[pid] = hand.length;
      }
    }

    return {
      myHand: state.hands[playerId] ?? [],
      otherPlayerCardCounts,
      teams: state.teams,
      currentTurn: state.currentTurn,
      declaredSets: state.declaredSets,
      scores: state.scores,
      logs: state.logs,
    };
  },

  checkGameOver(_state: LiteratureState) {
    // TODO: Implement — check if all sets have been declared
    return null;
  },

  getActivePlayer(state: LiteratureState): string | null {
    return state.currentTurn;
  },
};

// Register move generator for admin console
import { registerMoveGenerator } from '../../services/admin-service.js';
import { literatureMoveGenerator } from './move-generator.js';

registerMoveGenerator('literature', literatureMoveGenerator);
