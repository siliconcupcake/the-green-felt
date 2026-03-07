import { type AnyCard, type CardId } from '@the-green-felt/shared';

/**
 * Set operations on collections of cards.
 * Useful for validating melds, sets, runs, etc.
 */
export class CardSet {
  private readonly cardMap: Map<CardId, AnyCard>;

  constructor(cards: AnyCard[]) {
    this.cardMap = new Map(cards.map((c) => [c.id, c]));
  }

  get size(): number {
    return this.cardMap.size;
  }

  has(cardId: CardId): boolean {
    return this.cardMap.has(cardId);
  }

  toArray(): AnyCard[] {
    return [...this.cardMap.values()];
  }

  /** Cards present in both sets */
  intersection(other: CardSet): CardSet {
    const result: AnyCard[] = [];
    for (const [id, card] of this.cardMap) {
      if (other.has(id)) result.push(card);
    }
    return new CardSet(result);
  }

  /** Cards in this set but not in other */
  difference(other: CardSet): CardSet {
    const result: AnyCard[] = [];
    for (const [id, card] of this.cardMap) {
      if (!other.has(id)) result.push(card);
    }
    return new CardSet(result);
  }

  /** Cards in either set */
  union(other: CardSet): CardSet {
    const combined = [...this.cardMap.values(), ...other.difference(this).toArray()];
    return new CardSet(combined);
  }

  /** True if this set contains all cards in other */
  containsAll(other: CardSet): boolean {
    for (const id of other.cardMap.keys()) {
      if (!this.cardMap.has(id)) return false;
    }
    return true;
  }

  /** True if both sets have exactly the same cards */
  equals(other: CardSet): boolean {
    return this.size === other.size && this.containsAll(other);
  }
}
