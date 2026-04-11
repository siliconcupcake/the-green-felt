// Card primitives
export {
  Suit,
  Rank,
  Color,
  isJoker,
  isHidden,
  makeCardId,
  makeJokerId,
  createCard,
  cardFromId,
  createJoker,
  createHidden,
} from './card.js';
export type { Card, JokerCard, HiddenCard, AnyCard, CardId } from './card.js';

// Deck configuration
export { STANDARD_52, STANDARD_54, PINOCHLE_48, EUCHRE_24 } from './deck-config.js';
export type { DeckConfig } from './deck-config.js';

// Game plugin contract
export type { GamePlugin, GameMetadata, GameResult } from './game-plugin.js';

// Game catalog
export { GAME_CATALOG } from './game-catalog.js';
export type { GameCatalogEntry } from './game-catalog.js';

// Persisted game state
export type { PersistedGameState, ActionLogEntry } from './game-state.js';

// Protocol types
export { ErrorCode } from './protocol.js';
export type { ServerEvent, DealSequenceData, LobbyRoom } from './protocol.js';
export type { LiteraturePlayerView } from './protocol.js';

// Error types
export { GameError } from './errors.js';
