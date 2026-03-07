import { type AnyCard, type CardId, isJoker } from '@the-green-felt/shared';

/**
 * Immutable Hand class — a managed collection of cards belonging to a player.
 * Every mutation returns a new Hand instance.
 */
export class Hand {
  private constructor(private readonly cards: ReadonlyArray<AnyCard>) {}

  static empty(): Hand {
    return new Hand([]);
  }

  static from(cards: AnyCard[]): Hand {
    return new Hand([...cards]);
  }

  get size(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  /** Add one or more cards to the hand. */
  add(...newCards: AnyCard[]): Hand {
    return new Hand([...this.cards, ...newCards]);
  }

  /** Remove a card by ID. Throws if not found. */
  remove(cardId: CardId): [AnyCard, Hand] {
    const index = this.cards.findIndex((c) => c.id === cardId);
    if (index === -1) {
      throw new Error(`Card ${cardId} not found in hand`);
    }
    const removed = this.cards[index];
    const remaining = [...this.cards.slice(0, index), ...this.cards.slice(index + 1)];
    return [removed, new Hand(remaining)];
  }

  /** Check if the hand contains a specific card. */
  has(cardId: CardId): boolean {
    return this.cards.some((c) => c.id === cardId);
  }

  /** Find a card by ID, or undefined if not present. */
  find(cardId: CardId): AnyCard | undefined {
    return this.cards.find((c) => c.id === cardId);
  }

  /** Return all cards as an array. */
  toArray(): AnyCard[] {
    return [...this.cards];
  }

  /** Sort cards by suit then rank. */
  sorted(): Hand {
    const sorted = [...this.cards].sort((a, b) => {
      if (isJoker(a) && isJoker(b)) return 0;
      if (isJoker(a)) return 1;
      if (isJoker(b)) return -1;
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank.localeCompare(b.rank);
    });
    return new Hand(sorted);
  }

  /** Group cards by suit. Jokers are grouped under "JOKER". */
  groupBySuit(): Map<string, AnyCard[]> {
    const groups = new Map<string, AnyCard[]>();
    for (const card of this.cards) {
      const key = isJoker(card) ? 'JOKER' : card.suit;
      const group = groups.get(key) ?? [];
      group.push(card);
      groups.set(key, group);
    }
    return groups;
  }

  /** Filter cards matching a predicate. */
  filter(predicate: (card: AnyCard) => boolean): Hand {
    return new Hand(this.cards.filter(predicate));
  }
}
