export enum Suit {
  Clubs = 'C',
  Diamonds = 'D',
  Hearts = 'H',
  Spades = 'S',
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
  readonly color: 'red' | 'black';
  readonly id: CardId;
}

export type AnyCard = Card | JokerCard;

export function isJoker(card: AnyCard): card is JokerCard {
  return 'isJoker' in card && card.isJoker;
}

export function makeCardId(rank: Rank, suit: Suit): CardId {
  return `${rank}${suit}` as CardId;
}

export function makeJokerId(color: 'red' | 'black'): CardId {
  return `JOKER_${color.toUpperCase()}` as CardId;
}

export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: makeCardId(rank, suit) };
}

export function createJoker(color: 'red' | 'black'): JokerCard {
  return { isJoker: true, color, id: makeJokerId(color) };
}
