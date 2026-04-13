import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { Spade, Diamond, Heart, Club, Loader2 } from 'lucide-react';
import { GAME_CATALOG } from '@the-green-felt/shared';
import type { LucideIcon } from 'lucide-react';

const SUIT_ICONS: Record<string, LucideIcon> = {
  literature: Spade,
  rummy: Diamond,
  hearts: Heart,
  bridge: Club,
};

const SUIT_COLORS: Record<string, string> = {
  literature: 'text-text-primary',
  rummy: 'text-accent-red',
  hearts: 'text-accent-red',
  bridge: 'text-text-primary',
};

interface GameCatalogProps {
  onHost: (gameTypeId: string) => void;
  disabled: boolean;
  loadingGameId: string | null;
}

function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
}

export function GameCatalog({ onHost, disabled, loadingGameId }: GameCatalogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <section>
      <h2 className="text-[0.8125rem] font-medium tracking-[0.15em] uppercase text-text-secondary mb-5">
        Pick your game
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-9">
        {GAME_CATALOG.map((game, index) => {
          const isDisabled = !!game.disabled;
          const isLoading = loadingGameId === game.id;
          const isDimmed = !!loadingGameId && loadingGameId !== game.id;
          const suitColor = SUIT_COLORS[game.id] ?? 'text-text-primary';
          const SuitIcon = SUIT_ICONS[game.id] ?? Spade;

          const playerText =
            game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} players`
              : `${game.minPlayers}\u2013${game.maxPlayers} players`;

          return (
            <div
              key={game.id}
              className={`card-spotlight bg-surface border border-border rounded-card p-6 text-center transition-[transform,border-color,box-shadow,opacity] duration-150 ease-snappy ${
                isDisabled
                  ? 'opacity-40 cursor-default'
                  : isDimmed
                    ? 'opacity-40 pointer-events-none'
                    : 'hover:border-accent-green-border hover:shadow-card-hover hover:-translate-y-[0.0625rem] active:scale-[0.98] active:translate-y-0 active:shadow-card-active cursor-pointer'
              }`}
              style={{
                transitionDelay: mounted ? '0ms' : `${index * 50}ms`,
                opacity: mounted ? undefined : 0,
                transform: mounted ? undefined : 'translateY(0.5rem)',
              }}
              onMouseMove={isDisabled ? undefined : handleMouseMove}
              onClick={isDisabled || disabled ? undefined : () => onHost(game.id)}
              onKeyDown={
                isDisabled || disabled
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onHost(game.id);
                      }
                    }
              }
              role={isDisabled ? undefined : 'button'}
              tabIndex={isDisabled ? undefined : 0}
              aria-label={isDisabled ? undefined : `Host ${game.displayName} game`}
              aria-disabled={disabled || undefined}
            >
              <div className={`mb-2.5 flex justify-center ${isDisabled ? 'text-text-disabled' : suitColor}`}>
                {isLoading ? (
                  <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-accent-green" />
                ) : (
                  <SuitIcon size={28} strokeWidth={1.5} />
                )}
              </div>
              <div
                className={`text-[1rem] font-semibold mb-1 ${isDisabled ? 'text-text-secondary' : 'text-text-primary'}`}
              >
                {game.displayName}
              </div>
              <div
                className={`text-[0.8125rem] mb-1.5 ${isDisabled ? 'text-text-disabled' : 'text-text-secondary'}`}
              >
                {playerText}
              </div>
              <p className="text-[0.72rem] leading-relaxed text-text-muted mb-3.5 mx-auto max-w-[11.5rem] hidden md:block">
                {game.description}
              </p>
              {isDisabled ? (
                <span className="inline-block py-2 px-5 rounded-button font-sans text-[0.72rem] font-semibold bg-border text-text-muted">
                  Coming soon
                </span>
              ) : (
                <span className="inline-block py-2 px-5 rounded-button font-sans text-[0.72rem] font-semibold bg-accent-green text-[#0f1210] transition-colors duration-150">
                  {isLoading ? 'Creating...' : 'Host game'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
