import { GAME_CATALOG } from '@the-green-felt/shared';

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
      <div className="text-[0.625rem] uppercase tracking-[0.2em] text-text-secondary mb-3">Choose a game</div>
      <div className="flex gap-3 mb-7 max-md:flex-wrap">
        {GAME_CATALOG.map((game) => {
          const isDisabled = !!game.disabled;

          const playerText =
            game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} players`
              : `${game.minPlayers}–${game.maxPlayers} players`;

          return (
            <div
              key={game.id}
              className={`flex-1 bg-surface border border-border rounded-card py-5 px-3 text-center transition-[border-color] duration-150 max-md:basis-[calc(50%-6px)] max-md:min-w-0 ${isDisabled ? 'opacity-[0.45]' : 'hover:border-accent-green-border'}`}
            >
              <div className={`text-[1.75rem] mb-2 ${isDisabled ? 'text-text-disabled' : 'text-accent-green'}`}>
                {SUIT_ICONS[game.id] ?? '♠'}
              </div>
              <div className={`text-sm font-semibold mb-[0.125rem] ${isDisabled ? 'text-text-secondary' : 'text-text-primary'}`}>
                {game.displayName}
              </div>
              <div className={`text-[0.6875rem] mb-3 ${isDisabled ? 'text-text-disabled' : 'text-text-secondary'}`}>
                {playerText}
              </div>
              {isDisabled ? (
                <span className="block w-full py-1.5 border-none rounded-button font-sans text-[0.6875rem] font-bold bg-border text-text-muted cursor-default">
                  COMING SOON
                </span>
              ) : (
                <button
                  className="block w-full py-1.5 border-none rounded-button font-sans text-[0.6875rem] font-bold cursor-pointer transition-opacity duration-150 bg-accent-green text-[#121212] hover:opacity-[0.85] disabled:opacity-50 disabled:cursor-not-allowed"
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
