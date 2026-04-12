import { getAvatarGradient } from '../../stores/lobby-store';
import './lobby.css';

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
      <div className="player-card player-card--empty">
        <div className="player-card__avatar">+</div>
        <div className="player-card__info">
          <div className="player-card__name">Empty</div>
        </div>
      </div>
    );
  }

  const { name, index, isSelf, isHost, canKick, onKick } = props;
  const [from, to] = getAvatarGradient(index);
  const initial = name.charAt(0).toUpperCase();
  const avatarColor = index === 0 ? '#121212' : '#fff';

  const cardClass = `player-card${isSelf ? ' player-card--self' : ''}`;

  let roleText = 'Joined';
  if (isHost && isSelf) roleText = 'Host · You';
  else if (isHost) roleText = 'Host';
  else if (isSelf) roleText = 'You';

  return (
    <div className={cardClass}>
      <div
        className="player-card__avatar"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: avatarColor }}
      >
        {initial}
      </div>
      <div className="player-card__info">
        <div className="player-card__name">{name}</div>
        <div className="player-card__role">{roleText}</div>
      </div>
      {canKick && (
        <button className="player-card__kick" onClick={onKick} aria-label={`Remove ${name}`}>
          ✕
        </button>
      )}
    </div>
  );
}
