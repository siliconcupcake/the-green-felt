import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Alert from 'react-bootstrap/Alert';
import { JoinGameForm } from '../components/lobby/JoinGameForm';
import { CreateGameForm } from '../components/lobby/CreateGameForm';
import { trpc } from '../trpc';
import { useLobbyStore } from '../stores/lobby-store';
import '../components/lobby/lobby.css';

const STORAGE_KEY_NAME = 'tgf:playerName';
const STORAGE_KEY_PLAYER_ID = 'tgf:playerId';
const STORAGE_KEY_ROOM_CODE = 'tgf:roomCode';

export function LobbyPage() {
  const { roomCode: routeRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const { activeTab, setActiveTab, isHost, setRoom, reset, error, setError } = useLobbyStore();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(STORAGE_KEY_NAME) ?? '');
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');

  // If arriving via /join/:roomCode, switch to join tab with the code
  useEffect(() => {
    if (routeRoomCode) {
      setCreatedRoomCode(routeRoomCode);
      setActiveTab('join');
    }
  }, [routeRoomCode, setActiveTab]);

  const saveLocalData = (name: string, id: string, roomCode: string) => {
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
    localStorage.setItem(STORAGE_KEY_ROOM_CODE, roomCode);
  };

  const handleCreateGame = async (gameTypeId: string) => {
    if (!playerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setLoading(true);
    setError(null);

    try {
      const result = await trpc.lobby.createRoom.mutate({
        gameTypeId,
        playerName: playerName.trim(),
      });

      setRoom(result.roomCode, true);
      saveLocalData(playerName, result.playerId, result.roomCode);
      setCreatedRoomCode(result.roomCode);
      setActiveTab('join');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameCode: string) => {
    if (!playerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setLoading(true);
    setError(null);

    try {
      const existingPlayerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID) ?? undefined;
      const result = await trpc.lobby.joinRoom.mutate({
        roomId: gameCode,
        playerName: playerName.trim(),
        playerId: existingPlayerId,
      });

      saveLocalData(playerName, result.playerId, gameCode);
      setRoom(gameCode, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setCreatedRoomCode('');
    localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
    reset();
    setActiveTab('create');
  };

  const handleStartGame = async (gameCode: string) => {
    const hostPlayerId = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!hostPlayerId) return;
    setLoading(true);
    setError(null);

    try {
      await trpc.lobby.startGame.mutate({ roomCode: gameCode, hostPlayerId });
      navigate('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleGameStarted = () => {
    navigate('/game');
  };

  return (
    <div className="lobby">
      <Container>
        <Row className="gy-4">
          <Col xs={12}>
            <h1 className="lobby-title">The Green Felt</h1>
          </Col>

          <Col xs={12}>
            <Card className="lobby-card">
              <Card.Body>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Row className="gy-3">
                  <Col xs={12}>
                    <Form.Group className="d-flex justify-content-center">
                      <Form.Control
                        type="text"
                        placeholder="who art thou?"
                        value={playerName}
                        onChange={(e) => {
                          setPlayerName(e.target.value);
                          setNameError(false);
                        }}
                        isInvalid={nameError}
                        className="lobby-name-input"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as 'create' | 'join')} justify>
                      <Tab eventKey="create" title="Host Game">
                        <Row className="gy-3 pt-3">
                          <Col xs={12}>
                            <CreateGameForm onCreateGame={handleCreateGame} disabled={loading} />
                          </Col>
                        </Row>
                      </Tab>
                      <Tab eventKey="join" title="Join Game">
                        <Row className="gy-3 pt-3">
                          <Col xs={12}>
                            <JoinGameForm
                              gameCode={createdRoomCode}
                              isHost={isHost}
                              onJoinGame={handleJoinGame}
                              onLeaveRoom={handleLeaveRoom}
                              onStartGame={handleStartGame}
                              onGameStarted={handleGameStarted}
                              disabled={loading}
                            />
                          </Col>
                        </Row>
                      </Tab>
                    </Tabs>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <p className="text-center mt-auto pt-4">
          <span className="lobby-footer">Made with ❤️ by siliconcupcake</span>
        </p>
      </Container>
    </div>
  );
}
