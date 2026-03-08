import { Suit, Color, createCard, type AnyCard, createJoker, STANDARD_54 } from '@the-green-felt/shared';
import { CardFan } from './components/card/CardFan';
import './App.css';

const COLORS: Color[] = [Color.Red, Color.Black];

function buildDeck(): Record<Suit, AnyCard[]> {
  const bySuit = {} as Record<Suit, AnyCard[]>;
  const { suits, ranks } = STANDARD_54;
  for (const suit of suits) {
    const cards: AnyCard[] = ranks.map((rank) => createCard(rank, suit));
    cards.push(createJoker(suit == Suit.Clubs || suit == Suit.Spades ? Color.Black : Color.Red)); // Assign jokers to suits for demo
    bySuit[suit] = cards;
  }
  return bySuit;
}

const deck = buildDeck();

export function App() {
  return (
    <div className="app">
      <h1 className="app-title">The Green Felt</h1>
      {(Object.keys(deck) as Suit[]).map((suit) => (
        <div key={suit} className="suit-group">
          <CardFan cards={deck[suit]} />
        </div>
      ))}
    </div>
  );
}
