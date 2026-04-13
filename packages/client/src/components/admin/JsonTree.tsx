import { useState, useMemo, useCallback } from 'react';
import { Braces, Maximize2, Minimize2, Clipboard } from 'lucide-react';

interface JsonTreeProps {
  data: unknown;
  label?: string;
}

interface TreeNodeProps {
  keyName: string | null;
  value: unknown;
  path: string;
  depth: number;
  maxDepth: number;
  searchTerm: string;
  forceExpanded: boolean | null;
  simplified: boolean;
}

// --- Card detection utilities ---

function isCardLike(v: unknown): v is { id: string; rank: string; suit: string } {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.rank === 'string' && typeof obj.suit === 'string';
}

function isCardArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0 && v.every(isCardLike);
}

function getCardId(v: unknown): string {
  if (isCardLike(v)) return v.id;
  return '?';
}

// --- Core utilities ---

function getType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getPreview(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    if (keys.length <= 3) {
      return `{ ${keys.join(', ')} }`;
    }
    return `{ ${keys.slice(0, 3).join(', ')}, ... } (${keys.length} keys)`;
  }
  return String(value);
}

function matchesSearch(key: string | null, value: unknown, searchTerm: string): boolean {
  if (!searchTerm) return false;
  const lower = searchTerm.toLowerCase();
  if (key && key.toLowerCase().includes(lower)) return true;
  if (typeof value === 'string' && value.toLowerCase().includes(lower)) return true;
  if (typeof value === 'number' && String(value).includes(searchTerm)) return true;
  if (typeof value === 'boolean' && String(value).includes(lower)) return true;
  return false;
}

function containsSearchMatch(value: unknown, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const lower = searchTerm.toLowerCase();
  if (typeof value === 'string' && value.toLowerCase().includes(lower)) return true;
  if (typeof value === 'number' && String(value).includes(searchTerm)) return true;
  if (typeof value === 'boolean' && String(value).includes(lower)) return true;
  if (Array.isArray(value)) {
    return value.some((item) => containsSearchMatch(item, searchTerm));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(
      ([k, v]) => k.toLowerCase().includes(lower) || containsSearchMatch(v, searchTerm),
    );
  }
  return false;
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback — ignore errors in dev
  });
}

// --- Simplified card array component ---

interface SimplifiedCardArrayProps {
  keyName: string | null;
  value: unknown[];
  path: string;
  searchTerm: string;
}

function SimplifiedCardArray({ keyName, value, path, searchTerm }: SimplifiedCardArrayProps) {
  const ids = value.map(getCardId);
  const lower = searchTerm.toLowerCase();
  const keyMatches = searchTerm && keyName && keyName.toLowerCase().includes(lower);
  const anyIdMatches = searchTerm && ids.some((id) => id.toLowerCase().includes(lower));
  const hasDimming = searchTerm && !keyMatches && !anyIdMatches;

  return (
    <div className={`leading-[1.6] group/leaf${hasDimming ? ' opacity-30' : ''}`}>
      {keyName !== null && (
        <span
          className="text-admin-text-key cursor-pointer transition-colors duration-100 hover:underline hover:text-admin-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          role="button"
          tabIndex={0}
          onClick={() => copyToClipboard(path)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              copyToClipboard(path);
            } else if (e.key === ' ') {
              e.preventDefault();
              copyToClipboard(path);
            }
          }}
          title={`Copy path: ${path}`}
        >
          {keyName}:&nbsp;
        </span>
      )}
      <span className="text-admin-text-muted">[</span>
      {ids.map((id, i) => {
        const idMatches = searchTerm && id.toLowerCase().includes(lower);
        return (
          <span key={i}>
            <span className={`text-admin-json-string${idMatches ? ' bg-admin-json-match font-bold' : ''}`}>{id}</span>
            {i < ids.length - 1 && <span className="text-admin-text-dim">, </span>}
          </span>
        );
      })}
      <span className="text-admin-text-muted">]</span>
      <span className="text-admin-text-dim ml-1">({value.length})</span>
      <button
        className="bg-transparent border-none text-admin-text-dim cursor-pointer text-[0.625rem] px-1 opacity-0 group-hover/leaf:opacity-100 transition-opacity duration-100 hover:text-admin-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
        onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
        title="Copy full card data"
      >
        <Clipboard size={10} />
      </button>
    </div>
  );
}

