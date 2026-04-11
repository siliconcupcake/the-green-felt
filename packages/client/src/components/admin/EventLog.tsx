import { useRef, useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/admin-store';

const EVENT_CATEGORIES: Record<string, string[]> = {
  Actions: ['action:dispatched'],
  State: ['state:updated', 'game:rewound'],
  Lifecycle: ['game:created', 'game:reset', 'game:over', 'game:destroyed'],
  Subscriptions: ['subscription:added', 'subscription:removed', 'view:broadcast'],
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
    <div className="admin-event-log">
      <div className="admin-event-log-header">
        <strong>Event Log</strong>
        <label className="admin-event-autoscroll">
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>
      <div className="admin-event-filters">
        {Object.entries(EVENT_CATEGORIES).map(([category, types]) => (
          <label key={category} className="admin-event-filter">
            <input
              type="checkbox"
              checked={types.every((t) => eventFilters.has(t))}
              onChange={() => types.forEach((t) => toggleEventFilter(t))}
            />
            {category}
          </label>
        ))}
      </div>
      <div className="admin-event-list">
        {filteredEvents.map((event, idx) => {
          const eventIdx = event.id ?? idx;
          const isPlayerEvent = selectedPlayerId && (event.playerId === selectedPlayerId);
          const isExpanded = expandedIds.has(eventIdx);

          return (
            <div
              key={eventIdx}
              className={`admin-event-entry${isPlayerEvent ? ' admin-event-highlight' : ''}`}
              onClick={() => toggleExpand(eventIdx)}
            >
              <span className="admin-event-time">{formatTime(event.timestamp)}</span>
              <span className={`admin-event-type admin-event-type-${event.type.split(':')[0]}`}>
                {event.type}
              </span>
              <span className="admin-event-summary">{getEventSummary(event)}</span>
              {isExpanded && (
                <pre className="admin-event-detail">{JSON.stringify(event, null, 2)}</pre>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
