import { Rank, Suit } from './card.js';

export interface DeckConfig {
  /** Which suits to include */
  suits: Suit[];
  /** Which ranks to include */
  ranks: Rank[];
  /** Number of jokers (0, 1, or 2 typically) */
  jokerCount: number;
  /** Number of full decks to combine (e.g. 2 for Canasta) */
  deckCount: number;
}

/** Standard 52-card deck (no jokers) */
export const STANDARD_52: DeckConfig = {
  suits: [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades],
  ranks: [
    Rank.Ace,
    Rank.Two,
    Rank.Three,
    Rank.Four,
    Rank.Five,
    Rank.Six,
    Rank.Seven,
    Rank.Eight,
    Rank.Nine,
    Rank.Ten,
    Rank.Jack,
    Rank.Queen,
    Rank.King,
  ],
  jokerCount: 0,
  deckCount: 1,
};

/** Standard 54-card deck (with 2 jokers) */
export const STANDARD_54: DeckConfig = { ...STANDARD_52, jokerCount: 2 };

/** Pinochle 48-card deck (9-A in all suits, doubled) */
export const PINOCHLE_48: DeckConfig = {
  suits: [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades],
  ranks: [Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace],
  jokerCount: 0,
  deckCount: 2,
};

/** Euchre 24-card deck (9-A in all suits) */
export const EUCHRE_24: DeckConfig = {
  suits: [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades],
  ranks: [Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace],
  jokerCount: 0,
  deckCount: 1,
};
