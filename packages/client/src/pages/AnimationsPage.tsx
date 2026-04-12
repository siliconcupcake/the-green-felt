import React, { useState, useRef, useCallback } from 'react';
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

const TOAST_MESSAGES = [
  'Not your turn!',
  'Invalid action: you cannot ask yourself for a card.',
  'Alice does not have the Ace of Spades.',
  'Set declaration failed — incorrect card locations.',
];

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

interface TabDef {
  id: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'hover', label: 'Card Hover' },
  { id: 'hand', label: 'Hand Layout' },
  { id: 'dealing', label: 'Dealing' },
  { id: 'transfer', label: 'Card Transfer' },
  { id: 'shake', label: 'Shake' },
  { id: 'declare-success', label: 'Declare (Success)' },
  { id: 'declare-fail', label: 'Declare (Fail)' },
  { id: 'turn', label: 'Turn Indicator' },
  { id: 'banner', label: 'Your Turn Banner' },
  { id: 'score', label: 'Score Counter' },
  { id: 'toast', label: 'Game Toast' },
];

// ---------------------------------------------------------------------------
// Preset selector
// ---------------------------------------------------------------------------

const PRESET_NAMES: PresetName[] = ['physical', 'snappy', 'elegant'];

function PresetSelector({ current, onChange }: { current: PresetName; onChange: (name: PresetName) => void }) {
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
      <div className="animation-section-bar">
        <p>Hover over cards to see the lift and shadow spring. Click to toggle selection.</p>
      </div>
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
// Section: Hand Layout
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
      <div className="animation-section-bar">
        <p>Add/remove cards to see the layout reflow animation.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={addCard}>Add Card</button>
          <button type="button" className="play-btn" onClick={removeCard}>Remove Card</button>
          <button type="button" className="play-btn play-btn--muted" onClick={reset}>Reset</button>
        </div>
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
// Section: Dealing
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
      <div className="animation-section-bar">
        <p>Cards fly from a central deck to each player seat in round-robin deal order.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={startDeal} disabled={isDealing}>
            {isDealing ? 'Dealing\u2026' : 'Deal'}
          </button>
        </div>
      </div>
      <div className="animation-stage">
        {isDealing ? (
          <DealingAnimation
            key={dealKey}
            seatOrder={MOCK_PLAYERS}
            myCards={MOCK_CARDS}
            cardsPerPlayer={5}
            playerPositions={MOCK_POSITIONS}
            onComplete={onComplete}
          />
        ) : (
          <div className="animation-stage-centered">Press Deal to start</div>
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
      <div className="animation-section-bar">
        <p>A card slides from one player position to another, flipping face-up on arrival.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={trigger} disabled={isRunning}>
            {isRunning ? 'Transferring\u2026' : 'Transfer Card'}
          </button>
        </div>
      </div>
      <div className="animation-stage">
        <CardTransferOverlay transfer={transfer} onComplete={onComplete} />
        {!isRunning && <div className="animation-stage-centered">Press Transfer Card to start</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Shake
// ---------------------------------------------------------------------------

function ShakeSection() {
  const seatRef = useRef<PlayerSeatHandle>(null);

  const shake = useCallback(() => {
    seatRef.current?.shake();
  }, []);

  return (
    <div className="animation-section">
      <div className="animation-section-bar">
        <p>Opponent seat shakes horizontally to signal a failed card ask.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={shake}>Shake</button>
        </div>
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
// Section: Set Declaration (Success)
// ---------------------------------------------------------------------------

function DeclareSuccessSection() {
  const [declaration, setDeclaration] = useState<SetDeclarationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const trigger = useCallback(() => {
    setIsRunning(true);
    setDeclaration(MOCK_DECLARATION_SUCCESS);
  }, []);

  const onComplete = useCallback(() => {
    setDeclaration(null);
    setIsRunning(false);
  }, []);

  return (
    <div className="animation-section">
      <div className="animation-section-bar">
        <p>Cards gather to center, flip face-up to reveal the set, then fly to the score area.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={trigger} disabled={isRunning}>
            {isRunning ? 'Playing\u2026' : 'Declare (Success)'}
          </button>
        </div>
      </div>
      <div className="animation-stage">
        <SetDeclarationOverlay declaration={declaration} onComplete={onComplete} />
        {!isRunning && <div className="animation-stage-centered">Press Declare to start</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Set Declaration (Fail)
// ---------------------------------------------------------------------------

function DeclareFailSection() {
  const [declaration, setDeclaration] = useState<SetDeclarationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const trigger = useCallback(() => {
    setIsRunning(true);
    setDeclaration(MOCK_DECLARATION_FAIL);
  }, []);

  const onComplete = useCallback(() => {
    setDeclaration(null);
    setIsRunning(false);
  }, []);

  return (
    <div className="animation-section">
      <div className="animation-section-bar">
        <p>Cards gather to center, then shake and scatter back to original owners on failure.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn play-btn--danger" onClick={trigger} disabled={isRunning}>
            {isRunning ? 'Playing\u2026' : 'Declare (Fail)'}
          </button>
        </div>
      </div>
      <div className="animation-stage">
        <SetDeclarationOverlay declaration={declaration} onComplete={onComplete} />
        {!isRunning && <div className="animation-stage-centered">Press Declare to start</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Turn Indicator
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
      <div className="animation-section-bar">
        <p>Turn indicator dot and label animate when the active player changes.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={cyclePlayer}>Cycle Turn</button>
          <span className="status-label">Current: <strong>{currentPlayer}</strong></span>
        </div>
      </div>
      <div className="animation-stage">
        <div className="turn-indicator-wrapper">
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
    setTimeout(() => {
      setKey((k) => k + 1);
      setIsMyTurn(true);
    }, 50);
  }, []);

  return (
    <div className="animation-section">
      <div className="animation-section-bar">
        <p>Animated banner scales in when it becomes your turn, then auto-dismisses.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={trigger}>Show Banner</button>
        </div>
      </div>
      <div className="animation-stage">
        <YourTurnBanner key={key} isMyTurn={isMyTurn} />
        {!isMyTurn && <div className="animation-stage-centered">Press Show Banner to trigger</div>}
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
  const reset = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
  }, []);

  return (
    <div className="animation-section">
      <div className="animation-section-bar">
        <p>Score value pops with a spring animation when incremented.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={incrementA}>+1 Team A</button>
          <button type="button" className="play-btn" onClick={incrementB}>+1 Team B</button>
          <button type="button" className="play-btn play-btn--muted" onClick={reset}>Reset</button>
        </div>
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
      <div className="animation-section-bar">
        <p>Slide-in notification that auto-dismisses after the preset hold duration.</p>
        <div className="animation-section-controls">
          <button type="button" className="play-btn" onClick={trigger}>Show Toast</button>
          <button type="button" className="play-btn play-btn--muted" onClick={dismiss}>Dismiss</button>
        </div>
      </div>
      <div className="animation-stage toast-stage">
        <GameToast message={message} onDismiss={dismiss} />
        {!message && <div className="animation-stage-centered">Press Show Toast to trigger</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab → section map
// ---------------------------------------------------------------------------

const TAB_SECTIONS: Record<string, () => React.JSX.Element> = {
  hover: CardHoverSection,
  hand: HandLayoutSection,
  dealing: DealingSection,
  transfer: CardTransferSection,
  shake: ShakeSection,
  'declare-success': DeclareSuccessSection,
  'declare-fail': DeclareFailSection,
  turn: TurnIndicatorSection,
  banner: YourTurnBannerSection,
  score: ScoreCounterSection,
  toast: GameToastSection,
};

// ---------------------------------------------------------------------------
// Page content (inside AnimationPresetProvider)
// ---------------------------------------------------------------------------

function AnimationsPageContent() {
  const { presetName, setPreset } = useAnimationPresetControls();
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const ActiveSection = TAB_SECTIONS[activeTab];

  return (
    <div className="animations-page">
      <header className="animations-header">
        <h1>Animation Test Page</h1>
        <div className="animations-header-right">
          <PresetSelector current={presetName} onChange={setPreset} />
        </div>
      </header>

      <nav className="animations-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`animations-tab ${activeTab === tab.id ? 'animations-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="animations-tab-content">
        <ActiveSection />
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
