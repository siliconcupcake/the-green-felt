import { getAvatarGradient } from '../../stores/lobby-store';

interface PlayerCardFilledProps {
  playerId: string;
  name: string;
  index: number;
  isSelf: boolean;
  isHost: boolean;
  canKick: boolean;
  onKick?: () => void;
}

interface PlayerCardEmptyProps {
  empty: true;
}

type PlayerCardProps = PlayerCardFilledProps | PlayerCardEmptyProps;

function isEmptyProps(props: PlayerCardProps): props is PlayerCardEmptyProps {
  return 'empty' in props && props.empty;
}

export function PlayerCard(props: PlayerCardProps) {
  if (isEmptyProps(props)) {
    return (
      <div className="flex items-center gap-2 bg-transparent border-[0.094rem] border-dashed border-border-subtle rounded-card p-[0.625rem] relative">
        <div className="w-[2.125rem] h-[2.125rem] rounded-full flex items-center justify-center shrink-0 border-[0.094rem] border-dashed border-border bg-transparent text-text-disabled text-base font-normal">
          +
        </div>
        <div className="min-w-0">
          <div className="text-xs font-normal text-text-disabled whitespace-nowrap overflow-hidden text-ellipsis">
            Empty
          </div>
        </div>
      </div>
    );
  }

  const { name, index, isSelf, isHost, canKick, onKick } = props;
  const [from, to] = getAvatarGradient(index);
  const initial = name.charAt(0).toUpperCase();
  const avatarColor = index === 0 ? '#121212' : '#fff';

  let roleText = 'Joined';
  if (isHost && isSelf) roleText = 'Host · You';
  else if (isHost) roleText = 'Host';
  else if (isSelf) roleText = 'You';

  return (
    <div
      className={`flex items-center gap-2 bg-surface border border-border rounded-card p-[0.625rem] relative ${isSelf ? 'bg-accent-green-bg border-accent-green-border' : ''}`}
    >
      <div
        className="w-[2.125rem] h-[2.125rem] rounded-full flex items-center justify-center font-bold text-sm shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: avatarColor }}
      >
        {initial}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
          {name}
        </div>
        <div className={`text-[0.5625rem] ${isSelf ? 'text-accent-green' : 'text-text-secondary'}`}>{roleText}</div>
      </div>
      {canKick && (
        <button
          className="ml-auto w-[1.375rem] h-[1.375rem] rounded-full border-none bg-accent-red-bg text-accent-red text-[0.625rem] cursor-pointer flex items-center justify-center p-0 shrink-0 transition-opacity duration-150 hover:opacity-70"
          onClick={onKick}
          aria-label={`Remove ${name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
