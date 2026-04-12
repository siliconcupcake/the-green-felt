import { GAME_CATALOG } from '@the-green-felt/shared';
import './lobby.css';

const SUIT_ICONS: Record<string, string> = {
  literature: '♠',
  rummy: '♦',
  hearts: '♥',
  bridge: '♣',
};

interface GameCatalogProps {
  onHost: (gameTypeId: string) => void;
  disabled: boolean;
}

export function GameCatalog({ onHost, disabled }: GameCatalogProps) {
  return (
    <div>
      <div className="lobby-section-label">Choose a game</div>
      <div className="game-catalog">
        {GAME_CATALOG.map((game) => {
          const isDisabled = !!game.disabled;
          const cardClass = `game-catalog-card${isDisabled ? ' game-catalog-card--disabled' : ''}`;
          const playerText =
            game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} players`
              : `${game.minPlayers}–${game.maxPlayers} players`;

          return (
            <div key={game.id} className={cardClass}>
              <div className="game-catalog-card__icon">{SUIT_ICONS[game.id] ?? '♠'}</div>
              <div className="game-catalog-card__name">{game.displayName}</div>
              <div className="game-catalog-card__players">{playerText}</div>
              {isDisabled ? (
                <span className="game-catalog-card__button game-catalog-card__button--soon">COMING SOON</span>
              ) : (
                <button
                  className="game-catalog-card__button game-catalog-card__button--host"
                  onClick={() => onHost(game.id)}
                  disabled={disabled}
                  aria-label={`Host ${game.displayName} game`}
                >
                  HOST GAME
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