// --- Value display ---

function ValueDisplay({ value }: { value: unknown }) {
  const type = getType(value);
  let colorClass = '';
  let display = '';

  switch (type) {
    case 'string':
      colorClass = 'text-admin-json-string';
      display = `"${value}"`;
      break;
    case 'number':
      colorClass = 'text-admin-accent';
      display = String(value);
      break;
    case 'boolean':
      colorClass = 'text-admin-label';
      display = String(value);
      break;
    case 'null':
      colorClass = 'text-admin-text-dim italic';
      display = 'null';
      break;
    default:
      display = String(value);
  }

  return <span className={`inline ${colorClass}`}>{display}</span>;
}

// --- Tree node ---

function TreeNode({ keyName, value, path, depth, maxDepth, searchTerm, forceExpanded, simplified }: TreeNodeProps) {
  const type = getType(value);
  const isExpandable = type === 'object' || type === 'array';
  const defaultExpanded = depth < maxDepth;
  const [userToggled, setUserToggled] = useState<boolean | null>(null);

  const isExpanded = forceExpanded !== null ? forceExpanded : userToggled !== null ? userToggled : defaultExpanded;

  const handleToggle = useCallback(() => {
    setUserToggled((prev) => {
      const current = forceExpanded !== null ? forceExpanded : prev !== null ? prev : defaultExpanded;
      return !current;
    });
  }, [forceExpanded, defaultExpanded]);

  const isMatch = matchesSearch(keyName, value, searchTerm);
  const hasDimming = searchTerm && !isMatch && !containsSearchMatch(value, searchTerm);

  const nodeClass = `leading-[1.6] group/leaf${isMatch ? ' bg-admin-json-match' : ''}${hasDimming ? ' opacity-30' : ''}`;

  if (!isExpandable) {
    return (
      <div className={nodeClass}>
        {keyName !== null && (
          <span
            className="text-admin-text-key cursor-pointer transition-colors duration-100 hover:underline hover:text-admin-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            role="button"
            tabIndex={0}
            onClick={() => copyToClipboard(path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                copyToClipboard(path);
              } else if (e.key === ' ') {
                e.preventDefault();
                copyToClipboard(path);
              }
            }}
            title={`Copy path: ${path}`}
          >
            {keyName}:&nbsp;
          </span>
        )}
        <ValueDisplay value={value} />
        <button
          className="bg-transparent border-none text-admin-text-dim cursor-pointer text-[0.625rem] px-1 opacity-0 group-hover/leaf:opacity-100 transition-opacity duration-100 hover:text-admin-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          onClick={() => copyToClipboard(JSON.stringify(value))}
          title="Copy value"
        >
          <Clipboard size={10} />
        </button>
      </div>
    );
  }

  // Simplified mode: collapse card arrays into compact ID lists
  if (simplified && isCardArray(value)) {
    return <SimplifiedCardArray keyName={keyName} value={value as unknown[]} path={path} searchTerm={searchTerm} />;
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div className={nodeClass}>
      <div className="flex items-baseline">
        <span
          className="cursor-pointer select-none w-3.5 inline-block text-admin-text-dim shrink-0 transition-colors duration-100 hover:text-admin-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleToggle();
            } else if (e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
        {keyName !== null && (
          <span
            className="text-admin-text-key cursor-pointer transition-colors duration-100 hover:underline hover:text-admin-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            role="button"
            tabIndex={0}
            onClick={() => copyToClipboard(path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                copyToClipboard(path);
              } else if (e.key === ' ') {
                e.preventDefault();
                copyToClipboard(path);
              }
            }}
            title={`Copy path: ${path}`}
          >
            {keyName}:&nbsp;
          </span>
        )}
        {!isExpanded && <span className="text-admin-text-dim italic">{getPreview(value)}</span>}
        {isExpanded && (
          <span className="text-admin-text-muted">{type === 'array' ? `[` : `{`}</span>
        )}
      </div>
      {isExpanded && (
        <div className="pl-[1.125rem] border-l border-admin-border-subtle ml-1.5">
          {entries.map(([k, v]) => {
            const childPath = type === 'array' ? `${path}[${k}]` : path ? `${path}.${k}` : k;
            return (
              <TreeNode
                key={k}
                keyName={k}
                value={v}
                path={childPath}
                depth={depth + 1}
                maxDepth={maxDepth}
                searchTerm={searchTerm}
                forceExpanded={forceExpanded}
                simplified={simplified}
              />
            );
          })}
        </div>
      )}
      {isExpanded && (
        <span className="text-admin-text-muted">{type === 'array' ? ']' : '}'}</span>
      )}
    </div>
  );
}

