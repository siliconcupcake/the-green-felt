import { useState, useRef, useCallback } from 'react';
import { createCard, createHidden, Rank, Suit } from '@the-green-felt/shared';
import type { AnyCard } from '@the-green-felt/shared';
import { AnimationPresetProvider, useAnimationPresetControls } from '../components/animation/AnimationPresetProvider';
import type { PresetName } from '../components/animation/presets';
import { Card } from '../components/card/Card';
import { CardFan } from '../components/card/CardFan';
import { DealingAnimation } from '../components/game/DealingAnimation';
import { CardTransferOverlay } from '../components/game/CardTransferOverlay';
import { SetDeclarationOverlay } from '../components/game/SetDeclarationOverlay';
import { PlayerSeat } from '../components/game/PlayerSeat';
import type { PlayerSeatHandle } from '../components/game/PlayerSeat';
import { GameInfoPanel } from '../components/game/GameInfoPanel';
import { YourTurnBanner } from '../components/game/YourTurnBanner';
import { ScoreCounter } from '../components/game/ScoreCounter';
import { GameToast } from '../components/game/GameToast';
import { computePlayerPositions } from '../components/game/GameTable';
import type { CardTransferState } from '../hooks/useCardTransfer';
import type { SetDeclarationState } from '../hooks/useSetDeclaration';
import './animations-page.css';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CARDS: AnyCard[] = [
  createCard(Rank.Ace, Suit.Spades),
  createCard(Rank.King, Suit.Hearts),
  createCard(Rank.Seven, Suit.Diamonds),
  createCard(Rank.Queen, Suit.Clubs),
  createCard(Rank.Ten, Suit.Spades),
];

const MOCK_HIDDEN: AnyCard[] = [
  createHidden(),
  createHidden(),
  createHidden(),
  createHidden(),
  createHidden(),
];

const MOCK_PLAYERS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const MOCK_POSITIONS = computePlayerPositions('p1', MOCK_PLAYERS);

const MOCK_TRANSFER: CardTransferState = {
  from: { x: 20, y: 20 },
  to: { x: 75, y: 80 },
  cardId: 'AS',
  flipToFaceUp: true,
};

const MOCK_DECLARATION_SUCCESS: SetDeclarationState = {
  cardIds: ['AS', 'AH', 'AD', 'AC', '2S', '2H'],
  cardOwnerPositions: {
    p1: { x: 50, y: 85 },
    p2: { x: 20, y: 30 },
    p3: { x: 80, y: 30 },
  },
  cardOwners: { AS: 'p1', AH: 'p1', AD: 'p2', AC: 'p2', '2S': 'p3', '2H': 'p3' },
  center: { x: 50, y: 50 },
  success: true,
};

const MOCK_DECLARATION_FAIL: SetDeclarationState = {
  ...MOCK_DECLARATION_SUCCESS,
  success: false,
};

// ---------------------------------------------------------------------------
// Preset selector
// ---------------------------------------------------------------------------

const PRESET_NAMES: PresetName[] = ['physical', 'snappy', 'elegant'];

interface PresetSelectorProps {
  current: PresetName;
  onChange: (name: PresetName) => void;
}

