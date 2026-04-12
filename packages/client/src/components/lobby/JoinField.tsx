import { useState } from 'react';

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
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <div className="text-[0.6875rem] uppercase tracking-[0.1em] text-text-muted whitespace-nowrap">or join a friend</div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-2 max-w-[20rem] mx-auto max-md:max-w-full md:max-w-[25rem]">
        <input
          type="text"
          className={`flex-1 bg-surface border rounded-card py-3 px-4 text-text-primary font-sans text-sm outline-none transition-[border-color] duration-150 placeholder:text-text-muted focus:border-accent-green ${error ? 'border-accent-red' : 'border-border'}`}
          placeholder="Room code..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby={error ? 'join-error' : undefined}
        />
        <button
          className="bg-elevated border border-accent-green rounded-card py-3 px-5 text-accent-green font-sans text-sm font-semibold cursor-pointer transition-opacity duration-150 whitespace-nowrap hover:opacity-[0.85] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={disabled || !code.trim()}
        >
          Join
        </button>
      </div>
      {error && (
        <div id="join-error" className="text-accent-red text-xs mt-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