// --- Root component ---

export function JsonTree({ data, label }: JsonTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [forceExpanded, setForceExpanded] = useState<boolean | null>(null);
  const [simplified, setSimplified] = useState(true);

  const depthOptions = useMemo(() => [1, 2, 3, 4, 5, 10], []);

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div className="flex items-center gap-1.5 p-1.5 border-b border-admin-border-subtle shrink-0 flex-wrap">
        {label && <span className="font-bold text-admin-label mr-2">{label}</span>}
        <input
          className="px-1.5 py-0.5 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-xs w-[8.75rem] transition-colors duration-150 focus:border-admin-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
          type="text"
          placeholder="Search keys/values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={`p-1 border cursor-pointer rounded-badge transition-all duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50 ${
              simplified
                ? 'border-admin-accent/30 bg-admin-btn-primary text-admin-accent'
                : 'border-admin-border bg-admin-btn-neutral text-admin-text hover:bg-admin-btn-neutral-hover'
            }`}
            onClick={() => setSimplified((s) => !s)}
            title={simplified ? 'Show raw JSON' : 'Show simplified view'}
            aria-label={simplified ? 'Show raw JSON' : 'Show simplified view'}
          >
            <Braces size={14} />
          </button>
          <select
            className="px-1 py-0.5 border border-admin-input-border bg-admin-input-bg text-admin-text rounded-badge font-[inherit] text-[0.6875rem] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            value={maxDepth}
            onChange={(e) => {
              setMaxDepth(Number(e.target.value));
              setForceExpanded(null);
            }}
          >
            {depthOptions.map((d) => (
              <option key={d} value={d}>
                Depth {d}
              </option>
            ))}
          </select>
          <button
            className="p-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge transition-all duration-150 hover:bg-admin-btn-neutral-hover active:scale-[0.95] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            onClick={() => setForceExpanded(true)}
            title="Expand All"
            aria-label="Expand All"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="p-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge transition-all duration-150 hover:bg-admin-btn-neutral-hover active:scale-[0.95] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            onClick={() => setForceExpanded(false)}
            title="Collapse All"
            aria-label="Collapse All"
          >
            <Minimize2 size={14} />
          </button>
          <button
            className="p-1 border border-admin-border bg-admin-btn-neutral text-admin-text cursor-pointer rounded-badge transition-all duration-150 hover:bg-admin-btn-neutral-hover active:scale-[0.95] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-accent/50"
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
            title="Copy all as JSON"
            aria-label="Copy all as JSON"
          >
            <Clipboard size={14} />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto p-1.5 flex-1">
        <TreeNode
          keyName={null}
          value={data}
          path=""
          depth={0}
          maxDepth={maxDepth}
          searchTerm={searchTerm}
          forceExpanded={forceExpanded}
          simplified={simplified}
        />
      </div>
    </div>
  );
}
