export enum Suit {
  Clubs = 'C',
  Diamonds = 'D',
  Hearts = 'H',
  Spades = 'S',
}

export enum Color {
  Red = 'red',
  Black = 'black',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

/** Branded string type for serialized card identity, e.g. "AS", "TC", "JOKER_RED" */
export type CardId = string & { readonly __brand: 'CardId' };

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
  readonly id: CardId;
}

export interface JokerCard {
  readonly isJoker: true;
  readonly color: Color;
  readonly id: CardId;
}

export interface HiddenCard {
  readonly isHidden: true;
  readonly id: CardId;
}

export type AnyCard = Card | JokerCard | HiddenCard;

export function isJoker(card: AnyCard): card is JokerCard {
  return 'isJoker' in card && card.isJoker;
}

export function isHidden(card: AnyCard): card is HiddenCard {
  return 'isHidden' in card && card.isHidden;
}

export function makeCardId(rank: Rank, suit: Suit): CardId {
  return `${rank}${suit}` as CardId;
}

export function makeJokerId(_color: Color): CardId {
  // TODO: Add support for colored jokers
  return `JKR` as CardId;
}

export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: makeCardId(rank, suit) };
}

/** Reconstruct a Card from its ID string (e.g. "AS", "2H", "TC"). */
export function cardFromId(id: string): Card {
  const rankStr = id.slice(0, -1);
  const suitStr = id.slice(-1);
  const rank = Object.values(Rank).find((r) => r === rankStr);
  const suit = Object.values(Suit).find((s) => s === suitStr);
  if (!rank || !suit) throw new Error(`Invalid card ID: ${id}`);
  return createCard(rank, suit);
}

export function createJoker(color: Color): JokerCard {
  return { isJoker: true, color, id: makeJokerId(color) };
}

const HIDDEN_CARD_ID = 'HIDDEN' as CardId;

export function createHidden(): HiddenCard {
  return { isHidden: true, id: HIDDEN_CARD_ID };
}
