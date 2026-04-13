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
      <div className="flex items-center gap-3 bg-transparent border border-dashed border-border rounded-card p-3.5 relative opacity-50">
        <div className="w-[2.625rem] h-[2.625rem] rounded-full flex items-center justify-center shrink-0 border border-dashed border-border bg-transparent text-text-disabled text-lg font-light">
          +
        </div>
        <div className="min-w-0">
          <div className="text-[0.8125rem] font-normal text-text-disabled">
            Open slot
          </div>
        </div>
      </div>
    );
  }

  const { name, index, isSelf, isHost, canKick, onKick } = props;
  const [from, to] = getAvatarGradient(index);
  const initial = name.charAt(0).toUpperCase();
  const avatarColor = index === 0 ? '#0f1210' : '#fff';

  let roleText = 'Joined';
  if (isHost && isSelf) roleText = 'Host · You';
  else if (isHost) roleText = 'Host';
  else if (isSelf) roleText = 'You';

  return (
    <div
      className={`flex items-center gap-3 bg-surface border rounded-card p-3.5 relative transition-[border-color,background-color] duration-150 ease-snappy ${
        isSelf
          ? 'bg-accent-green-bg border-accent-green-border shadow-[inset_0_0_0_0.0625rem_rgba(52,211,153,0.06)]'
          : 'border-border hover:border-border-subtle hover:bg-elevated'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-[2.625rem] h-[2.625rem] rounded-full flex items-center justify-center font-semibold text-[1rem] shrink-0 shadow-[0_0.125rem_0.375rem_rgba(0,0,0,0.2)]"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: avatarColor }}
      >
        {initial}
      </div>

      {/* Name & role */}
      <div className="min-w-0 flex-1">
        <div className="text-[0.9375rem] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
          {name}
        </div>
        <div className={`text-[0.72rem] font-medium mt-0.5 ${isSelf ? 'text-accent-green' : 'text-text-secondary'}`}>
          {roleText}
        </div>
      </div>

      {/* Kick button */}
      {canKick && (
        <button
          className="ml-auto w-[1.75rem] h-[1.75rem] rounded-full border-none bg-accent-red-bg text-accent-red text-[0.72rem] cursor-pointer flex items-center justify-center p-0 shrink-0 transition-[background-color,color,transform] duration-150 ease-snappy hover:bg-accent-red hover:text-white active:scale-[0.97]"
          onClick={onKick}
          aria-label={`Remove ${name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
