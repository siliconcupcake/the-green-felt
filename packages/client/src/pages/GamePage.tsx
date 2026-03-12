import { Navigate } from 'react-router';
import { createCard, type AnyCard, STANDARD_52 } from '@the-green-felt/shared';
import { GameTable, type GamePlayer } from '../components/game/GameTable';

const STORAGE_KEY_ROOM_CODE = 'tgf:roomCode';
const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';
const STORAGE_KEY_NAME = 'tgf:playerName';

const CARDS_PER_PLAYER = 5;
const TEAMS = ['Alpha', 'Beta'];

function buildMockGameState(myName: string) {
  const playerNames = [myName, 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy'];

  const { suits, ranks } = STANDARD_52;
  const allCards: AnyCard[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      allCards.push(createCard(rank, suit));
    }
  }

  // Shuffle
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  const totalDealt = playerNames.length * CARDS_PER_PLAYER;
  const turnIndex = 2; // Bob's turn for demo

  const players: GamePlayer[] = playerNames.map((name, i) => ({
    id: `player-${i}`,
    name,
    cards: allCards.slice(i * CARDS_PER_PLAYER, (i + 1) * CARDS_PER_PLAYER),
    isCurrentTurn: i === turnIndex,
    team: TEAMS[i % TEAMS.length],
    score: Math.floor(Math.random() * 10),
  }));

  const remaining = allCards.slice(totalDealt);
  const discardPile = remaining.slice(0, 3);
  const drawPile = remaining.slice(3);

  return { players, drawPile, discardPile };
}

let mockState: ReturnType<typeof buildMockGameState> | null = null;

function getMockState(myName: string) {
  if (!mockState) {
    mockState = buildMockGameState(myName);
  }
  return mockState;
}

export function GamePage() {
  const roomCode = localStorage.getItem(STORAGE_KEY_ROOM_CODE);
  const playerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
  const myName = localStorage.getItem(STORAGE_KEY_NAME) ?? 'You';

  if (!roomCode || !playerId) {
    return <Navigate to="/" replace />;
  }

  const state = getMockState(myName);
  const currentPlayer = state.players[0];
  const opponents = state.players.slice(1);
  const turnPlayer = state.players.find((p) => p.isCurrentTurn);

  const isMyTurn = currentPlayer.isCurrentTurn;
  const isTeammateTurn = !isMyTurn && turnPlayer?.team === currentPlayer.team;

  return (
    <GameTable
      currentPlayer={currentPlayer}
      opponents={opponents}
      turnPlayerName={turnPlayer?.name ?? ''}
      isMyTurn={isMyTurn}
      isTeammateTurn={isTeammateTurn}
      roomCode={roomCode}
      drawPile={state.drawPile}
      discardPile={state.discardPile}
      onCardClick={(card) => console.log('Clicked:', card.id)}
    />
  );
}
