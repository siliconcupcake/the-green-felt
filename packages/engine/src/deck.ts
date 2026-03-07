import {
  type AnyCard,
  type DeckConfig,
  type Rank,
  type Suit,
  createCard,
  createJoker,
} from '@the-green-felt/shared';
import { shuffle, createRng } from './shuffle.js';

/**
 * Immutable Deck class.
 * Every mutation returns a new Deck instance.
 */
export class Deck {
  private constructor(private readonly cards: ReadonlyArray<AnyCard>) {}

  /** Create a deck from a DeckConfig */
  static create(config: DeckConfig): Deck {
    const cards: AnyCard[] = [];

    for (let d = 0; d < config.deckCount; d++) {
      for (const suit of config.suits) {
        for (const rank of config.ranks) {
          cards.push(createCard(rank as Rank, suit as Suit));
        }
      }
    }

    const jokerColors: Array<'red' | 'black'> = ['red', 'black'];
    for (let j = 0; j < config.jokerCount; j++) {
      cards.push(createJoker(jokerColors[j % 2]));
    }

    return new Deck(cards);
  }

  /** Number of cards remaining */
  get size(): number {
    return this.cards.length;
  }

  /** Shuffle the deck. Optionally accepts a seed for deterministic results. */
  shuffle(seed?: number): Deck {
    const rng = seed !== undefined ? createRng(seed) : undefined;
    return new Deck(shuffle(this.cards, rng));
  }

  /** Draw N cards from the top. Returns [drawnCards, remainingDeck]. */
  draw(count: number): [AnyCard[], Deck] {
    if (count > this.cards.length) {
      throw new Error(`Cannot draw ${count} cards from a deck of ${this.cards.length}`);
    }
    const drawn = this.cards.slice(0, count);
    const remaining = this.cards.slice(count);
    return [[...drawn], new Deck(remaining)];
  }

  /** Look at the top N cards without removing them. */
  peek(count: number): AnyCard[] {
    return [...this.cards.slice(0, Math.min(count, this.cards.length))];
  }

  /** Deal cards evenly to N players. Returns [playerHands[], remainingDeck]. */
  deal(playerCount: number, cardsPerPlayer: number): [AnyCard[][], Deck] {
    const totalNeeded = playerCount * cardsPerPlayer;
    if (totalNeeded > this.cards.length) {
      throw new Error(
        `Cannot deal ${cardsPerPlayer} cards to ${playerCount} players from a deck of ${this.cards.length}`,
      );
    }

    const hands: AnyCard[][] = Array.from({ length: playerCount }, () => []);

    // Deal one card at a time to each player in round-robin (like a real dealer)
    let cardIndex = 0;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let p = 0; p < playerCount; p++) {
        hands[p].push(this.cards[cardIndex]);
        cardIndex++;
      }
    }

    return [hands, new Deck(this.cards.slice(cardIndex))];
  }

  /** Return all cards as a readonly array (for serialization). */
  toArray(): ReadonlyArray<AnyCard> {
    return [...this.cards];
  }

  /** Reconstruct a Deck from a serialized array. */
  static fromArray(cards: AnyCard[]): Deck {
    return new Deck([...cards]);
  }
}