function PresetSelector({ current, onChange }: PresetSelectorProps) {
  return (
    <div className="preset-selector">
      {PRESET_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          className={`preset-btn ${current === name ? 'preset-btn--active' : ''}`}
          onClick={() => onChange(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Card Hover
// ---------------------------------------------------------------------------

function CardHoverSection() {
  return (
    <div className="animation-section">
      <h2>Card Hover</h2>
      <p>Hover over cards to see the lift and shadow animation driven by the active preset.</p>
      <div className="animation-stage">
        <div className="animation-stage-cards">
          {MOCK_CARDS.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Hand Layout (CardFan)
// ---------------------------------------------------------------------------

function HandLayoutSection() {
  const [cards, setCards] = useState<AnyCard[]>(MOCK_CARDS);

  const addCard = useCallback(() => {
    setCards((prev) => [...prev, createCard(Rank.Two, Suit.Hearts)]);
  }, []);

  const removeCard = useCallback(() => {
    setCards((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => {
    setCards(MOCK_CARDS);
  }, []);

  return (
    <div className="animation-section">
      <h2>Hand Layout (CardFan)</h2>
      <p>Add/remove cards to test the layout animation when the fan reflows.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={addCard}>
          Add Card
        </button>
        <button type="button" className="play-btn" onClick={removeCard}>
          Remove Card
        </button>
        <button type="button" className="play-btn" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="animation-stage">
        <div className="animation-stage-cards">
          <CardFan cards={cards} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Dealing Animation
// ---------------------------------------------------------------------------

function DealingSection() {
  const [dealKey, setDealKey] = useState(0);
  const [isDealing, setIsDealing] = useState(false);

  const startDeal = useCallback(() => {
    setDealKey((k) => k + 1);
    setIsDealing(true);
  }, []);

  const onComplete = useCallback(() => {
    setIsDealing(false);
  }, []);

  return (
    <div className="animation-section">
      <h2>Dealing Animation</h2>
      <p>Cards fly from a central deck to each player&apos;s seat in deal order.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={startDeal} disabled={isDealing}>
          {isDealing ? 'Dealing…' : 'Deal'}
        </button>
      </div>
      <div className="animation-stage animation-stage--tall">
        {isDealing && (
          <DealingAnimation
            key={dealKey}
            seatOrder={MOCK_PLAYERS}
            myCards={MOCK_CARDS}
            cardsPerPlayer={5}
            playerPositions={MOCK_POSITIONS}
            onComplete={onComplete}
          />
        )}
        {!isDealing && (
          <div className="anim-stage-centered" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Press Deal to start
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Card Transfer
// ---------------------------------------------------------------------------

function CardTransferSection() {
  const [transfer, setTransfer] = useState<CardTransferState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const trigger = useCallback(() => {
    setIsRunning(true);
    setTransfer(MOCK_TRANSFER);
  }, []);

  const onComplete = useCallback(() => {
    setTransfer(null);
    setIsRunning(false);
  }, []);

  return (
    <div className="animation-section">
      <h2>Card Transfer Overlay</h2>
      <p>A card slides from one player position to another, flipping face-up on arrival.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={trigger} disabled={isRunning}>
          {isRunning ? 'Transferring…' : 'Transfer Card'}
        </button>
      </div>
      <div className="animation-stage animation-stage--tall">
        <CardTransferOverlay transfer={transfer} onComplete={onComplete} />
        {!isRunning && (
          <div className="anim-stage-centered" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Press Transfer Card to start
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: PlayerSeat Shake
// ---------------------------------------------------------------------------

function ShakeSection() {
  const seatRef = useRef<PlayerSeatHandle>(null);

  const shake = useCallback(() => {
    seatRef.current?.shake();
  }, []);

  return (
    <div className="animation-section">
      <h2>Player Seat Shake</h2>
      <p>Triggered when a player&apos;s ask is denied — the seat shakes to signal failure.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={shake}>
          Shake
        </button>
      </div>
      <div className="animation-stage">
        <div className="shake-seat-wrapper">
          <PlayerSeat
            ref={seatRef}
            name="Alice"
            cards={MOCK_HIDDEN}
            score={2}
            isCurrentTurn={false}
            isTeammate={false}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Set Declaration
// ---------------------------------------------------------------------------

function SetDeclarationSection() {
  const [declaration, setDeclaration] = useState<SetDeclarationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const triggerSuccess = useCallback(() => {
    setIsRunning(true);
    setDeclaration(MOCK_DECLARATION_SUCCESS);
  }, []);

  const triggerFail = useCallback(() => {
    setIsRunning(true);
    setDeclaration(MOCK_DECLARATION_FAIL);
  }, []);

  const onComplete = useCallback(() => {
    setDeclaration(null);
    setIsRunning(false);
  }, []);

  return (
    <div className="animation-section">
      <h2>Set Declaration Overlay</h2>
      <p>
        Cards gather to center, then either flip face-up and fly to score (success) or shake and scatter back (fail).
      </p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={triggerSuccess} disabled={isRunning}>
          Success
        </button>
        <button type="button" className="play-btn" onClick={triggerFail} disabled={isRunning}
          style={{ background: '#e53935' }}>
          Fail
        </button>
      </div>
      <div className="animation-stage animation-stage--tall">
        <SetDeclarationOverlay declaration={declaration} onComplete={onComplete} />
        {!isRunning && (
          <div className="anim-stage-centered" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Press Success or Fail to start
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Turn Indicator (GameInfoPanel)
// ---------------------------------------------------------------------------

function TurnIndicatorSection() {
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isTeammateTurn, setIsTeammateTurn] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('Alice');

  const cyclePlayer = useCallback(() => {
    if (!isMyTurn && !isTeammateTurn) {
      setIsMyTurn(true);
      setCurrentPlayer('You');
    } else if (isMyTurn) {
      setIsMyTurn(false);
      setIsTeammateTurn(true);
      setCurrentPlayer('Bob (teammate)');
    } else {
      setIsTeammateTurn(false);
      setCurrentPlayer('Alice');
    }
  }, [isMyTurn, isTeammateTurn]);

  return (
    <div className="animation-section">
      <h2>Game Info Panel</h2>
      <p>Turn indicator dot and label animate when the active player changes.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={cyclePlayer}>
          Cycle Turn
        </button>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
          Current: <strong>{currentPlayer}</strong>
        </span>
      </div>
      <div className="animation-stage">
        <div style={{ padding: '1.5rem' }}>
          <GameInfoPanel
            roomCode="DEMO"
            currentTurnPlayer={currentPlayer}
            isMyTurn={isMyTurn}
            isTeammateTurn={isTeammateTurn}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Your Turn Banner
// ---------------------------------------------------------------------------

function YourTurnBannerSection() {
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [key, setKey] = useState(0);

  const trigger = useCallback(() => {
    setIsMyTurn(false);
    // Use a small timeout so re-mounting happens cleanly
    setTimeout(() => {
      setKey((k) => k + 1);
      setIsMyTurn(true);
    }, 50);
  }, []);

  return (
    <div className="animation-section">
      <h2>Your Turn Banner</h2>
      <p>An animated banner appears briefly when it becomes your turn, then auto-dismisses.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={trigger}>
          Trigger Banner
        </button>
      </div>
      <div className="animation-stage" style={{ minHeight: '160px' }}>
        <YourTurnBanner key={key} isMyTurn={isMyTurn} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Score Counter
// ---------------------------------------------------------------------------

function ScoreCounterSection() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const incrementA = useCallback(() => setScoreA((v) => v + 1), []);
  const incrementB = useCallback(() => setScoreB((v) => v + 1), []);
  const reset = useCallback(() => { setScoreA(0); setScoreB(0); }, []);

  return (
    <div className="animation-section">
      <h2>Score Counter</h2>
      <p>Score value pops with a spring animation when incremented.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={incrementA}>
          +1 Team A
        </button>
        <button type="button" className="play-btn" onClick={incrementB}>
          +1 Team B
        </button>
        <button type="button" className="play-btn" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="animation-stage">
        <div className="score-counter-row">
          <ScoreCounter label="Team A" value={scoreA} />
          <ScoreCounter label="Team B" value={scoreB} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Game Toast
// ---------------------------------------------------------------------------

const TOAST_MESSAGES = [
  'Alice asked Bob for the Ace of Spades — denied!',
  'Your team declared a set of Aces!',
  'Opponents declared a set of Kings.',
  'Bob transferred the Queen of Hearts to Alice.',
];

function GameToastSection() {
  const [message, setMessage] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);

  const trigger = useCallback(() => {
    setMessage(null);
    setTimeout(() => {
      setMessage(TOAST_MESSAGES[msgIndex % TOAST_MESSAGES.length]);
      setMsgIndex((i) => i + 1);
    }, 50);
  }, [msgIndex]);

  const dismiss = useCallback(() => setMessage(null), []);

  return (
    <div className="animation-section">
      <h2>Game Toast</h2>
      <p>Slide-in notification that auto-dismisses after the preset&apos;s toast hold duration.</p>
      <div className="animation-section-controls">
        <button type="button" className="play-btn" onClick={trigger}>
          Show Toast
        </button>
        <button type="button" className="play-btn" onClick={dismiss}
          style={{ background: '#757575' }}>
          Dismiss
        </button>
      </div>
      <div className="animation-stage toast-stage">
        <GameToast message={message} onDismiss={dismiss} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content (must be inside AnimationPresetProvider)
// ---------------------------------------------------------------------------

function AnimationsPageContent() {
  const { presetName, setPreset } = useAnimationPresetControls();

  return (
    <div className="animations-page">
      <header className="animations-header">
        <h1>Animation Test Page</h1>
        <PresetSelector current={presetName} onChange={setPreset} />
      </header>

      <div className="animations-sections">
        <CardHoverSection />
        <HandLayoutSection />
        <DealingSection />
        <CardTransferSection />
        <ShakeSection />
        <SetDeclarationSection />
        <TurnIndicatorSection />
        <YourTurnBannerSection />
        <ScoreCounterSection />
        <GameToastSection />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported page
// ---------------------------------------------------------------------------

export function AnimationsPage() {
  return (
    <AnimationPresetProvider>
      <AnimationsPageContent />
    </AnimationPresetProvider>
  );
}
