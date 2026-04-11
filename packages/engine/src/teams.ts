import { shuffle } from './shuffle.js';

/**
 * Randomize the seating order and assign teams by round-robin.
 *
 * The returned `seatOrder` is the randomized player order around the table.
 * Teams are derived by assigning seat 0 → "A", seat 1 → "B", seat 2 → "A", etc.
 *
 * @returns `seatOrder` (randomized) and `teams` (labels → player IDs).
 */
export function assignTeams(
  players: string[],
  teamsCount: number,
  rng?: () => number,
): { seatOrder: string[]; teams: Record<string, string[]> } {
  const seatOrder = shuffle(players, rng);
  const teams: Record<string, string[]> = {};

  for (let i = 0; i < teamsCount; i++) {
    teams[String.fromCharCode(65 + i)] = [];
  }

  for (let i = 0; i < seatOrder.length; i++) {
    const label = String.fromCharCode(65 + (i % teamsCount));
    teams[label].push(seatOrder[i]);
  }

  return { seatOrder, teams };
}
