import { useState } from 'react';
import './lobby.css';

interface JoinFieldProps {
  initialCode?: string;
  onJoin: (gameCode: string) => void;
  disabled: boolean;
  error?: string | null;
}

export function JoinField({ initialCode = '', onJoin, disabled, error }: JoinFieldProps) {
  const [code, setCode] = useState(initialCode);

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (trimmed) {
      onJoin(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div>
      <div className="lobby-divider">
        <div className="lobby-divider__line" />
        <div className="lobby-divider__text">or join a friend</div>
        <div className="lobby-divider__line" />
      </div>
      <div className="join-field">
        <input
          type="text"
          className={`join-field__input${error ? ' join-field__input--error' : ''}`}
          placeholder="Room code..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={error ? 'join-error' : undefined}
        />
        <button className="join-field__button" onClick={handleSubmit} disabled={disabled || !code.trim()}>
          Join
        </button>
      </div>
      {error && (
        <div id="join-error" className="lobby-error">
          {error}
        </div>
      )}
    </div>
  );
}
