import type { CardId, AnyCard } from '@the-green-felt/shared';
import type { LiteratureState } from './types.js';

/**
 * Card sets in Literature. Each set is a group of related cards
 * that can be declared together. For a standard 52-card deck:
 * Low = 2-7, High = 8-K+A per suit.
 * (This simplified version uses rank ranges.)
 */
const LOW_RANKS = ['2', '3', '4', '5', '6', '7'];
const HIGH_RANKS = ['8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['C', 'D', 'H', 'S'];

interface CardSetDef {
  name: string;
  cardIds: string[];
}

function getAllCardSets(): CardSetDef[] {
  const sets: CardSetDef[] = [];
  for (const suit of SUITS) {
    sets.push({
      name: `Low ${suit}`,
      cardIds: LOW_RANKS.map((r) => `${r}${suit}`),
    });
    sets.push({
      name: `High ${suit}`,
      cardIds: HIGH_RANKS.map((r) => `${r}${suit}`),
    });
  }
  return sets;
}

function getCardId(card: AnyCard): string {
  return card.id as string;
}

/**
 * Generate a random valid ASK_CARD action for a Literature player.
 *
 * Rules:
 * - Must ask for a card NOT in your hand
 * - Must ask for a card from a set you hold at least one card from
 * - Must ask an opponent (player on the other team)
 * - Target must have at least one card
 */
export function literatureMoveGenerator(
  state: unknown,
  playerId: string,
): { action: Record<string, unknown> } | null {
  const litState = state as LiteratureState;
  const myHand = litState.hands[playerId];
  if (!myHand || myHand.length === 0) return null;

  const myCardIds = new Set(myHand.map(getCardId));
  const allSets = getAllCardSets();

  // Find sets I hold cards from
  const mySets = allSets.filter((s) => s.cardIds.some((id) => myCardIds.has(id)));

  // Cards I can ask for: in my sets but NOT in my hand
  const askableCandidates: string[] = [];
  for (const s of mySets) {
    for (const cardId of s.cardIds) {
      if (!myCardIds.has(cardId)) {
        askableCandidates.push(cardId);
      }
    }
  }

  if (askableCandidates.length === 0) return null;

  // Find opponents (other team members who have cards)
  const myTeam = litState.teams.teamA.includes(playerId) ? 'teamA' : 'teamB';
  const opponentTeamKey = myTeam === 'teamA' ? 'teamB' : 'teamA';
  const opponents = litState.teams[opponentTeamKey].filter(
    (pid) => litState.hands[pid] && litState.hands[pid].length > 0,
  );

  if (opponents.length === 0) return null;

  // Pick randomly
  const targetPlayer = opponents[Math.floor(Math.random() * opponents.length)];
  const card = askableCandidates[Math.floor(Math.random() * askableCandidates.length)];

  return {
    action: {
      type: 'ASK_CARD',
      targetPlayer,
      card: card as CardId,
    },
  };
}
