/**
 * Static catalog of all games the platform supports.
 * Used by both server (to validate game IDs) and client (to display game cards).
 * Games marked as disabled are shown but not selectable.
 */

export interface GameCatalogEntry {
  readonly id: string;
  readonly displayName: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly description: string;
  readonly disabled?: boolean;
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'literature',
    displayName: 'Literature',
    minPlayers: 4,
    maxPlayers: 8,
    description: 'A team-based card game where players ask opponents for cards and declare complete sets.',
  },
  {
    id: 'rummy',
    displayName: 'Rummy',
    minPlayers: 2,
    maxPlayers: 6,
    description: 'Draw and discard to form sets and runs.',
    disabled: true,
  },
  {
    id: 'hearts',
    displayName: 'Hearts',
    minPlayers: 4,
    maxPlayers: 4,
    description: 'Avoid taking hearts and the queen of spades.',
    disabled: true,
  },
  {
    id: 'bridge',
    displayName: 'Bridge',
    minPlayers: 4,
    maxPlayers: 4,
    description: 'A classic team trick-taking card game.',
    disabled: true,
  },
];
