import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Loader2 } from 'lucide-react';

interface JoinFieldProps {
  initialCode?: string;
  onJoin: (gameCode: string) => void;
  disabled: boolean;
  joining?: boolean;
  error?: string | null;
}

export function JoinField({ initialCode = '', onJoin, disabled, joining, error }: JoinFieldProps) {
  const [code, setCode] = useState(initialCode);

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (trimmed) {
      onJoin(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <section>
      {/* Divider */}
      <div className="flex items-center gap-5 mb-7">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[0.8125rem] font-medium text-text-muted whitespace-nowrap">
          or join a friend
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Input group */}
      <div className="flex gap-3 max-w-[25rem] mx-auto max-md:max-w-full md:max-w-[27.5rem]">
        <input
          type="text"
          className={`flex-1 bg-surface border rounded-card py-3 px-4 text-text-primary font-sans text-[0.875rem] outline-none transition-[border-color,box-shadow] duration-150 ease-snappy placeholder:text-text-muted placeholder:normal-case focus:border-accent-green focus:shadow-[0_0_0_0.1875rem_rgba(52,211,153,0.1)] font-mono tracking-wider uppercase ${error ? 'border-accent-red' : 'border-border'}`}
          placeholder="the code please"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={6}
          aria-label="Room code"
          aria-describedby={error ? 'join-error' : undefined}
        />
        <button
          className="bg-elevated border border-accent-green-border rounded-card py-3 px-6 text-accent-green font-sans text-[0.875rem] font-semibold transition-[background-color,border-color,transform,opacity] duration-150 ease-snappy whitespace-nowrap enabled:cursor-pointer enabled:hover:bg-accent-green-bg enabled:hover:border-accent-green enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-default disabled:border-border disabled:text-text-muted"
          onClick={handleSubmit}
          disabled={disabled || !code.trim()}
        >
          {joining ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
        </button>
      </div>
      {error && (
        <div
          id="join-error"
          className="bg-accent-red-bg border border-[rgba(239,68,68,0.15)] rounded-card px-3 py-2 mt-3 max-w-[25rem] mx-auto max-md:max-w-full md:max-w-[27.5rem] text-center"
          role="alert"
        >
          <span className="text-accent-red text-[0.8125rem]">{error}</span>
        </div>
      )}
    </section>
  );
}
