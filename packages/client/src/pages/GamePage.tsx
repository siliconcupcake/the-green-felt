import { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate } from 'react-router';
import type { AnyCard, DealSequenceData, LiteraturePlayerView } from '@the-green-felt/shared';
import { cardFromId, createHidden } from '@the-green-felt/shared';
import { GameTable, computePlayerPositions, type GamePlayer } from '../components/game/GameTable';
import { DealingAnimation } from '../components/game/DealingAnimation';
import { AnimationPresetProvider } from '../components/animation/AnimationPresetProvider';
import { trpc } from '../trpc';

const STORAGE_KEY_ROOM_CODE = 'tgf:roomCode';
const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';
const STORAGE_KEY_NAME = 'tgf:playerName';

export function GamePage() {
  const roomCode = localStorage.getItem(STORAGE_KEY_ROOM_CODE);
  const playerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
  const myName = localStorage.getItem(STORAGE_KEY_NAME) ?? 'You';

  const [gameView, setGameView] = useState<LiteraturePlayerView | null>(null);
  const [dealSequence, setDealSequence] = useState<DealSequenceData | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingGameView = useRef<LiteraturePlayerView | null>(null);
  const isDealingRef = useRef(false);

  // Subscribe to game events
  useEffect(() => {
    if (!roomCode || !playerId) return;

    const subscription = trpc.game.onGameUpdate.subscribe(
      { gameId: roomCode, playerId },
      {
        onData: (event) => {
          if (event.type === 'DEAL_SEQUENCE') {
            setDealSequence(event);
            setIsDealing(true);
            isDealingRef.current = true;
          } else if (event.type === 'GAME_STATE') {
            const view = event.view as LiteraturePlayerView;
            if (isDealingRef.current) {
              pendingGameView.current = view;
            } else {
              setGameView(view);
            }
          } else if (event.type === 'ACTION_REJECTED') {
            setErrorMessage(event.reason);
          }
        },
      },
    );

    return () => subscription.unsubscribe();
  }, [roomCode, playerId]);

  // Fetch player names
  useEffect(() => {
    if (!roomCode) return;
    trpc.lobby.getRoom.query({ roomCode }).then((room) => {
      return trpc.lobby.getPlayerNames.query({ playerIds: room.players });
    }).then((names) => {
      setPlayerNames(names);
    }).catch(() => {
      // Room may have been cleaned up
    });
  }, [roomCode]);

  const handleDealingComplete = useCallback(() => {
    setIsDealing(false);
    isDealingRef.current = false;
    setDealSequence(null);
    if (pendingGameView.current) {
      setGameView(pendingGameView.current);
      pendingGameView.current = null;
    }
  }, []);

  const handleErrorDismiss = useCallback(() => {
    setErrorMessage(null);
  }, []);

  if (!roomCode || !playerId) {
    return <Navigate to="/" replace />;
  }

  // Show dealing animation
  if (isDealing && dealSequence) {
    const positions = computePlayerPositions(playerId, dealSequence.seatOrder);
    const cardsPerPlayer = dealSequence.myCardIds.length;
    const myCards = dealSequence.myCardIds.map((id) => cardFromId(id));

    return (
      <AnimationPresetProvider>
        <div className="game-table">
          <DealingAnimation
            seatOrder={dealSequence.seatOrder}
            myCards={myCards}
            cardsPerPlayer={cardsPerPlayer}
            playerPositions={positions}
            onComplete={handleDealingComplete}
          />
        </div>
      </AnimationPresetProvider>
    );
  }

  // Show real game state
  if (gameView) {
    const getName = (id: string) => (id === playerId ? myName : playerNames[id] ?? id.slice(0, 6));

    const myTeam = gameView.teams.teamA.includes(playerId) ? 'A' : 'B';

    const currentPlayer: GamePlayer = {
      id: playerId,
      name: myName,
      cards: gameView.myHand,
      isCurrentTurn: gameView.currentTurn === playerId,
      team: myTeam,
      score: myTeam === 'A' ? gameView.scores.teamA : gameView.scores.teamB,
    };

    const opponentIds = Object.keys(gameView.otherPlayerCardCounts);
    const opponents: GamePlayer[] = opponentIds.map((pid) => {
      const cardCount = gameView.otherPlayerCardCounts[pid];
      const hiddenCards: AnyCard[] = Array.from({ length: cardCount }, () => createHidden());
      const opTeam = gameView.teams.teamA.includes(pid) ? 'A' : 'B';
      return {
        id: pid,
        name: getName(pid),
        cards: hiddenCards,
        isCurrentTurn: gameView.currentTurn === pid,
        team: opTeam,
        score: opTeam === 'A' ? gameView.scores.teamA : gameView.scores.teamB,
      };
    });

    const turnPlayer = gameView.currentTurn === playerId ? currentPlayer : opponents.find((o) => o.isCurrentTurn);
    const isMyTurn = currentPlayer.isCurrentTurn;
    const isTeammateTurn = !isMyTurn && turnPlayer?.team === currentPlayer.team;

    const content = (
      <GameTable
        currentPlayer={currentPlayer}
        opponents={opponents}
        turnPlayerName={turnPlayer?.name ?? ''}
        isMyTurn={isMyTurn}
        isTeammateTurn={isTeammateTurn ?? false}
        roomCode={roomCode}
        drawPile={[]}
        discardPile={[]}
        onCardClick={(card) => console.log('Clicked:', card.id)}
        errorMessage={errorMessage}
        onErrorDismiss={handleErrorDismiss}
      />
    );

    return <AnimationPresetProvider>{content}</AnimationPresetProvider>;
  }

  // Waiting for game state
  return (
    <div className="game-table" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '1.2rem' }}>Waiting for game to start...</span>
    </div>
  );
}
