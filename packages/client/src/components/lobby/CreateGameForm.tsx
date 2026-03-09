import { useState } from 'react';
import { GAME_CATALOG } from '@the-green-felt/shared';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import './lobby.css';

interface CreateGameFormProps {
  onCreateGame: (gameTypeId: string) => void;
  disabled: boolean;
}

export function CreateGameForm({ onCreateGame, disabled }: CreateGameFormProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleCardClick = (index: number, isDisabled: boolean) => {
    if (!isDisabled) {
      setSelectedIndex(index);
    }
  };

  const handleSubmit = () => {
    if (selectedIndex >= 0) {
      onCreateGame(GAME_CATALOG[selectedIndex].id);
    }
  };

  return (
    <div>
      <Row xs={1} sm={2} md={3} className="g-3 mb-3">
        {GAME_CATALOG.map((game, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Col key={game.id}>
              <Card
                className={`game-type-card ${isSelected ? 'selected' : ''} ${game.disabled ? 'disabled' : ''}`}
                onClick={() => handleCardClick(index, !!game.disabled)}
                role="button"
                aria-pressed={isSelected}
              >
                <Card.Body className="p-2">
                  <Card.Title className="fs-6 fw-bold mb-1">{game.displayName}</Card.Title>
                  <Card.Text className="text-muted small mb-2">{game.description}</Card.Text>
                  <div>
                    <Badge bg="info" className="me-1">
                      {game.minPlayers === game.maxPlayers
                        ? `${game.minPlayers} players`
                        : `${game.minPlayers}-${game.maxPlayers} players`}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
      <div className="text-center">
        <Button variant="primary" onClick={handleSubmit} disabled={disabled || selectedIndex < 0}>
          Host
        </Button>
      </div>
    </div>
  );
}
