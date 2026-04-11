import { useEffect, useState } from 'react';
import { GAME_CATALOG } from '@the-green-felt/shared';
import { trpc } from '../../trpc';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import './lobby.css';

const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';

function getPlayerId(): string | null {
  return localStorage.getItem(STORAGE_KEY_PLAYER_ID);
}

interface JoinGameFormProps {
  gameCode?: string;
  isHost?: boolean;
  onJoinGame: (gameCode: string) => void;
  onLeaveRoom?: () => void;
  onStartGame?: (gameCode: string) => void;
  onGameStarted?: () => void;
  disabled: boolean;
}

export function JoinGameForm({
  gameCode: initialGameCode,
  isHost = false,
  onJoinGame,
  onLeaveRoom,
  onStartGame,
  onGameStarted,
  disabled,
}: JoinGameFormProps) {
  const [gameCode, setGameCode] = useState(initialGameCode ?? '');
  const [gameCodeError, setGameCodeError] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [peekError, setPeekError] = useState<string | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(isHost);
  const [roomClosed, setRoomClosed] = useState(false);
  const [gameTypeId, setGameTypeId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const gameInfo = gameTypeId ? GAME_CATALOG.find((g) => g.id === gameTypeId) : null;
  const canStartGame = isHost && gameInfo != null && players.length >= gameInfo.minPlayers;

  useEffect(() => {
    if (initialGameCode) {
      setGameCode(initialGameCode);
      fetchPlayers(initialGameCode);
    }
  }, [initialGameCode]);

  // Subscribe to real-time lobby updates when we have a room code and players
  useEffect(() => {
    if (!gameCode.trim() || players.length === 0) return;

    const subscription = trpc.lobby.onLobbyUpdate.subscribe(
      { roomCode: gameCode.trim() },
      {
        onData: (event) => {
          if (event.type === 'PLAYER_JOINED') {
            setPlayers((prev) => {
              if (prev.includes(event.playerId)) return prev;
              return [...prev, event.playerId];
            });
            setPlayerNames((prev) => ({ ...prev, [event.playerId]: event.playerName }));
          } else if (event.type === 'PLAYER_LEFT') {
            if (event.playerId === getPlayerId()) {
              // Current player was kicked by the host
              setJoined(false);
              setPlayers([]);
              onLeaveRoom?.();
              return;
            }
            setPlayers((prev) => prev.filter((p) => p !== event.playerId));
          } else if (event.type === 'ROOM_CLOSED') {
            setRoomClosed(true);
            setPlayers([]);
          } else if (event.type === 'GAME_STARTED') {
            onGameStarted?.();
          }
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [gameCode, players.length > 0]);

  const fetchPlayers = async (code: string) => {
    setPeeking(true);
    setPeekError(null);
    try {
      const room = await trpc.lobby.getRoom.query({ roomCode: code });
      setPlayers(room.players);
      setGameTypeId(room.gameTypeId);
      // Fetch player names
      const names = await trpc.lobby.getPlayerNames.query({ playerIds: room.players });
      setPlayerNames(names);
    } catch (err) {
      setPlayers([]);
      setPeekError(err instanceof Error ? err.message : 'Room not found');
    } finally {
      setPeeking(false);
    }
  };

  const handlePeek = () => {
    if (gameCode.trim()) {
      setGameCodeError(false);
      fetchPlayers(gameCode.trim());
    } else {
      setGameCodeError(true);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/join/${gameCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!gameCode.trim()) {
      setGameCodeError(true);
      return;
    }
    setJoined(true);
    onJoinGame(gameCode.trim());
  };

  const handleLeave = async () => {
    const pid = getPlayerId();
    if (!pid || !gameCode.trim()) return;
    try {
      await trpc.lobby.leaveRoom.mutate({ roomCode: gameCode.trim(), playerId: pid });
      setJoined(false);
      setPlayers([]);
      onLeaveRoom?.();
    } catch (err) {
      setPeekError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  };

  const handleClose = async () => {
    const pid = getPlayerId();
    if (!pid || !gameCode.trim()) return;
    try {
      await trpc.lobby.closeRoom.mutate({ roomCode: gameCode.trim(), hostPlayerId: pid });
      setPlayers([]);
      onLeaveRoom?.();
    } catch (err) {
      setPeekError(err instanceof Error ? err.message : 'Failed to close room');
    }
  };

  const handleKick = async (targetPlayerId: string) => {
    if (!gameCode.trim()) return;
    try {
      await trpc.lobby.leaveRoom.mutate({ roomCode: gameCode.trim(), playerId: targetPlayerId });
    } catch (err) {
      setPeekError(err instanceof Error ? err.message : 'Failed to remove player');
    }
  };

  return (
    <div>
      {peekError && (
        <Alert variant="danger" dismissible onClose={() => setPeekError(null)}>
          {peekError}
        </Alert>
      )}

      {roomClosed && (
        <Alert variant="warning" dismissible onClose={() => setRoomClosed(false)}>
          The host has closed this room.
        </Alert>
      )}

      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="Enter game code"
          value={gameCode}
          onChange={(e) => {
            setGameCode(e.target.value);
            setGameCodeError(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handlePeek()}
          isInvalid={gameCodeError}
          readOnly={isHost || joined}
        />
        <Button variant="secondary" onClick={handlePeek} disabled={disabled || peeking || isHost || joined}>
          {peeking ? 'Loading...' : 'Peek'}
        </Button>
      </InputGroup>

      {gameInfo && players.length > 0 && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <h5 className="mb-0 fw-bold">{gameInfo.displayName}</h5>
          <Button
            variant="link"
            size="sm"
            className="p-0 text-secondary"
            onClick={() => setShowRules(true)}
            aria-label="Game rules"
          >
            <i className="bi bi-info-circle" />
          </Button>
        </div>
      )}

      {gameInfo && (
        <Modal show={showRules} onHide={() => setShowRules(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{gameInfo.displayName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{gameInfo.description}</p>
            <p className="text-muted small mb-0">
              {gameInfo.minPlayers === gameInfo.maxPlayers
                ? `${gameInfo.minPlayers} players`
                : `${gameInfo.minPlayers}-${gameInfo.maxPlayers} players`}
            </p>
          </Modal.Body>
        </Modal>
      )}

      {players.length > 0 && (
        <Row xs={2} sm={3} className="g-2 mb-3">
          {players.map((playerId) => {
            const isMe = playerId === getPlayerId();
            const canKick = isHost && !isMe;
            const name = playerNames[playerId] ?? playerId.slice(0, 6);
            return (
              <Col key={playerId}>
                <Card className={`player-slot ${isMe ? 'selected' : 'occupied'}`}>
                  <Card.Body className="d-flex align-items-center justify-content-between p-2">
                    <div className="d-flex align-items-center">
                      <span className={`player-slot-number ${isMe ? 'selected' : 'occupied'}`}>
                        {playerId.slice(-2)}
                      </span>
                      <span className="ms-2 small">
                        {name}
                        {isMe && ' (you)'}
                      </span>
                    </div>
                    {canKick && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-0 px-1"
                        onClick={() => handleKick(playerId)}
                        aria-label={`Remove ${name}`}
                      >
                        &times;
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {players.length === 0 && !peekError && !roomClosed && !isHost && !joined && (
        <p className="text-center text-muted fst-italic my-4">
          Enter a game code and click Peek to see available slots
        </p>
      )}

      {isHost && gameCode && (
        <div className="text-center my-3">
          <p className="text-muted mb-2">Share this link with other players</p>
          {gameInfo && (
            <p className="small mb-2">
              {players.length} / {gameInfo.minPlayers} players needed
              {players.length >= gameInfo.minPlayers && ' (ready!)'}
            </p>
          )}
          <div className="d-flex justify-content-center gap-2">
            {canStartGame && (
              <Button variant="success" onClick={() => onStartGame?.(gameCode.trim())}>
                Start Game
              </Button>
            )}
            <Button variant="outline-primary" onClick={handleCopyLink}>
              {copied ? 'Copied!' : 'Copy Invite Link'}
            </Button>
            <Button variant="outline-danger" onClick={handleClose}>
              Close Room
            </Button>
          </div>
        </div>
      )}

      {!isHost && !joined && (
        <div className="text-center">
          <Button variant="primary" onClick={handleJoin} disabled={disabled || !gameCode.trim()}>
            Join
          </Button>
        </div>
      )}

      {!isHost && joined && (
        <div className="text-center">
          <Button variant="outline-danger" onClick={handleLeave}>
            Leave Room
          </Button>
        </div>
      )}
    </div>
  );
}
