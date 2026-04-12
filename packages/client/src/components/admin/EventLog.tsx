import { useRef, useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';

const EVENT_CATEGORIES: Record<string, string[]> = {
  Actions: ['action:dispatched'],
  State: ['state:updated', 'game:rewound'],
  Lifecycle: ['game:created', 'game:reset', 'game:over', 'game:destroyed'],
  Subscriptions: ['subscription:added', 'subscription:removed', 'view:broadcast'],
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  action: 'text-admin-orange',
  state: 'text-admin-blue',
  game: 'text-admin-purple',
  subscription: 'text-[#666]',
  view: 'text-admin-green',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getEventSummary(event: Record<string, unknown>): string {
  const type = event.type as string;
  switch (type) {
    case 'action:dispatched': {
      const result = event.result as string;
      const action = event.action as { type: string };
      const playerId = event.playerId as string;
      return `${playerId} ${action?.type ?? '?'} -> ${result}${event.error ? ` (${event.error})` : ''}`;
    }
    case 'state:updated':
      return `Action #${event.actionIndex}`;
    case 'game:created':
      return `${(event.players as string[])?.length ?? '?'} players, seed=${event.seed ?? 'random'}`;
    case 'game:over':
      return `Result: ${JSON.stringify(event.result)}`;
    case 'game:rewound':
      return `Rewound to action #${event.toActionIndex}`;
    case 'subscription:added':
    case 'subscription:removed':
      return `${event.playerId}`;
    case 'view:broadcast':
      return `${event.playerId} <- ${event.eventType}`;
    default:
      return '';
  }
}

export function EventLog() {
  const { events, eventFilters, toggleEventFilter, selectedPlayerId } = useAdminStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length, autoScroll]);

  const filteredEvents = events.filter((e) => eventFilters.has(e.type));

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-3 py-2 border-b border-[#333]">
        <strong>Event Log</strong>
        <label className="flex items-center gap-1 text-[#888] text-xs">
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>
      <div className="flex gap-3 px-3 py-1.5 border-b border-[#333] bg-[#16213e]">
        {Object.entries(EVENT_CATEGORIES).map(([category, types]) => (
          <label key={category} className="flex items-center gap-1 text-[#aaa] text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={types.every((t) => eventFilters.has(t))}
              onChange={() => types.forEach((t) => toggleEventFilter(t))}
            />
            {category}
          </label>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {filteredEvents.map((event, idx) => {
          const eventIdx = event.id ?? idx;
          const isPlayerEvent = selectedPlayerId && (event.playerId === selectedPlayerId);
          const isExpanded = expandedIds.has(eventIdx);
          const typePrefix = event.type.split(':')[0];
          const typeColor = EVENT_TYPE_COLORS[typePrefix] ?? '';

          return (
            <div
              key={eventIdx}
              className={`flex flex-wrap gap-1.5 px-2 py-[0.1875rem] border-b border-border-subtle cursor-pointer text-xs hover:bg-[#222] ${
                isPlayerEvent ? 'bg-[#1a2744] border-l-[0.1875rem] border-l-admin-blue' : ''
              }`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(eventIdx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  toggleExpand(eventIdx);
                } else if (e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(eventIdx);
                }
              }}
            >
              <span className="text-[#666] min-w-[3.75rem]">{formatTime(event.timestamp)}</span>
              <span className={`font-bold min-w-[8.75rem] ${typeColor}`}>
                {event.type}
              </span>
              <span className="text-[#aaa]">{getEventSummary(event)}</span>
              {isExpanded && (
                <pre className="w-full bg-[#111] p-1.5 rounded-badge mt-1 overflow-x-auto text-[0.6875rem]">
                  {JSON.stringify(event, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
