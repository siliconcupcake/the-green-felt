import { Suit, Rank, Color, createCard, type AnyCard, createJoker } from '@the-green-felt/shared';
import { Card } from './components/card/Card';
import './App.css';

const COLORS: Color[] = [Color.Red, Color.Black];
const SUITS = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
const RANKS = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King,
];

const SUIT_NAMES: Record<Suit, string> = {
  [Suit.Spades]: 'Spades',
  [Suit.Hearts]: 'Hearts',
  [Suit.Diamonds]: 'Diamonds',
  [Suit.Clubs]: 'Clubs',
};

function buildDeck(): Record<Suit, AnyCard[]> {
  const bySuit = {} as Record<Suit, AnyCard[]>;
  for (const suit of SUITS) {
    bySuit[suit] = RANKS.map((rank) => createCard(rank, suit));
  }
  return bySuit;
}

const deck = buildDeck();

export function App() {
  return (
    <div className="app">
      <h1 className="app-title">The Green Felt</h1>
      {SUITS.map((suit) => (
        <div key={suit} className="suit-group">
          <h2 className="suit-title">{SUIT_NAMES[suit]}</h2>
          <div className="card-row">
            {deck[suit].map((card) => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}
      <div className="suit-group">
        <h2 className="suit-title">Jokers</h2>
        <div className="card-row">
          {COLORS.map((color) => (
            <Card key={`JOKER_${color}`} card={createJoker(color)} />
          ))}
        </div>
      </div>
    </div>
  );
}
