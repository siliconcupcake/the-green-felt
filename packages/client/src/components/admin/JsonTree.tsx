import { useState, useMemo, useCallback } from 'react';

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
}

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

function ValueDisplay({ value }: { value: unknown }) {
  const type = getType(value);
  let className = 'jt-value';
  let display = '';

  switch (type) {
    case 'string':
      className += ' jt-string';
      display = `"${value}"`;
      break;
    case 'number':
      className += ' jt-number';
      display = String(value);
      break;
    case 'boolean':
      className += ' jt-boolean';
      display = String(value);
      break;
    case 'null':
      className += ' jt-null';
      display = 'null';
      break;
    default:
      display = String(value);
  }

  return <span className={className}>{display}</span>;
}

function TreeNode({ keyName, value, path, depth, maxDepth, searchTerm, forceExpanded }: TreeNodeProps) {
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

  const nodeClass = `jt-node${isMatch ? ' jt-highlight' : ''}${hasDimming ? ' jt-dim' : ''}`;

  if (!isExpandable) {
    return (
      <div className={nodeClass}>
        {keyName !== null && (
          <span className="jt-key" onClick={() => copyToClipboard(path)} title={`Copy path: ${path}`}>
            {keyName}:&nbsp;
          </span>
        )}
        <ValueDisplay value={value} />
        <button className="jt-copy-btn" onClick={() => copyToClipboard(JSON.stringify(value))} title="Copy value">
          <i className="bi bi-clipboard" />
        </button>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div className={nodeClass}>
      <div className="jt-row">
        <span className="jt-toggle" onClick={handleToggle}>
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
        {keyName !== null && (
          <span className="jt-key" onClick={() => copyToClipboard(path)} title={`Copy path: ${path}`}>
            {keyName}:&nbsp;
          </span>
        )}
        {!isExpanded && <span className="jt-preview">{getPreview(value)}</span>}
        {isExpanded && (
          <span className="jt-bracket">{type === 'array' ? `[` : `{`}</span>
        )}
      </div>
      {isExpanded && (
        <div className="jt-children">
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
              />
            );
          })}
        </div>
      )}
      {isExpanded && (
        <span className="jt-bracket">{type === 'array' ? ']' : '}'}</span>
      )}
    </div>
  );
}

export function JsonTree({ data, label }: JsonTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [forceExpanded, setForceExpanded] = useState<boolean | null>(null);

  const depthOptions = useMemo(() => [1, 2, 3, 4, 5, 10], []);

  return (
    <div className="jt-container">
      <div className="jt-toolbar">
        {label && <span className="jt-label">{label}</span>}
        <input
          className="jt-search"
          type="text"
          placeholder="Search keys/values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="jt-depth-select"
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
        <button className="jt-btn" onClick={() => setForceExpanded(true)} title="Expand All">
          <i className="bi bi-arrows-expand" />
        </button>
        <button className="jt-btn" onClick={() => setForceExpanded(false)} title="Collapse All">
          <i className="bi bi-arrows-collapse" />
        </button>
        <button
          className="jt-btn"
          onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
          title="Copy all as JSON"
        >
          <i className="bi bi-clipboard2" />
        </button>
      </div>
      <div className="jt-tree">
        <TreeNode
          keyName={null}
          value={data}
          path=""
          depth={0}
          maxDepth={maxDepth}
          searchTerm={searchTerm}
          forceExpanded={forceExpanded}
        />
      </div>
    </div>
  );
}
